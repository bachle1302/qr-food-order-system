package com.rms.dto.request;

import lombok.Data;

@Data
public class DishRequest {
    private String name;
    private String description;
    private Double price;
    private String categoryId;
    private Boolean available;
    private String imageUrl;
}
