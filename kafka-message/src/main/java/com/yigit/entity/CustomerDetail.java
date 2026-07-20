package com.yigit.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_details")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CustomerDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String customerName;

    private String address;
    private String email;
}
