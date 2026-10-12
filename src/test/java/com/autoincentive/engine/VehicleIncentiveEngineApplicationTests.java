package com.autoincentive.engine;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VehicleIncentiveEngineApplicationTests {

    @Test
    @DisplayName("Application main class load test")
    void contextLoads() {
        assertThat(VehicleIncentiveEngineApplication.class).isNotNull();
    }
}
