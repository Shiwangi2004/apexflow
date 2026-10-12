package com.autoincentive.engine.dto.event;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Event published to Kafka topic 'claims.submitted.v1'.
 *
 * WHY Kafka Event:
 * Decouples the synchronous REST endpoint from asynchronous verification.
 * The dealer receives an immediate 202 Accepted / 201 Created with status SUBMITTED,
 * while background consumers validate program rules without blocking the dealer.
 *
 * The event is published with the vehicle VIN as the Kafka partition key.
 * In Kafka, records with the same partition key are guaranteed to go to the same
 * partition, ensuring strict ordering per vehicle and eliminating race conditions.
 */
public record ClaimSubmittedEvent(
        Long claimId,
        String claimReference,
        String vin,
        String dealerId,
        Long programId,
        String vehicleModel,
        BigDecimal msrp,
        BigDecimal claimedAmount,
        Instant submittedAt
) {}
