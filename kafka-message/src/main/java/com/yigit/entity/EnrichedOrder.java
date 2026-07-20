package com.yigit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "enriched_orders",
        uniqueConstraints = @UniqueConstraint(name = "uq_enriched_orders_order_id", columnNames = "orderId"))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EnrichedOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderId;
    private String customerName;
    private Double amount;
    
    // Enriched fields
    private String address;
    private String email;

    private LocalDateTime receivedAt;
}
