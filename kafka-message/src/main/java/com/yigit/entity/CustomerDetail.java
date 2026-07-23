package com.yigit.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Entity
@Table(name = "customer_details")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CustomerDetail implements Serializable{

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String customerName;

    private String address;
    private String email;
}
