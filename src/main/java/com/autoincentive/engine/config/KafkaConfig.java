package com.autoincentive.engine.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Kafka Configuration.
 *
 * WHY NewTopic:
 * Automatically provisions the topic on startup if it doesn't already exist.
 * We configure 3 partitions so multiple consumer instances/threads can process claims in parallel.
 * Because messages are keyed by VIN, all events for a given vehicle are guaranteed to land
 * in the same partition and be processed in strict FIFO order, preventing race conditions.
 */
@Configuration
public class KafkaConfig {

    @Value("${app.kafka.topics.claim-submitted:claims.submitted.v1}")
    private String claimSubmittedTopic;

    @Bean
    public NewTopic claimSubmittedTopic() {
        return TopicBuilder.name(claimSubmittedTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
