package com.rms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private LocalDate date;
    private long totalOrders;
    private long todayOrders;
    private long pendingOrders;
    private long completedOrders;
    private long cancelledOrders;
    private double todayRevenue;
    private double monthRevenue;
    private double averageOrderValue;
    private long totalTables;
    private long activeTables;
    private long totalDishes;
    private long totalUsers;
    private List<StatusCount> ordersByStatus;
    private List<RevenuePoint> revenueSeries;
    private List<TopItem> topItems;
    private List<RecentOrder> recentOrders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenuePoint {
        private String name;
        private LocalDate date;
        private double revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopItem {
        private String dishId;
        private String name;
        private int sales;
        private double revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrder {
        private String id;
        private String tableId;
        private String tableName;
        private String customerName;
        private String customerPhone;
        private String status;
        private Double totalPrice;
        private Double finalPrice;
        private LocalDateTime createdAt;
        private List<RecentOrderItem> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrderItem {
        private String dishId;
        private String dishName;
        private int quantity;
        private Double pricePerUnit;
    }
}
