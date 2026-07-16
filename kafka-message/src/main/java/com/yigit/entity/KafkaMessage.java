package com.yigit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "kafka_messages",
        uniqueConstraints = @UniqueConstraint(name = "uq_kafka_messages_order_id", columnNames = "orderId"))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class KafkaMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderId;
    private String customerName;
    private Double amount;
    private LocalDateTime receivedAt;
}
