package com.rms.model;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    private String orderId;
    private String dishId;
    private int quantity;
    private Double pricePerUnit; // lưu giá thời điểm tạo order (option)
    private String note;
}
