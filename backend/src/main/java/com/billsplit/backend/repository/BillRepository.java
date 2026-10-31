package com.billsplit.backend.repository;

import com.billsplit.backend.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT DISTINCT b FROM Bill b " +
           "LEFT JOIN BillParticipant bp ON bp.bill = b AND bp.user.id = :userId " +
           "LEFT JOIN BillItem bi ON bi.bill = b " +
           "LEFT JOIN Claim c ON c.billItem = bi AND c.user.id = :userId " +
           "WHERE b.user.id = :userId OR bp.user.id = :userId OR c.user.id = :userId " +
           "ORDER BY b.createdAt DESC")
    List<Bill> findAllUserBills(@Param("userId") Long userId);
}
