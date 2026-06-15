package com.rms.dto.response;

import lombok.Data;

@Data
public class DishItemResponse {
    private String id;
    private String comboId;
    private String productId;
    private Integer quantity;
}
