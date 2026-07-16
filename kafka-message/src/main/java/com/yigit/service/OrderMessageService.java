package com.yigit.service;


import com.yigit.KafkaMessageApplication;
import com.yigit.dto.OrderMessage;
import com.yigit.entity.KafkaMessage;
import com.yigit.exception.InvalidMessageException;
import com.yigit.repository.KafkaMessageRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderMessageService {

    private final KafkaMessageRepository repository;
    private final Validator validator;

    public void processMessage(OrderMessage message){
        Set<ConstraintViolation<OrderMessage>> violations = validator.validate(message);
        if(!violations.isEmpty()) {
            String error = violations.stream()
                    .map(ConstraintViolation::getMessage)
                    .collect(Collectors.joining(", "));
            throw new InvalidMessageException("Invalid message: " + error);
        }

        if(repository.existsByOrderId(message.orderId())){
            log.warn("Message already processed. orderId = {}", message.orderId());
            return;
        }

        KafkaMessage entity = KafkaMessage.builder()
                .orderId(message.orderId())
                .customerName(message.customerName())
                .amount(message.amount())
                .receivedAt(LocalDateTime.now())
                .build();

        repository.save(entity);
        log.info("Saved to DataBase! orderId = {}", entity.getOrderId());
    }
}
