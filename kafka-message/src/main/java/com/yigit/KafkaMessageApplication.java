package com.yigit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
public class KafkaMessageApplication {

	public static void main(String[] args) {
		SpringApplication.run(KafkaMessageApplication.class, args);
	}

}
