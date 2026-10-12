package com.autoincentive.engine.domain.model;

/**
 * Enumeration of supported incentive program types.
 *
 * WHY:
 * Enums enforce type-safety and act as keys for the Strategy pattern registry.
 * This guarantees at compile-time that every incentive program maps to a known
 * financial calculation mechanism.
 */
public enum ProgramType {
    CASH_REBATE,
    APR_OFFER,
    LOYALTY_BONUS
}
