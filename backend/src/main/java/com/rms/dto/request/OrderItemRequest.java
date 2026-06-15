package com.rms.dto.request;

import lombok.Data;

@Data
public class OrderItemRequest {
    private String dishId;
    private int quantity;
    private String note;
}
