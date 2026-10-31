package com.billsplit.backend.repository;

import com.billsplit.backend.entity.BillParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BillParticipantRepository extends JpaRepository<BillParticipant, Long> {
    Optional<BillParticipant> findByBillIdAndUserId(Long billId, Long userId);
    List<BillParticipant> findByBillId(Long billId);
    List<BillParticipant> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM BillParticipant bp WHERE bp.bill.id = :billId")
    void deleteByBillId(@Param("billId") Long billId);
}
