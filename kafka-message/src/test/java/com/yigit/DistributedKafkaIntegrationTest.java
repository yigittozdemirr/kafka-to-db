package com.yigit;

import com.yigit.dto.OrderMessage;
import com.yigit.repository.KafkaMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.kafka.core.KafkaTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.shaded.org.awaitility.Awaitility;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
// Test için 3 thread açarak (sanki 3 ayrı backend app varmış gibi) concurrency sağlıyoruz
@SpringBootTest(properties = {
        "spring.kafka.listener.concurrency=3"
})
class DistributedKafkaIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Container
    @ServiceConnection
    static KafkaContainer kafka = new KafkaContainer("apache/kafka:3.8.0");

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private KafkaMessageRepository repository;

    @BeforeEach
    void clear(){
        repository.deleteAll();
    }

    @Test
    void shouldProcessMultipleMessagesConcurrentlyAcrossPartitions() {
        // Mentöre gösterebilmek için 30 adet mesaj yollayalım
        int messageCount = 30;
        List<String> orderIds = new ArrayList<>();

        for (int i = 0; i < messageCount; i++) {
            String orderId = "DIST-ORD-" + i;
            orderIds.add(orderId);
            OrderMessage message = new OrderMessage(orderId, "Mentor Demo Customer", 100.0 + i);
            
            // Key olarak orderId gönderiyoruz ki Kafka bunları partition'lara dağıtsın
            kafkaTemplate.send("orders", message.orderId(), message);
        }

        // Kafka async (asenkron) olduğu için veritabanına hepsi yazılana kadar 15 saniye bekliyoruz
        Awaitility.await()
                .atMost(Duration.ofSeconds(15))
                .untilAsserted(() -> {
                    long count = repository.count();
                    assertThat(count).isEqualTo(messageCount);
                });

        // 30 verinin de eksiksiz kaydedildiğini teyit ediyoruz
        assertThat(repository.findAll()).hasSize(messageCount);
    }
}
