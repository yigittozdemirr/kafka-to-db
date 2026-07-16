package com.yigit.dto;

public record MonitoringEventDTO(
        String messageId,
        String payload,
        String status,
        String instanceId,
        String timestamp
) {}
