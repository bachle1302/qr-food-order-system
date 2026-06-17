package com.rms.security.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rms.dto.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties properties;
    private final InMemoryRateLimiter rateLimiter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!properties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        String ruleName = null;
        int limit = 0;

        if ("POST".equalsIgnoreCase(method) && "/api/orders/public/qr".equals(path)) {
            ruleName = "public-order-create";
            limit = properties.getPublicOrderPerMinute();
        } else if ("POST".equalsIgnoreCase(method) && "/api/customer-sessions/check-in".equals(path)) {
            ruleName = "customer-check-in";
            limit = properties.getCheckInPerMinute();
        } else if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/orders/public/session/")) {
            ruleName = "customer-order-status";
            limit = properties.getStatusPerMinute();
        } else if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/tables/qr/")) {
            ruleName = "table-qr";
            limit = properties.getTableQrPerMinute();
        }

        if (ruleName == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = getClientIp(request);
        String rateLimitKey = ip + ":" + ruleName;

        if (!rateLimiter.isAllowed(rateLimitKey, limit)) {
            int retryAfter = rateLimiter.getRetryAfterSeconds(rateLimitKey);
            sendErrorResponse(response, retryAfter);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xfHeader)) {
            // X-Forwarded-For can contain multiple proxy IPs: client, proxy1, proxy2.
            // We want the client IP, which is the first one.
            return xfHeader.split(",")[0].trim();
        }
        
        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp)) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private void sendErrorResponse(HttpServletResponse response, int retryAfterSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

        ApiResponse<Void> apiResponse = ApiResponse.error("Bạn thao tác quá nhanh, vui lòng thử lại sau.");

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
