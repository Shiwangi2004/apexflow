package com.autoincentive.engine.messaging;

import com.autoincentive.engine.dto.event.ClaimSubmittedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Publishes Claim events to Kafka.
 *
 * WHY key = VIN:
 * In Apache Kafka, the partition assignment formula is hash(key) % partitionCount.
 * By keying each message on the vehicle VIN, all events related to the same vehicle
 * are guaranteed to route to the exact same partition. A single partition preserves
 * absolute FIFO order, preventing duplicate race conditions between rapid claim submissions.
 */
@Component
public class ClaimEventProducer {

    private static final Logger log = LoggerFactory.getLogger(ClaimEventProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String claimSubmittedTopic;

    public ClaimEventProducer(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${app.kafka.topics.claim-submitted:claims.submitted.v1}") String claimSubmittedTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.claimSubmittedTopic = claimSubmittedTopic;
    }

    public void publishClaimSubmitted(ClaimSubmittedEvent event) {
        log.info("Publishing ClaimSubmittedEvent to topic={} for vin={} claimRef={}",
                claimSubmittedTopic, event.vin(), event.claimReference());

        CompletableFuture<SendResult<String, Object>> future =
                kafkaTemplate.send(claimSubmittedTopic, event.vin(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send ClaimSubmittedEvent for vin={} claimRef={}: {}",
                        event.vin(), event.claimReference(), ex.getMessage(), ex);
            } else {
                log.info("ClaimSubmittedEvent sent successfully for vin={} at offset={} partition={}",
                        event.vin(),
                        result.getRecordMetadata().offset(),
                        result.getRecordMetadata().partition());
            }
        });
    }
}
