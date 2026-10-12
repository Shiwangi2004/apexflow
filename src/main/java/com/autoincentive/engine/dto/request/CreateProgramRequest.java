package com.autoincentive.engine.dto.request;

import com.autoincentive.engine.domain.model.ProgramType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request payload for creating a new incentive program.
 *
 * WHY Java record:
 * Records provide immutable data carriers with concise syntax, automatic equals(),
 * hashCode(), and toString(). Immutability prevents unintended side effects across layers.
 */
public record CreateProgramRequest(
        @NotBlank(message = "Program code is required")
        @Size(max = 64, message = "Program code cannot exceed 64 characters")
        String programCode,

        @NotBlank(message = "Program name is required")
        @Size(max = 128, message = "Program name cannot exceed 128 characters")
        String name,

        @NotNull(message = "Program type is required (CASH_REBATE, APR_OFFER, LOYALTY_BONUS)")
        ProgramType type,

        @Size(max = 64, message = "Vehicle model cannot exceed 64 characters")
        String vehicleModel,

        @PositiveOrZero(message = "Discount amount must be positive or zero")
        BigDecimal discountAmount,

        @PositiveOrZero(message = "APR rate must be positive or zero")
        BigDecimal aprRate,

        @Positive(message = "Term months must be positive")
        Integer termMonths,

        BigDecimal standardAprRate,

        @NotNull(message = "Stackable flag is required")
        Boolean stackable,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @NotNull(message = "End date is required")
        LocalDate endDate
) {}
