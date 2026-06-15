package com.rms.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("tables")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Table {

    @Id
    private String id;

    private String name;

    private int seats;

    private String qrToken;

    private boolean available; // true = empty, false = in use
}
