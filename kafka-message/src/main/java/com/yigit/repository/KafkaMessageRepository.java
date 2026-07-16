package com.yigit.repository;

import com.yigit.entity.KafkaMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KafkaMessageRepository extends JpaRepository<KafkaMessage, Long> {
    boolean existsByOrderId(String orderId);
}
