package com.rms.dto.response;

import lombok.Data;

@Data
public class TableResponse {
    private String id;
    private String name;
    private int seats;
    private boolean available;
}
