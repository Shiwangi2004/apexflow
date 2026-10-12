package com.autoincentive.engine.strategy;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.dto.request.QuoteRequest;

import java.math.BigDecimal;

/**
 * Strategy interface defining how different financial incentives are evaluated and calculated.
 *
 * WHY Strategy Pattern:
 * The Open/Closed Principle (OCP): New incentive types (e.g., Lease Subvention, Military Rebate)
 * can be added in the future by simply creating a new strategy class without modifying existing
 * calculation logic or controllers.
 */
public interface IncentiveCalculatorStrategy {

    /**
     * Identifies which ProgramType this strategy implementation is responsible for.
     */
    ProgramType supports();

    /**
     * Determines whether the requested vehicle/buyer qualifies for this incentive.
     */
    boolean isEligible(IncentiveProgram program, QuoteRequest request);

    /**
     * Calculates the exact financial dollar savings provided by the program.
     */
    BigDecimal calculateSavings(IncentiveProgram program, QuoteRequest request);

    /**
     * Generates a clear, auditable explanation of how the savings were computed.
     */
    String getExplanation(IncentiveProgram program, QuoteRequest request, BigDecimal savings);
}
