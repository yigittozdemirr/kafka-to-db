package com.yigit.service;

import com.yigit.dto.OrderMessage;
import com.yigit.entity.CustomerDetail;
import com.yigit.entity.EnrichedOrder;
import com.yigit.entity.KafkaMessage;
import com.yigit.exception.InvalidMessageException;
import com.yigit.repository.CustomerDetailRepository;
import com.yigit.repository.EnrichedOrderRepository;
import com.yigit.repository.KafkaMessageRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderMessageService {

    private final KafkaMessageRepository repository;
    private final EnrichedOrderRepository enrichedOrderRepository;
    private final CustomerDetailRepository customerDetailRepository;
    private final Validator validator;

    @Transactional
    public EnrichedOrder processMessage(OrderMessage message){
        Set<ConstraintViolation<OrderMessage>> violations = validator.validate(message);
        if(!violations.isEmpty()) {
            String error = violations.stream()
                    .map(ConstraintViolation::getMessage)
                    .collect(Collectors.joining(", "));
            throw new InvalidMessageException("Invalid message: " + error);
        }

        if(enrichedOrderRepository.existsByOrderId(message.orderId())){
            log.warn("Message already processed. orderId = {}", message.orderId());
            return null;
        }

        LocalDateTime now = LocalDateTime.now();

        // Save original message
        KafkaMessage entity = KafkaMessage.builder()
                .orderId(message.orderId())
                .customerName(message.customerName())
                .amount(message.amount())
                .receivedAt(now)
                .build();
        repository.save(entity);

        // Fetch customer details
        Optional<CustomerDetail> customerOpt = customerDetailRepository.findByCustomerName(message.customerName());
        if (customerOpt.isEmpty()) {
            log.warn("Customer detail not found, using placeholder. customerName={}", message.customerName());
        }
        String address = customerOpt.map(CustomerDetail::getAddress).orElse("Unknown Address");
        String email = customerOpt.map(CustomerDetail::getEmail).orElse("Unknown Email");

        // Save enriched order
        EnrichedOrder enrichedOrder = EnrichedOrder.builder()
                .orderId(message.orderId())
                .customerName(message.customerName())
                .amount(message.amount())
                .address(address)
                .email(email)
                .receivedAt(now)
                .build();

        enrichedOrderRepository.save(enrichedOrder);
        log.info("Saved enriched data to DataBase! orderId = {}", enrichedOrder.getOrderId());
        return enrichedOrder;
    }
}