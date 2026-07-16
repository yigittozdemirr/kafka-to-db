package com.yigit.consumer;


import com.yigit.dto.OrderMessage;
import com.yigit.entity.FailedMessage;
import com.yigit.exception.InvalidMessageException;
import com.yigit.repository.FailedMessageRepository;
import com.yigit.service.OrderMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderMessageConsumer {
    private final OrderMessageService service;

    private final FailedMessageRepository failedMessageRepository;

    @RetryableTopic(
            attempts = "4",
            backoff = @Backoff(delay = 1000, multiplier = 2.0),
            exclude = InvalidMessageException.class
    )
    @KafkaListener(topics = "orders", groupId = "my-consumer-group")
    public void consume(OrderMessage message){
        log.info("Message received: {}", message);
        service.processMessage(message);
    }

    @DltHandler
    public void handleDlt(OrderMessage message){
        log.error("Message processing failed after all retries; sent to DLT: {}", message);

        FailedMessage failed = FailedMessage.builder()
                .orderId(message.orderId())
                .customerName(message.customerName())
                .amount(message.amount())
                .failureReason("Max retries exceeded or validation failed")
                .failedAt(LocalDateTime.now())
                .build();

        failedMessageRepository.save(failed);
    }
}
