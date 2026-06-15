package com.rms.adapter.impl;

import com.rms.adapter.EntityDtoAdapter;
import com.rms.dto.response.PaymentResponse;
import com.rms.model.Payment;
import org.springframework.stereotype.Component;

/**
 * Adapter Pattern: Converts between Payment entity and PaymentResponse DTO
 */
@Component
public class PaymentResponseAdapter implements EntityDtoAdapter<Payment, PaymentResponse> {
    
    @Override
    public PaymentResponse toDto(Payment entity) {
        if (entity == null) {
            return null;
        }
        
        PaymentResponse response = new PaymentResponse();
        response.setId(entity.getId());
        response.setOrderId(entity.getOrderId());
        response.setAmount(entity.getAmount());
        response.setPaymentMethod(entity.getPaymentMethod());
        response.setPaidAt(entity.getPaidAt());
        return response;
    }
    
    @Override
    public Payment toEntity(PaymentResponse dto) {
        if (dto == null) {
            return null;
        }
        
        return Payment.builder()
                .id(dto.getId())
                .orderId(dto.getOrderId())
                .amount(dto.getAmount())
                .paymentMethod(dto.getPaymentMethod())
                .paidAt(dto.getPaidAt())
                .build();
    }
}
