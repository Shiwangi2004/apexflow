package com.autoincentive.engine.domain.model;

/**
 * State lifecycle of a dealer incentive claim.
 *
 * SUBMITTED: Claim received via REST API, persisted, and queued into Kafka.
 * APPROVED: Validated asynchronously by Kafka worker; program active, amount valid, no duplicate.
 * REJECTED: Business validation failed (e.g. program expired, duplicate VIN, incorrect amount).
 */
public enum ClaimStatus {
    SUBMITTED,
    APPROVED,
    REJECTED
}
