package com.yigit;

import com.yigit.dto.OrderMessage;
import com.yigit.entity.CustomerDetail;
import com.yigit.entity.EnrichedOrder;
import com.yigit.entity.KafkaMessage;
import com.yigit.exception.InvalidMessageException;
import com.yigit.repository.EnrichedOrderRepository;
import com.yigit.repository.KafkaMessageRepository;
import com.yigit.service.CustomerLookupService;
import com.yigit.service.OrderMessageService;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderMessageServiceTest {

    @Mock
    private KafkaMessageRepository repository;

    @Mock
    private EnrichedOrderRepository enrichedOrderRepository;

    @Mock
    private CustomerLookupService customerLookupService;

    private MeterRegistry meterRegistry;

    private Validator validator;
    private OrderMessageService service;

    @BeforeEach
    void setUp(){
        validator = Validation.buildDefaultValidatorFactory().getValidator();
        meterRegistry = new SimpleMeterRegistry();
        service = new OrderMessageService(repository, enrichedOrderRepository, customerLookupService, validator, meterRegistry);
    }

    @Test
    void shouldSaveOrderMessage_whenValidMessageArrivesFirstTime(){
        OrderMessage message = new OrderMessage("ORD-001", "Yiğit", 149.90);
        when(enrichedOrderRepository.existsByOrderId("ORD-001")).thenReturn(false);
        when(customerLookupService.findByCustomerName("Yiğit")).thenReturn(Optional.empty());

        service.processMessage(message);

        verify(repository, times(1)).save(any(KafkaMessage.class));
        verify(enrichedOrderRepository, times(1)).save(any(EnrichedOrder.class));
    }

    @Test
    void shouldSkipProcessing_whenOrderIdAlreadyExists(){
        OrderMessage message = new OrderMessage("ORD-001", "Yiğit", 149.90);
        when(enrichedOrderRepository.existsByOrderId("ORD-001")).thenReturn(true);

        service.processMessage(message);

        verify(repository, never()).save(any());
        verify(enrichedOrderRepository, never()).save(any());
    }

    @Test
    void shouldThrowInvalidMessageException_whenMessageIsInvalid(){
        OrderMessage invalid = new OrderMessage("", "Yiğit", -10.0);

        assertThatThrownBy(() -> service.processMessage(invalid))
                .isInstanceOf(InvalidMessageException.class);

        verify(repository, never()).save(any());
        verify(enrichedOrderRepository, never()).save(any());
    }
}