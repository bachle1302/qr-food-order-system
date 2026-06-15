package com.rms.controller;

import com.rms.dto.request.OrderRequest;
import com.rms.dto.request.UpdateOrderStatusRequest;
import com.rms.dto.response.DailySummaryResponse;
import com.rms.dto.response.OrderResponse;
import com.rms.facade.OrderFacade;
import com.rms.service.OrderService;
import jakarta.validation.Valid;

import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderFacade orderFacade; // Using Facade Pattern

    @PostMapping
    public OrderResponse create(@RequestBody OrderRequest req) {
        // Using Facade Pattern for simplified order creation
        return orderFacade.createOrder(req);
    }

    // API PUBLIC — không yêu cầu token
    @PostMapping("/public")
    public OrderResponse createPublic(@RequestBody OrderRequest req) {
        // Using Facade Pattern for public order creation
        return orderFacade.createOrder(req);
    }

    @PostMapping("/public/qr")
    public OrderResponse createPublicByQrToken(@RequestBody OrderRequest req) {
        return orderFacade.createOrderWithQrToken(req);
    }
    
    /**
     * Create order with payment in one call (using Facade Pattern)
     */
    @PostMapping("/with-payment")
    public OrderFacade.OrderPaymentResult createWithPayment(
            @RequestBody OrderRequest req,
            @RequestParam String paymentMethod) {
        // Using Facade Pattern to handle complex workflow
        return orderFacade.createOrderWithPayment(req, paymentMethod);
    }
    
    /**
     * Get order with payment details (using Facade Pattern)
     */
    @GetMapping("/{id}/with-payment")
    public OrderFacade.OrderPaymentResult getWithPayment(@PathVariable String id) {
        // Using Facade Pattern to get complete order information
        return orderFacade.getOrderWithPayment(id);
    }

    @GetMapping("/manage")
    public List<OrderResponse> getManageOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tableId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return orderService.getManageOrders(status, tableId, fromDate, toDate);
    }

    @GetMapping("/manage/new")
    public List<OrderResponse> getNewOrdersForManagement() {
        return orderService.getNewOrdersForManagement();
    }

    @GetMapping("/manage/kitchen")
    public List<OrderResponse> getKitchenOrders() {
        return orderService.getKitchenOrders();
    }

    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable String id) {
        return orderService.getById(id);
    }

    @GetMapping
    public List<OrderResponse> getAll(@RequestParam(required = false) String tableId) {
        if (tableId != null) return orderService.getByTableId(tableId);
        return orderService.getAll();
    }

    @PutMapping("/{id}")
    public OrderResponse update(@PathVariable String id, @RequestBody OrderRequest req) {
        return orderService.update(id, req);
    }

    @PutMapping("/{id}/status")
    public OrderResponse updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request.getStatus());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        orderService.delete(id);
    }

    @GetMapping("/summary/daily")
    public DailySummaryResponse getDailySummary(
            @RequestParam(required = false) String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return orderService.getDailySummary(targetDate);
    }

    @GetMapping("/revenue/daily")
    public double getDailyRevenue(@RequestParam String date) {
        return orderService.calculateRevenueByDay(date);
    }

    @GetMapping("/revenue/monthly")
    public double getMonthlyRevenue(@RequestParam String month) {
        return orderService.calculateRevenueByMonth(month);
    }
}
