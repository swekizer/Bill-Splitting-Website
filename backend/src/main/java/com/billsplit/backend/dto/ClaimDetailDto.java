package com.billsplit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimDetailDto {
    private Long id;
    private Long billItemId;
    private Long userId;
    private String userName;
    private String userEmail;
    private Double percentageClaimed;
    private BigDecimal amountDue;
    private LocalDateTime createdAt;
}
