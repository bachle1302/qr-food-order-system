package com.rms.model;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public enum OrderStatus {
    NEW,
    CONFIRMED,
    PREPARING,
    READY,
    SERVED,
    PAID,
    CANCELLED,
    COMPLETED;

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(NEW, EnumSet.of(CONFIRMED, CANCELLED));
        ALLOWED_TRANSITIONS.put(CONFIRMED, EnumSet.of(PREPARING, CANCELLED));
        ALLOWED_TRANSITIONS.put(PREPARING, EnumSet.of(READY, CANCELLED));
        ALLOWED_TRANSITIONS.put(READY, EnumSet.of(SERVED, CANCELLED));
        ALLOWED_TRANSITIONS.put(SERVED, EnumSet.of(PAID, COMPLETED));
        ALLOWED_TRANSITIONS.put(PAID, EnumSet.of(COMPLETED));
        ALLOWED_TRANSITIONS.put(CANCELLED, Collections.emptySet());
        ALLOWED_TRANSITIONS.put(COMPLETED, Collections.emptySet());
    }

    public static Optional<OrderStatus> from(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(OrderStatus.valueOf(value.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public boolean canTransitionTo(OrderStatus nextStatus) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Collections.emptySet()).contains(nextStatus);
    }

    public Set<OrderStatus> allowedNextStatuses() {
        return Collections.unmodifiableSet(ALLOWED_TRANSITIONS.getOrDefault(this, Collections.emptySet()));
    }

    public boolean isTerminal() {
        return this == CANCELLED || this == COMPLETED;
    }
}
