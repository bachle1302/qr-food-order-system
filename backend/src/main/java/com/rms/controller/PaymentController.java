package com.rms.controller;

import com.rms.dto.request.PaymentRequest;
import com.rms.dto.response.PaymentResponse;
import com.rms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public PaymentResponse create(@RequestBody PaymentRequest request) {
        return paymentService.create(request);
    }

    @GetMapping("/{id}")
    public PaymentResponse getById(@PathVariable String id) {
        return paymentService.getById(id);
    }

    @GetMapping("/order/{orderId}")
    public List<PaymentResponse> getByOrderId(@PathVariable String orderId) {
        return paymentService.getByOrderId(orderId);
    }

    @GetMapping
    public List<PaymentResponse> getAll() {
        return paymentService.getAll();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        paymentService.delete(id);
    }
}
