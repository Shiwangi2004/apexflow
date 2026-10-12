package com.autoincentive.engine.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Detailed quote response showing vehicle price, total incentive savings,
 * net price after incentives, and each applied program breakdown.
 */
public record QuoteResponse(
        String vin,
        String vehicleModel,
        BigDecimal msrp,
        BigDecimal totalIncentiveSavings,
        BigDecimal netVehiclePrice,
        List<AppliedIncentiveDto> appliedIncentives
) {}
