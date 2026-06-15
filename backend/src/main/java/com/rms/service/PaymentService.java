package com.rms.service;

import com.rms.dto.request.PaymentRequest;
import com.rms.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {
    PaymentResponse create(PaymentRequest request);
    PaymentResponse getById(String id);
    List<PaymentResponse> getByOrderId(String orderId);
    List<PaymentResponse> getAll();
    void delete(String id);
}
