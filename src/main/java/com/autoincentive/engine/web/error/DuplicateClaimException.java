package com.autoincentive.engine.web.error;

/**
 * Thrown when an attempt is made to claim the same incentive program for a VIN more than once.
 */
public class DuplicateClaimException extends RuntimeException {

    public DuplicateClaimException(String message) {
        super(message);
    }
}
