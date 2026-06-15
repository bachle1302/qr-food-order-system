package com.rms.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("dishes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dish {
    @Id
    private String id;

    private String name;
    private String description;
    private String imageUrl;


    private Double price;
    private String categoryId;
    private boolean available;
}
