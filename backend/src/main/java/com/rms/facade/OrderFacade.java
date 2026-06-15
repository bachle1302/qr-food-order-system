package com.rms.facade;

import com.rms.dto.request.OrderRequest;
import com.rms.dto.request.PaymentRequest;
import com.rms.dto.response.OrderResponse;
import com.rms.dto.response.PaymentResponse;
import com.rms.adapter.PaymentGateway;
import com.rms.service.OrderService;
import com.rms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Facade Pattern: Simplifies complex order and payment workflow
 * Hides the complexity of coordinating multiple services (Order, Payment, PaymentGateway)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderFacade {
    
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final PaymentGateway paymentGateway;
    
    /**
     * Facade method: Create order with complete workflow
     * Internally coordinates: Order creation → Validation → Response
     */
    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        log.info("Facade: Creating order for table {}", request.getTableId());
        
        // Step 1: Create order through service
        OrderResponse orderResponse = orderService.create(request);
        
        log.info("Facade: Order created successfully with ID: {}", orderResponse.getId());
        
        return orderResponse;
    }

    @Transactional
    public OrderResponse createOrderWithQrToken(OrderRequest request) {
        log.info("Facade: Creating order from QR token");

        OrderResponse orderResponse = orderService.createWithQrToken(request);

        log.info("Facade: QR order created successfully with ID: {}", orderResponse.getId());

        return orderResponse;
    }
    
    /**
     * Facade method: Create order and process payment in one operation
     * Internally coordinates: Order creation → Payment gateway → Payment record → Order status update
     */
    @Transactional
    public OrderPaymentResult createOrderWithPayment(OrderRequest orderRequest, String paymentMethod) {
        log.info("Facade: Creating order with payment for table {}", orderRequest.getTableId());
        
        // Step 1: Create order
        OrderResponse orderResponse = orderService.create(orderRequest);
        log.info("Facade: Order created with ID: {}", orderResponse.getId());
        
        // Step 2: Process payment through gateway (Adapter Pattern)
        String transactionId = paymentGateway.processPayment(
                orderResponse.getId(),
                orderResponse.getFinalPrice(),
                paymentMethod
        );
        log.info("Facade: Payment processed. Transaction ID: {}", transactionId);
        
        // Step 3: Verify payment
        boolean paymentSuccess = paymentGateway.verifyPayment(transactionId);
        
        if (!paymentSuccess) {
            log.error("Facade: Payment verification failed for transaction {}", transactionId);
            throw new RuntimeException("Payment verification failed");
        }
        
        // Step 4: Record payment
        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setOrderId(orderResponse.getId());
        paymentRequest.setAmount(orderResponse.getFinalPrice());
        paymentRequest.setPaymentMethod(paymentMethod);
        
        PaymentResponse paymentResponse = paymentService.create(paymentRequest);
        log.info("Facade: Payment recorded with ID: {}", paymentResponse.getId());
        
        // Step 5: Mark order as paid after successful payment workflow
        orderService.markPaid(orderResponse.getId());
        log.info("Facade: Order status updated to PAID");
        
        return OrderPaymentResult.builder()
                .order(orderResponse)
                .payment(paymentResponse)
                .transactionId(transactionId)
                .build();
    }
    
    /**
     * Facade method: Get complete order details with payment info
     */
    public OrderPaymentResult getOrderWithPayment(String orderId) {
        log.info("Facade: Retrieving order with payment for ID: {}", orderId);
        
        OrderResponse orderResponse = orderService.getById(orderId);
        
        // Get all payments for this order
        var payments = paymentService.getByOrderId(orderId);
        PaymentResponse paymentResponse = payments.isEmpty() ? null : payments.get(0);
        
        return OrderPaymentResult.builder()
                .order(orderResponse)
                .payment(paymentResponse)
                .build();
    }
    
    /**
     * Facade method: Get revenue by day
     */
    public double getRevenueByDay(String date) {
        log.info("Facade: Calculating revenue for date: {}", date);
        return orderService.calculateRevenueByDay(date);
    }

    /**
     * Facade method: Get revenue by month
     */
    public double getRevenueByMonth(String month) {
        log.info("Facade: Calculating revenue for month: {}", month);
        return orderService.calculateRevenueByMonth(month);
    }
    
    /**
     * Result object for order + payment operations
     */
    @lombok.Data
    @lombok.Builder
    public static class OrderPaymentResult {
        private OrderResponse order;
        private PaymentResponse payment;
        private String transactionId;
    }
}
