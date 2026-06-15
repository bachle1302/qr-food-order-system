package com.rms.dto.request;

import lombok.Data;

@Data
public class PaymentRequest {
    private String orderId;
    private Double amount;
    private String paymentMethod;
}
