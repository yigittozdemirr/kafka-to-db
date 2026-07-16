package com.yigit;

import com.yigit.dto.OrderMessage;
import com.yigit.entity.KafkaMessage;
import com.yigit.exception.InvalidMessageException;
import com.yigit.repository.KafkaMessageRepository;
import com.yigit.service.OrderMessageService;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderMessageServiceTest {

    @Mock
    private KafkaMessageRepository repository;

    private Validator validator;
    private OrderMessageService service;

    @BeforeEach
    void setUp(){
        validator = Validation.buildDefaultValidatorFactory().getValidator();
        service = new OrderMessageService(repository, validator);
    }

    @Test
    void shouldSaveOrderMessage_whenValidMessageArrivesFirstTime(){
        OrderMessage message = new OrderMessage("ORD-001", "Yiğit", 149.90);
        when(repository.existsByOrderId("ORD-001")).thenReturn(false);

        service.processMessage(message);

        verify(repository, times(1)).save(any(KafkaMessage.class));
    }

    @Test
    void shouldSkipProcessing_whenOrderIdAlreadyExists(){
        OrderMessage message = new OrderMessage("ORD-001", "Yiğit", 149.90);
        when(repository.existsByOrderId("ORD-001")).thenReturn(true);

        service.processMessage(message);

        verify(repository, never()).save(any());
    }

    @Test
    void shouldThrowInvalidMessageException_whenMessageIsInvalid(){
        OrderMessage invalid = new OrderMessage("", "Yiğit", -10.0);

        assertThatThrownBy(() -> service.processMessage(invalid))
                .isInstanceOf(InvalidMessageException.class);

        verify(repository, never()).save(any());
    }
}
