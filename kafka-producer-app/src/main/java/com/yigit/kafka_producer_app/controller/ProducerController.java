package com.yigit.kafka_producer_app.controller;

import com.yigit.kafka_producer_app.dto.OrderMessage;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class ProducerController {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ProducerController(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }


    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendOrder(@Valid @RequestBody OrderMessage order) {
        kafkaTemplate.send("orders", order.orderId(), order);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Sipariş Kafka'ya gönderildi.");
        response.put("orderId", order.orderId());
        return ResponseEntity.ok(response);
    }


    @PostMapping("/stress-test")
    public ResponseEntity<Map<String, Object>> stressTest(
            @RequestParam(defaultValue = "100") int count) {

        long start = System.currentTimeMillis();

        for (int i = 0; i < count; i++) {
            String orderId = "STRESS-" + UUID.randomUUID().toString().substring(0, 8);
            String customerName = "Customer-" + i;
            double amount = Math.round((10 + Math.random() * 990) * 100.0) / 100.0;

            OrderMessage message = new OrderMessage(orderId, customerName, amount);
            kafkaTemplate.send("orders", message.orderId(), message);
        }

        long duration = System.currentTimeMillis() - start;

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("totalMessages", count);
        response.put("durationMs", duration);
        response.put("message", count + " adet sipariş " + duration + "ms içinde Kafka'ya gönderildi!");
        return ResponseEntity.ok(response);
    }
}
