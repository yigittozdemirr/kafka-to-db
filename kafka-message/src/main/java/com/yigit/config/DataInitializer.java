package com.yigit.config;

import com.yigit.entity.CustomerDetail;
import com.yigit.repository.CustomerDetailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CustomerDetailRepository repository;

    @Override
    public void run(String... args) throws Exception {
        if (repository.count() < 1000) {
            log.info("Initializing 1000+ static customer data...");
            repository.deleteAll(); // clear old records if any
            
            List<CustomerDetail> customers = new ArrayList<>();
            String[] cities = {"Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya", "Kayseri"};
            
            for (int i = 0; i <= 1000; i++) {
                String cityName = cities[i % cities.length];
                customers.add(CustomerDetail.builder()
                        .customerName("Customer-" + i)
                        .address(cityName + ", Turkey")
                        .email("c" + i + "@test.com")
                        .build());
            }
            
            // Add custom names as well
            customers.add(CustomerDetail.builder().customerName("Ahmet").address("Kadikoy, Istanbul").email("ahmet@test.com").build());
            customers.add(CustomerDetail.builder().customerName("Mehmet").address("Besiktas, Istanbul").email("mehmet@test.com").build());
            customers.add(CustomerDetail.builder().customerName("Ayse").address("Sisli, Istanbul").email("ayse@test.com").build());
            
            repository.saveAll(customers);
            log.info("Initialized {} customers.", customers.size());
        }
    }
}
