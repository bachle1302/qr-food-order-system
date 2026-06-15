package com.rms.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TableQrTokenResponse {
    private String tableId;
    private String qrToken;
}
