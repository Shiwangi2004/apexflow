package com.autoincentive.engine.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request payload for calculating eligible vehicle incentives.
 *
 * WHY VIN regex:
 * Standard ISO 3779 VINs are 17 alphanumeric characters excluding letters I, O, and Q
 * to prevent visual confusion with numbers 1 and 0.
 */
public record QuoteRequest(
        @NotBlank(message = "VIN is required")
        @Pattern(regexp = "^[A-HJ-NPR-Z0-9]{17}$", message = "VIN must be a valid 17-character alphanumeric string (excluding I, O, Q)")
        String vin,

        @NotBlank(message = "Vehicle model is required (e.g. F-150, Explorer, Mustang)")
        @Size(max = 64)
        String vehicleModel,

        @NotNull(message = "Vehicle MSRP is required")
        @Positive(message = "Vehicle MSRP must be greater than zero")
        BigDecimal msrp,

        boolean existingOwner,

        LocalDate quoteDate
) {
    public LocalDate effectiveQuoteDate() {
        return quoteDate != null ? quoteDate : LocalDate.now();
    }
}
