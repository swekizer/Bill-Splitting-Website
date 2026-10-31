package com.billsplit.backend.dto;

import com.billsplit.backend.entity.Bill;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillDetailDto {
    private Long id;
    private String title;
    private String imageUrl;
    private BigDecimal subTotal;
    private BigDecimal taxesTips;
    private BigDecimal total;
    private Bill.Status status;
    private LocalDateTime createdAt;
    private Long hostUserId;
    private String hostUserName;
    private String hostUserEmail;
    private Boolean isHost;
    private BigDecimal myShare;
    private Integer participantCount;
    @Builder.Default
    private List<BillItemDetailDto> items = new ArrayList<>();
}
