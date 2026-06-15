package com.rms.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private String id;
    private String tableId;
    private List<OrderItemResponse> items;
    private Double totalPrice;
    private Double finalPrice;
    private String note;
    private LocalDateTime createdAt;
    private String status;
}
