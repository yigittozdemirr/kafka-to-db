package com.yigit.kafka_producer_app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record OrderMessage(

        @NotBlank(message = "orderId bos olamaz!")
        String orderId,

        @NotBlank(message = "customerName bos olamaz!")
        String customerName,

        @NotNull(message = "amount bos olamaz!")
        @Positive(message = "amount pozitif olmalı!")
        Double amount

) { }
