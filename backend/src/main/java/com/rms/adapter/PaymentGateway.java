package com.rms.adapter;

/**
 * Adapter Pattern: Interface for external payment gateways
 */
public interface PaymentGateway {
    
    /**
     * Process payment transaction
     * @param orderId Order ID
     * @param amount Payment amount
     * @param paymentMethod Payment method (CASH, CARD, TRANSFER)
     * @return Transaction ID or confirmation code
     */
    String processPayment(String orderId, Double amount, String paymentMethod);
    
    /**
     * Verify payment status
     * @param transactionId Transaction ID
     * @return true if payment is successful
     */
    boolean verifyPayment(String transactionId);
    
    /**
     * Refund payment
     * @param transactionId Transaction ID
     * @return true if refund is successful
     */
    boolean refundPayment(String transactionId);
}
