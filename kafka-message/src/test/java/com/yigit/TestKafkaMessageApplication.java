package com.yigit;

import org.springframework.boot.SpringApplication;

public class TestKafkaMessageApplication {

	public static void main(String[] args) {
		SpringApplication.from(KafkaMessageApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
