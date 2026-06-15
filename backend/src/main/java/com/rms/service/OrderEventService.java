package com.rms.service;

import com.rms.dto.response.OrderResponse;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface OrderEventService {
    SseEmitter subscribe();
    void publishOrderCreated(OrderResponse order);
    void publishOrderStatusChanged(OrderResponse order);
}
