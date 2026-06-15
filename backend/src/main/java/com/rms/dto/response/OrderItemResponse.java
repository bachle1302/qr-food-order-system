package com.rms.dto.response;

import lombok.Data;

@Data
public class OrderItemResponse {
    private String orderId;
    private String dishId;
    private int quantity;
    private Double pricePerUnit;
    private String note;
}
