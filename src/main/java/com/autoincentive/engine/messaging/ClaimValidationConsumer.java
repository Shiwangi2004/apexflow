package com.autoincentive.engine.messaging;

import com.autoincentive.engine.dto.event.ClaimSubmittedEvent;
import com.autoincentive.engine.service.ClaimValidationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Kafka Consumer listening to claims.submitted.v1.
 *
 * WHY Kafka Consumer:
 * Asynchronously processes claim validations without tying up HTTP worker threads.
 * If 1,000 dealers submit claims simultaneously during an end-of-month sales rush,
 * the REST API quickly absorbs and buffers claims into Kafka, and the consumer group
 * processes them steadily at its own optimal pace.
 */
@Component
public class ClaimValidationConsumer {

    private static final Logger log = LoggerFactory.getLogger(ClaimValidationConsumer.class);

    private final ClaimValidationService validationService;

    public ClaimValidationConsumer(ClaimValidationService validationService) {
        this.validationService = validationService;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.claim-submitted:claims.submitted.v1}",
            groupId = "${spring.kafka.consumer.group-id:incentive-claim-validation-group}"
    )
    public void consumeClaimSubmitted(
            @Payload ClaimSubmittedEvent event,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Received ClaimSubmittedEvent from topic partition={} offset={} key(VIN)={}: claimRef={}",
                partition, offset, key, event.claimReference());

        try {
            validationService.validateClaim(event);
        } catch (Exception ex) {
            log.error("Unexpected error during claim validation for claimId={}: {}",
                    event.claimId(), ex.getMessage(), ex);
            // In Phase 2, this will route to dead-letter queue with exponential backoff
        }
    }
}
