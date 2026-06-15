package com.rms.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DiscountRequest {
    private String code;
    private String description;
    private Double discountPercent;
    private Double minOrderAmount;
    private Double maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer usageLimit;
    private Boolean active;
}
