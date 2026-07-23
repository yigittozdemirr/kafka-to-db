package com.yigit.service;

import com.yigit.entity.CustomerDetail;
import com.yigit.repository.CustomerDetailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerLookupService {

    private final CustomerDetailRepository repository;

    @Cacheable(value = "customerDetails", key = "#customerName")
    public Optional<CustomerDetail> findByCustomerName(String customerName) {
        log.info("DB'den sorgulaniyor (cache miss): {}", customerName);
        return repository.findByCustomerName(customerName);
    }
}