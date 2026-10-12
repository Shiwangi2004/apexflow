package com.autoincentive.engine.web.error;

/**
 * Thrown when a requested resource (Program, Claim, etc.) cannot be found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
