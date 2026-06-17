package com.rms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document("customerSessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSession {
    @Id
    private String id;

    private String customerId;
    private String tableId;
    private String qrToken;
    private LocalDateTime startedAt;
    private LocalDateTime lastActiveAt;
    private boolean active;
}
