package com.autoincentive.engine.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request payload for submitting an incentive claim by a dealer.
 */
public record SubmitClaimRequest(
        @NotBlank(message = "VIN is required")
        @Pattern(regexp = "^[A-HJ-NPR-Z0-9]{17}$", message = "VIN must be a valid 17-character alphanumeric string")
        String vin,

        @NotBlank(message = "Dealer ID is required")
        @Size(max = 64)
        String dealerId,

        @NotNull(message = "Program ID is required")
        Long programId,

        @NotBlank(message = "Vehicle model is required")
        @Size(max = 64)
        String vehicleModel,

        @NotNull(message = "Vehicle MSRP is required")
        @Positive(message = "Vehicle MSRP must be positive")
        BigDecimal msrp,

        @NotNull(message = "Claimed incentive amount is required")
        @Positive(message = "Claimed amount must be positive")
        BigDecimal claimedAmount
) {}
