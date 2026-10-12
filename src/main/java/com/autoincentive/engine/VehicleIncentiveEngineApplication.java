package com.autoincentive.engine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application entry point for the Vehicle Incentive Engine.
 *
 * WHY SpringBootApplication:
 * Bundles @Configuration, @EnableAutoConfiguration, and @ComponentScan into a single
 * meta-annotation, enabling Spring Boot to discover components within this package hierarchy.
 */
@SpringBootApplication
public class VehicleIncentiveEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(VehicleIncentiveEngineApplication.class, args);
    }
}
