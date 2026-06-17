package com.rms.security.ratelimit;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class InMemoryRateLimiter {

    private static class RateLimitState {
        final long windowStart;
        final AtomicInteger count;

        RateLimitState(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(count);
        }
    }

    private final ConcurrentHashMap<String, RateLimitState> limiters = new ConcurrentHashMap<>();

    /**
     * Checks if the request is allowed under the rate limit.
     *
     * @param key the rate limit key (e.g. IP + endpoint group)
     * @param limit the max requests allowed in a 1-minute window
     * @return true if the request is allowed, false if rate limit is exceeded
     */
    public boolean isAllowed(String key, int limit) {
        long now = System.currentTimeMillis();
        
        // Opportunistic cleanup: if map size gets too large, clear expired entries
        if (limiters.size() > 50000) {
            cleanupExpired(now);
        }

        RateLimitState state = limiters.compute(key, (k, existing) -> {
            if (existing == null || (now - existing.windowStart) >= 60000) {
                return new RateLimitState(now, 1);
            } else {
                existing.count.incrementAndGet();
                return existing;
            }
        });

        return state.count.get() <= limit;
    }

    /**
     * Gets the remaining seconds in the current window for a key.
     */
    public int getRetryAfterSeconds(String key) {
        RateLimitState state = limiters.get(key);
        if (state == null) {
            return 60;
        }
        long elapsed = System.currentTimeMillis() - state.windowStart;
        long remainingMs = 60000 - elapsed;
        return Math.max(1, (int) (remainingMs / 1000));
    }

    private void cleanupExpired(long now) {
        limiters.entrySet().removeIf(entry -> (now - entry.getValue().windowStart) >= 60000);
    }
}
