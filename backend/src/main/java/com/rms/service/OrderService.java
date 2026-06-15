package com.rms.service;

import com.rms.dto.request.OrderRequest;
import com.rms.dto.response.DailySummaryResponse;
import com.rms.dto.response.OrderResponse;

import java.time.LocalDate;
import java.util.List;

public interface OrderService {
    OrderResponse create(OrderRequest request);
    OrderResponse createWithQrToken(OrderRequest request);
    OrderResponse update(String id, OrderRequest request);
    OrderResponse updateStatus(String id, String status);
    OrderResponse markPaid(String id);
    OrderResponse getById(String id);
    List<OrderResponse> getAll();
    List<OrderResponse> getByTableId(String tableId);
    void delete(String id);
    DailySummaryResponse getDailySummary(LocalDate date);

    /**
     * Calculate revenue for a specific day
     */
    double calculateRevenueByDay(String date);

    /**
     * Calculate revenue for a specific month
     */
    double calculateRevenueByMonth(String month);
}
