package com.rms.dto.response;

import lombok.Data;

@Data
public class DishResponse {
    private String id;
    private String name;
    private String description;
    private Double price;
    private String categoryId;
    private boolean available;
    private String imageUrl;
}
