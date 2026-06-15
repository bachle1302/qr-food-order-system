package com.rms.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DiscountResponse {
    private String id;
    private String code;
    private String description;
    private Double discountPercent;
    private Double minOrderAmount;
    private Double maxDiscountAmount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer usageLimit;
    private Integer usageCount;
    private Boolean active;
}
