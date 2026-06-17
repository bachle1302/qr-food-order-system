package com.rms.security.ratelimit;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {
    private boolean enabled = true;
    private int publicOrderPerMinute = 10;
    private int checkInPerMinute = 20;
    private int statusPerMinute = 60;
    private int tableQrPerMinute = 60;
}
