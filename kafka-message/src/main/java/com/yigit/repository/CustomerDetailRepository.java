package com.yigit.repository;

import com.yigit.entity.CustomerDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerDetailRepository extends JpaRepository<CustomerDetail, Long> {
    Optional<CustomerDetail> findByCustomerName(String customerName);
}
