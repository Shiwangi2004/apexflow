package com.autoincentive.engine.dto.response;

import com.autoincentive.engine.domain.model.ProgramType;

import java.math.BigDecimal;

/**
 * Breakdown of a specific incentive program applied to a quote.
 */
public record AppliedIncentiveDto(
        Long programId,
        String programCode,
        String programName,
        ProgramType type,
        BigDecimal calculatedSavings,
        boolean stackable,
        String explanation
) {}
