package com.rms.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document("orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    private String id;

    private String tableId;
    private String customerId;
    private String customerSessionId;
    private String customerName;
    private String customerPhone;
    private List<OrderItem> items;

    private Double totalPrice;
    private Double finalPrice;
    private String note;
    private LocalDateTime createdAt;
    private String status; // Stored as String for backward compatibility.
}
