package com.rms.adapter.impl;

import com.rms.adapter.PaymentGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Adapter Pattern: Adapts internal payment system to PaymentGateway interface
 * Simulates processing payments through internal system
 */
@Slf4j
@Component
public class InternalPaymentGatewayAdapter implements PaymentGateway {
    
    // Simulate transaction storage
    private final Map<String, PaymentTransaction> transactions = new HashMap<>();
    
    @Override
    public String processPayment(String orderId, Double amount, String paymentMethod) {
        log.info("Processing payment for order: {}, amount: {}, method: {}", orderId, amount, paymentMethod);
        
        // Generate transaction ID
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // Simulate payment processing
        PaymentTransaction transaction = PaymentTransaction.builder()
                .transactionId(transactionId)
                .orderId(orderId)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status("SUCCESS")
                .build();
        
        transactions.put(transactionId, transaction);
        
        log.info("Payment processed successfully. Transaction ID: {}", transactionId);
        return transactionId;
    }
    
    @Override
    public boolean verifyPayment(String transactionId) {
        PaymentTransaction transaction = transactions.get(transactionId);
        if (transaction == null) {
            log.warn("Transaction not found: {}", transactionId);
            return false;
        }
        
        boolean isSuccess = "SUCCESS".equals(transaction.getStatus());
        log.info("Verify payment {}: {}", transactionId, isSuccess);
        return isSuccess;
    }
    
    @Override
    public boolean refundPayment(String transactionId) {
        PaymentTransaction transaction = transactions.get(transactionId);
        if (transaction == null) {
            log.warn("Transaction not found for refund: {}", transactionId);
            return false;
        }
        
        transaction.setStatus("REFUNDED");
        log.info("Payment refunded: {}", transactionId);
        return true;
    }
    
    @lombok.Data
    @lombok.Builder
    private static class PaymentTransaction {
        private String transactionId;
        private String orderId;
        private Double amount;
        private String paymentMethod;
        private String status;
    }
}
