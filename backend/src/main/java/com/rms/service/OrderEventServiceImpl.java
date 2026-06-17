package com.rms.service;

import com.rms.dto.response.OrderEventResponse;
import com.rms.dto.response.OrderResponse;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
public class OrderEventServiceImpl implements OrderEventService {

    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;
    private static final String ORDER_CREATED = "ORDER_CREATED";
    private static final String ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED";

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @Override
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            emitter.complete();
        });
        emitter.onError(error -> emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException ex) {
            emitters.remove(emitter);
            emitter.completeWithError(ex);
        }

        return emitter;
    }

    @Override
    public void publishOrderCreated(OrderResponse order) {
        broadcast("order-created", new OrderEventResponse(ORDER_CREATED, order));
    }

    @Override
    public void publishOrderStatusChanged(OrderResponse order) {
        broadcast("order-status-changed", new OrderEventResponse(ORDER_STATUS_CHANGED, order));
    }

    private void broadcast(String eventName, OrderEventResponse payload) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException | IllegalStateException ex) {
                emitters.remove(emitter);
                try {
                    emitter.completeWithError(ex);
                } catch (IllegalStateException completeEx) {
                    log.debug("SSE emitter was already completed");
                }
            }
        }
    }
}
