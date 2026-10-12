package com.autoincentive.engine.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI (Swagger) documentation configuration.
 *
 * WHY:
 * Provides auto-generated interactive API documentation at /swagger-ui.html.
 * In production engineering teams, this serves as the contract between backend
 * microservices and frontend/dealer portal developers.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Vehicle Incentive Engine API")
                        .version("v1.0.0")
                        .description("High-performance incentive calculation engine and asynchronous dealer claim processor")
                        .contact(new Contact()
                                .name("Automotive Incentive Platform Team")
                                .email("platform@autoincentive.internal"))
                        .license(new License().name("Apache 2.0")));
    }
}
