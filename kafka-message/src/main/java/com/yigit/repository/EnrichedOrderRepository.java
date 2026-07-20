package com.yigit.repository;

import com.yigit.entity.EnrichedOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnrichedOrderRepository extends JpaRepository<EnrichedOrder, Long> {
    boolean existsByOrderId(String orderId);
}
