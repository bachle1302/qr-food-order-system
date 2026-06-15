package com.rms.service;

import com.rms.dto.request.OrderItemRequest;
import com.rms.dto.request.OrderRequest;
import com.rms.dto.response.DailySummaryResponse;
import com.rms.dto.response.OrderItemResponse;
import com.rms.dto.response.OrderResponse;
import com.rms.exception.BadRequestException;
import com.rms.exception.ResourceNotFoundException;
import com.rms.model.Dish;
import com.rms.model.Order;
import com.rms.model.OrderItem;
import com.rms.model.OrderStatus;
import com.rms.model.Table;
import com.rms.repository.DishRepository;
import com.rms.repository.OrderRepository;
import com.rms.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final TableRepository tableRepository;
    private final MongoTemplate mongoTemplate;
    private final OrderEventService orderEventService;

    @Override
    public OrderResponse create(OrderRequest request) {
        if (request == null) {
            throw new BadRequestException("Order request is required");
        }
        return createForTableId(request.getTableId(), request);
    }

    @Override
    public OrderResponse createWithQrToken(OrderRequest request) {
        if (request == null) {
            throw new BadRequestException("Order request is required");
        }
        if (request.getQrToken() == null || request.getQrToken().isBlank()) {
            throw new BadRequestException("QR token is required");
        }

        Table table = tableRepository.findByQrToken(request.getQrToken())
                .orElseThrow(() -> new BadRequestException("Invalid QR token"));

        return createForTableId(table.getId(), request);
    }

    private OrderResponse createForTableId(String tableId, OrderRequest request) {
        if (tableId == null || tableId.isBlank() || !tableRepository.existsById(tableId)) {
            throw new BadRequestException("Table not found");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        // build items, calculate totals
        double total = 0.0;
        List<OrderItem> items = request.getItems().stream().map(this::toOrderItem).toList();
        for (OrderItem it : items) {
            if (it.getPricePerUnit() == null) throw new BadRequestException("Dish price missing");
            total += it.getPricePerUnit() * it.getQuantity();
        }

        Order order = Order.builder()
                .tableId(tableId)
                .items(items)
                .totalPrice(total)
                .finalPrice(total)
                .note(request.getNote())
                .createdAt(LocalDateTime.now())
                .status(OrderStatus.NEW.name())
                .build();

        orderRepository.save(order);
        OrderResponse response = toResponse(order);
        orderEventService.publishOrderCreated(response);
        return response;
    }

    private OrderItem toOrderItem(OrderItemRequest r) {
        if (r == null) {
            throw new BadRequestException("Order item is required");
        }
        if (r.getQuantity() <= 0) {
            throw new BadRequestException("Item quantity must be greater than 0");
        }
        if (r.getDishId() == null || r.getDishId().isBlank()) {
            throw new BadRequestException("Dish ID is required");
        }
        Dish d = dishRepository.findById(r.getDishId())
                .orElseThrow(() -> new BadRequestException("Dish not found: " + r.getDishId()));
        if (!d.isAvailable()) throw new BadRequestException("Dish not available: " + d.getName());
        return OrderItem.builder()
                .dishId(d.getId())
                .quantity(r.getQuantity())
                .pricePerUnit(d.getPrice())
                .note(r.getNote())
                .build();
    }

    @Override
    public OrderResponse update(String id, OrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Update only provided fields
        if (request.getTableId() != null && !request.getTableId().isEmpty()) {
            // validate table exists
            if (!tableRepository.existsById(request.getTableId())) {
                throw new BadRequestException("Table not found");
            }
            order.setTableId(request.getTableId());
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            // build items, calculate totals
            double total = 0.0;
            List<OrderItem> items = request.getItems().stream().map(this::toOrderItem).toList();
            for (OrderItem it : items) {
                if (it.getPricePerUnit() == null) throw new BadRequestException("Dish price missing");
                total += it.getPricePerUnit() * it.getQuantity();
            }
            order.setItems(items);
            order.setTotalPrice(total);
            order.setFinalPrice(total);
        }

        if (request.getNote() != null) {
            order.setNote(request.getNote());
        }

        orderRepository.save(order);
        return toResponse(order);
    }

    @Override
    public OrderResponse updateStatus(String id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        OrderStatus currentStatus = parseExistingStatus(order.getStatus());
        OrderStatus nextStatus = parseRequestedStatus(status);

        if (!currentStatus.canTransitionTo(nextStatus)) {
            throw new BadRequestException(
                    "Cannot transition order status from " + currentStatus.name() + " to " + nextStatus.name());
        }

        order.setStatus(nextStatus.name());
        orderRepository.save(order);
        OrderResponse response = toResponse(order);
        orderEventService.publishOrderStatusChanged(response);
        return response;
    }

    @Override
    public OrderResponse markPaid(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        OrderStatus currentStatus = parseExistingStatus(order.getStatus());

        if (currentStatus.isTerminal()) {
            throw new BadRequestException("Cannot mark " + currentStatus.name() + " order as PAID");
        }

        if (currentStatus == OrderStatus.PAID) {
            return toResponse(order);
        }

        // Internal payment workflow may mark an order as PAID after payment succeeds.
        order.setStatus(OrderStatus.PAID.name());
        orderRepository.save(order);
        OrderResponse response = toResponse(order);
        orderEventService.publishOrderStatusChanged(response);
        return response;
    }

    private OrderStatus parseExistingStatus(String status) {
        return OrderStatus.from(status)
                .orElseThrow(() -> new BadRequestException("Current order status is invalid: " + status));
    }

    private OrderStatus parseRequestedStatus(String status) {
        return OrderStatus.from(status)
                .orElseThrow(() -> new BadRequestException("Invalid order status: " + status));
    }

    @Override
    public OrderResponse getById(String id) {
        return orderRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    @Override
    public List<OrderResponse> getAll() {
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<OrderResponse> getByTableId(String tableId) {
        return orderRepository.findByTableId(tableId).stream().map(this::toResponse).toList();
    }

    @Override
    public List<OrderResponse> getManageOrders(String status, String tableId, LocalDate fromDate, LocalDate toDate) {
        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();

        if (status != null && !status.isBlank()) {
            criteria.add(Criteria.where("status").is(parseRequestedStatus(status).name()));
        }

        if (tableId != null && !tableId.isBlank()) {
            criteria.add(Criteria.where("tableId").is(tableId));
        }

        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate must be before or equal to toDate");
        }

        if (fromDate != null || toDate != null) {
            Criteria createdAtCriteria = Criteria.where("createdAt");
            if (fromDate != null) {
                createdAtCriteria = createdAtCriteria.gte(fromDate.atStartOfDay());
            }
            if (toDate != null) {
                createdAtCriteria = createdAtCriteria.lt(toDate.plusDays(1).atStartOfDay());
            }
            criteria.add(createdAtCriteria);
        }

        if (!criteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(Criteria[]::new)));
        }

        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        return mongoTemplate.find(query, Order.class).stream().map(this::toResponse).toList();
    }

    @Override
    public List<OrderResponse> getNewOrdersForManagement() {
        return orderRepository.findByStatusOrderByCreatedAtAsc(OrderStatus.NEW.name())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<OrderResponse> getKitchenOrders() {
        List<String> kitchenStatuses = Arrays.asList(
                OrderStatus.CONFIRMED.name(),
                OrderStatus.PREPARING.name(),
                OrderStatus.READY.name());
        return orderRepository.findByStatusInOrderByCreatedAtAsc(kitchenStatuses)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void delete(String id) {
        if (!orderRepository.existsById(id)) throw new ResourceNotFoundException("Order not found");
        orderRepository.deleteById(id);
    }

    @Override
    public DailySummaryResponse getDailySummary(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
        
        List<Order> orders = orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
        
        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus()))
                .count();
        long cancelledOrders = orders.stream()
                .filter(o -> "CANCELLED".equalsIgnoreCase(o.getStatus()))
                .count();
        long pendingOrders = orders.stream()
                .filter(o -> !"COMPLETED".equalsIgnoreCase(o.getStatus()) 
                        && !"CANCELLED".equalsIgnoreCase(o.getStatus()))
                .count();
        
        double totalRevenue = orders.stream()
                .filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus()))
                .mapToDouble(o -> o.getFinalPrice() != null ? o.getFinalPrice() : 0.0)
                .sum();
        
        double averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0.0;
        
        List<String> orderIds = orders.stream()
                .map(Order::getId)
                .collect(java.util.stream.Collectors.toList());
        
        return DailySummaryResponse.builder()
                .date(date)
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .pendingOrders(pendingOrders)
                .totalRevenue(totalRevenue)
                .averageOrderValue(averageOrderValue)
                .orderIds(orderIds)
                .build();
    }

    @Override
    public double calculateRevenueByDay(String date) {
        LocalDate targetDate = LocalDate.parse(date);
        return orderRepository.findAll().stream()
                .filter(order -> order.getCreatedAt().toLocalDate().equals(targetDate))
                .mapToDouble(Order::getFinalPrice)
                .sum();
    }

    @Override
    public double calculateRevenueByMonth(String month) {
        int targetMonth = Integer.parseInt(month.split("-")[1]);
        int targetYear = Integer.parseInt(month.split("-")[0]);
        return orderRepository.findAll().stream()
                .filter(order -> order.getCreatedAt().getYear() == targetYear &&
                        order.getCreatedAt().getMonthValue() == targetMonth)
                .mapToDouble(Order::getFinalPrice)
                .sum();
    }

    private OrderResponse toResponse(Order o) {
        OrderResponse r = new OrderResponse();
        r.setId(o.getId());
        r.setTableId(o.getTableId());
        r.setTotalPrice(o.getTotalPrice());
        r.setFinalPrice(o.getFinalPrice());
        r.setNote(o.getNote());
        r.setCreatedAt(o.getCreatedAt());
        r.setStatus(o.getStatus());
        List<OrderItemResponse> items = o.getItems().stream().map(it -> {
            OrderItemResponse ir = new OrderItemResponse();
            ir.setOrderId(o.getId());
            ir.setDishId(it.getDishId());
            ir.setQuantity(it.getQuantity());
            ir.setPricePerUnit(it.getPricePerUnit());
            ir.setNote(it.getNote());
            return ir;
        }).toList();
        r.setItems(items);
        return r;
    }
}
