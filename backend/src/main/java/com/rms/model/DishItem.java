package com.rms.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("dishItems")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DishItem {
    @Id
    private String id;

    private String comboId;
    private String productId;
    private Integer quantity;
}
