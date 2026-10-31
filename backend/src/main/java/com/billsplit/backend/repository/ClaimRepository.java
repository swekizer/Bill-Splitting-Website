package com.billsplit.backend.repository;

import com.billsplit.backend.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByBillItemId(Long billItemId);
    List<Claim> findByUserId(Long userId);
    List<Claim> findByBillItemBillId(Long billId);

    @Modifying
    @Query("DELETE FROM Claim c WHERE c.billItem.bill.id = :billId")
    void deleteByBillItemBillId(@Param("billId") Long billId);
}
