package com.rms.service;

import com.rms.dto.response.AdminDashboardResponse;
import com.rms.model.Dish;
import com.rms.model.Order;
import com.rms.model.OrderItem;
import com.rms.model.OrderStatus;
import com.rms.model.Table;
import com.rms.repository.DishRepository;
import com.rms.repository.OrderRepository;
import com.rms.repository.TableRepository;
import com.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private static final List<String> REVENUE_STATUSES = List.of(
            OrderStatus.PAID.name(),
            OrderStatus.COMPLETED.name());
    private static final List<String> TERMINAL_STATUSES = List.of(
            OrderStatus.PAID.name(),
            OrderStatus.COMPLETED.name(),
            OrderStatus.CANCELLED.name());

    private final OrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final TableRepository tableRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public AdminDashboardResponse getDashboard(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();
        LocalDateTime startOfMonth = targetDate.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = targetDate.plusMonths(1).withDayOfMonth(1).atStartOfDay();
        LocalDate startChartDate = targetDate.minusDays(6);
        LocalDateTime startOfChart = startChartDate.atStartOfDay();

        List<Order> todayOrders = orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
        List<Order> monthOrders = orderRepository.findByCreatedAtBetween(startOfMonth, endOfMonth);
        List<Order> chartOrders = orderRepository.findByCreatedAtBetween(startOfChart, endOfDay);
        List<Order> recentOrders = findRecentOrders(5);
        List<Order> activeOrders = findActiveOrders();
        List<Dish> dishes = dishRepository.findAll();
        List<Table> tables = tableRepository.findAll();

        Map<String, Dish> dishById = dishes.stream()
                .collect(Collectors.toMap(Dish::getId, Function.identity(), (first, second) -> first));
        Map<String, String> tableNameById = tables.stream()
                .collect(Collectors.toMap(Table::getId, Table::getName, (first, second) -> first));

        long completedOrders = todayOrders.stream()
                .filter(order -> OrderStatus.COMPLETED.name().equalsIgnoreCase(order.getStatus()))
                .count();
        long cancelledOrders = todayOrders.stream()
                .filter(order -> OrderStatus.CANCELLED.name().equalsIgnoreCase(order.getStatus()))
                .count();
        long pendingOrders = todayOrders.stream()
                .filter(order -> !TERMINAL_STATUSES.contains(normalizeStatus(order.getStatus())))
                .count();
        double todayRevenue = sumRevenue(todayOrders);
        double monthRevenue = sumRevenue(monthOrders);
        double averageOrderValue = completedOrders > 0 ? todayRevenue / completedOrders : 0.0;

        return AdminDashboardResponse.builder()
                .date(targetDate)
                .totalOrders(orderRepository.count())
                .todayOrders(todayOrders.size())
                .pendingOrders(pendingOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .averageOrderValue(averageOrderValue)
                .totalTables(tables.size())
                .activeTables(activeOrders.stream().map(Order::getTableId).distinct().count())
                .totalDishes(dishes.size())
                .totalUsers(userRepository.count())
                .ordersByStatus(buildStatusCounts(todayOrders))
                .revenueSeries(buildRevenueSeries(chartOrders, startChartDate, targetDate))
                .topItems(buildTopItems(monthOrders, dishById))
                .recentOrders(buildRecentOrders(recentOrders, dishById, tableNameById))
                .build();
    }

    private List<Order> findRecentOrders(int limit) {
        Query query = new Query()
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .limit(limit);
        return mongoTemplate.find(query, Order.class);
    }

    private List<Order> findActiveOrders() {
        Query query = new Query();
        query.addCriteria(Criteria.where("status").nin(TERMINAL_STATUSES));
        return mongoTemplate.find(query, Order.class);
    }

    private List<AdminDashboardResponse.StatusCount> buildStatusCounts(List<Order> orders) {
        Map<String, Long> countByStatus = orders.stream()
                .collect(Collectors.groupingBy(
                        order -> normalizeStatus(order.getStatus()),
                        LinkedHashMap::new,
                        Collectors.counting()));

        return countByStatus.entrySet().stream()
                .map(entry -> AdminDashboardResponse.StatusCount.builder()
                        .status(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();
    }

    private List<AdminDashboardResponse.RevenuePoint> buildRevenueSeries(
            List<Order> orders,
            LocalDate startDate,
            LocalDate endDate) {
        List<AdminDashboardResponse.RevenuePoint> series = new ArrayList<>();
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            LocalDate day = currentDate;
            double revenue = orders.stream()
                    .filter(order -> order.getCreatedAt() != null)
                    .filter(order -> order.getCreatedAt().toLocalDate().equals(day))
                    .filter(this::isRevenueOrder)
                    .mapToDouble(this::getOrderTotal)
                    .sum();
            series.add(AdminDashboardResponse.RevenuePoint.builder()
                    .name(getVietnameseWeekday(day))
                    .date(day)
                    .revenue(revenue)
                    .build());
            currentDate = currentDate.plusDays(1);
        }
        return series;
    }

    private List<AdminDashboardResponse.TopItem> buildTopItems(
            List<Order> orders,
            Map<String, Dish> dishById) {
        Map<String, TopItemAccumulator> salesByDishId = new LinkedHashMap<>();

        orders.stream()
                .filter(this::isRevenueOrder)
                .filter(order -> order.getItems() != null)
                .flatMap(order -> order.getItems().stream())
                .forEach(item -> {
                    TopItemAccumulator current = salesByDishId.computeIfAbsent(
                            item.getDishId(),
                            dishId -> new TopItemAccumulator(dishId, 0, 0.0));
                    current.sales += item.getQuantity();
                    current.revenue += item.getQuantity() * safePrice(item.getPricePerUnit());
                });

        return salesByDishId.values().stream()
                .sorted(Comparator.comparingInt(TopItemAccumulator::sales).reversed())
                .limit(4)
                .map(item -> {
                    Dish dish = dishById.get(item.dishId);
                    return AdminDashboardResponse.TopItem.builder()
                            .dishId(item.dishId)
                            .name(dish != null ? dish.getName() : item.dishId)
                            .sales(item.sales)
                            .revenue(item.revenue)
                            .build();
                })
                .toList();
    }

    private List<AdminDashboardResponse.RecentOrder> buildRecentOrders(
            List<Order> orders,
            Map<String, Dish> dishById,
            Map<String, String> tableNameById) {
        return orders.stream()
                .map(order -> AdminDashboardResponse.RecentOrder.builder()
                        .id(order.getId())
                        .tableId(order.getTableId())
                        .tableName(tableNameById.get(order.getTableId()))
                        .customerName(order.getCustomerName())
                        .customerPhone(order.getCustomerPhone())
                        .status(order.getStatus())
                        .totalPrice(order.getTotalPrice())
                        .finalPrice(order.getFinalPrice())
                        .createdAt(order.getCreatedAt())
                        .items(buildRecentOrderItems(order.getItems(), dishById))
                        .build())
                .toList();
    }

    private List<AdminDashboardResponse.RecentOrderItem> buildRecentOrderItems(
            List<OrderItem> items,
            Map<String, Dish> dishById) {
        if (items == null) {
            return List.of();
        }

        return items.stream()
                .map(item -> {
                    Dish dish = dishById.get(item.getDishId());
                    return AdminDashboardResponse.RecentOrderItem.builder()
                            .dishId(item.getDishId())
                            .dishName(dish != null ? dish.getName() : item.getDishId())
                            .quantity(item.getQuantity())
                            .pricePerUnit(item.getPricePerUnit())
                            .build();
                })
                .toList();
    }

    private double sumRevenue(List<Order> orders) {
        return orders.stream()
                .filter(this::isRevenueOrder)
                .mapToDouble(this::getOrderTotal)
                .sum();
    }

    private boolean isRevenueOrder(Order order) {
        return REVENUE_STATUSES.contains(normalizeStatus(order.getStatus()));
    }

    private double getOrderTotal(Order order) {
        return order.getFinalPrice() != null ? order.getFinalPrice() : safePrice(order.getTotalPrice());
    }

    private double safePrice(Double value) {
        return value != null ? value : 0.0;
    }

    private String normalizeStatus(String status) {
        return status != null ? status.toUpperCase() : "";
    }

    private String getVietnameseWeekday(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }

    private static class TopItemAccumulator {
        private final String dishId;
        private int sales;
        private double revenue;

        private TopItemAccumulator(String dishId, int sales, double revenue) {
            this.dishId = dishId;
            this.sales = sales;
            this.revenue = revenue;
        }

        private int sales() {
            return sales;
        }
    }
}
