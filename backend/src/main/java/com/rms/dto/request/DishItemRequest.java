package com.rms.dto.request;

import lombok.Data;

@Data
public class DishItemRequest {
    private String comboId;
    private String productId;
    private Integer quantity;
}
