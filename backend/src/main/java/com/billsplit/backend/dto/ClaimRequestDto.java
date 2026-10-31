package com.billsplit.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRequestDto {
    private Long billItemId;
    private Double percentageClaimed; // e.g. 100.0 for full item, 33.33 for 33.33%
}
