package com.rms.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document("discounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Discount {
    @Id
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
