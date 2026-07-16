package com.yigit.service;

import com.yigit.dto.MonitoringEventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.instance-id:unknown}")
    private String instanceId;

    private static final String DESTINATION = "/topic/monitoring";

    /**
     * Publishes a monitoring event to all connected WebSocket subscribers.
     *
     * @param messageId unique message identifier (orderId)
     * @param payload   serialized original message content
     * @param status    processing status: SUCCESS, RETRY, or FAILED
     */
    public void publishEvent(String messageId, String payload, String status) {
        MonitoringEventDTO event = new MonitoringEventDTO(
                messageId,
                payload,
                status,
                instanceId,
                Instant.now().toString()
        );

        messagingTemplate.convertAndSend(DESTINATION, event);
        log.debug("Monitoring event published: [{}] {} on {}", status, messageId, instanceId);
    }
}
