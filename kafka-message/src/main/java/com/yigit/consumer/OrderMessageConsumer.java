package com.yigit.consumer;

import com.yigit.dto.OrderMessage;
import com.yigit.entity.EnrichedOrder;
import com.yigit.entity.FailedMessage;
import com.yigit.exception.InvalidMessageException;
import com.yigit.repository.FailedMessageRepository;
import com.yigit.service.MonitoringEventPublisher;
import com.yigit.service.OrderMessageService;
import io.micrometer.core.instrument.MeterRegistry;   // YENİ
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
    private final MonitoringEventPublisher monitoringPublisher;
    private final MeterRegistry meterRegistry;   // YENİ

    @RetryableTopic(
            attempts = "4",
            backoff = @Backoff(delay = 1000, multiplier = 2.0),
            exclude = InvalidMessageException.class
    )
    @KafkaListener(topics = "orders", groupId = "my-consumer-group")
    public void consume(OrderMessage message) {
        log.info("Message received: {}", message);
        try {
            EnrichedOrder enrichedOrder = service.processMessage(message);
            meterRegistry.counter("kafka_messages_processed_total", "status", "success").increment();   // YENİ
            if (enrichedOrder != null) {
                monitoringPublisher.publishEvent(
                        message.orderId(),
                        formatEnrichedPayload(enrichedOrder),
                        "SUCCESS"
                );
            }
        } catch (InvalidMessageException ex) {   // YENİ — ayrı catch bloğu
            meterRegistry.counter("kafka_messages_processed_total", "status", "invalid").increment();   // YENİ
            monitoringPublisher.publishEvent(
                    message.orderId(),
                    formatPayload(message),
                    "FAILED"
            );
            throw ex;
        } catch (Exception ex) {
            meterRegistry.counter("kafka_messages_processed_total", "status", "retry").increment();   // YENİ
            monitoringPublisher.publishEvent(
                    message.orderId(),
                    formatPayload(message),
                    "RETRY"
            );
            throw ex;
        }
    }

    @DltHandler
    public void handleDlt(OrderMessage message) {
        log.error("Message processing failed after all retries; sent to DLT: {}", message);
        meterRegistry.counter("kafka_messages_processed_total", "status", "dlt").increment();   // YENİ

        FailedMessage failed = FailedMessage.builder()
                .orderId(message.orderId())
                .customerName(message.customerName())
                .amount(message.amount())
                .failureReason("Max retries exceeded or validation failed")
                .failedAt(LocalDateTime.now())
                .build();

        failedMessageRepository.save(failed);

        monitoringPublisher.publishEvent(
                message.orderId(),
                formatPayload(message),
                "FAILED"
        );
    }

    private String formatPayload(OrderMessage message) {
        return String.format(
                "{\"orderId\":\"%s\",\"customerName\":\"%s\",\"amount\":%.2f,\"address\":\"Unknown Address\",\"email\":\"Unknown Email\"}",
                message.orderId(), message.customerName(), message.amount()
        );
    }

    private String formatEnrichedPayload(EnrichedOrder enrichedOrder) {
        return String.format(
                "{\"orderId\":\"%s\",\"customerName\":\"%s\",\"amount\":%.2f,\"address\":\"%s\",\"email\":\"%s\",\"customerIndex\":%d}",
                enrichedOrder.getOrderId(), enrichedOrder.getCustomerName(), enrichedOrder.getAmount(), enrichedOrder.getAddress(), enrichedOrder.getEmail(), enrichedOrder.getCustomerIndex()
        );
    }
}