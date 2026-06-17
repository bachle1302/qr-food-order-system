package com.rms.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CustomerSessionResponse {
    private String sessionId;
    private String customerId;
    private String customerName;
    private String customerPhone;
    private String tableId;
    private String tableName;
    private String qrToken;
    private Boolean isNewCustomer;
    private LocalDateTime startedAt;
}
