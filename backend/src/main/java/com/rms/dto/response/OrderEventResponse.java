package com.rms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderEventResponse {
    private String type;
    private OrderResponse order;
}
