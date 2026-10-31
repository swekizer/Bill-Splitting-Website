package com.billsplit.backend.repository;

import com.billsplit.backend.entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BillItemRepository extends JpaRepository<BillItem, Long> {
    List<BillItem> findByBillId(Long billId);

    @Modifying
    @Query("DELETE FROM BillItem bi WHERE bi.bill.id = :billId")
    void deleteByBillId(@Param("billId") Long billId);
}
