package com.billsplit.backend.entity;

import jakarta.annotation.Nonnull;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Nonnull
    @Column(nullable = false)
    private String imageUrl;

    private String title;

    @Nonnull
    @Column(nullable = false)
    private BigDecimal subTotal;

    @Nonnull
    @Column(nullable = false)
    private BigDecimal taxesTips;

    @Nonnull
    @Column(nullable = false)
    private BigDecimal total;

    public enum Status{
        DRAFT, ACTIVE, ARCHIVED
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Nonnull
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
