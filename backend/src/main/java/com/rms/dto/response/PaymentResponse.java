package com.rms.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private String id;
    private String orderId;
    private Double amount;
    private String paymentMethod;
    private LocalDateTime paidAt;
}
