package com.rms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerCheckInRequest {
    @NotBlank(message = "QR token is required")
    private String qrToken;

    @NotBlank(message = "Customer name is required")
    private String name;

    private String phone;
}
