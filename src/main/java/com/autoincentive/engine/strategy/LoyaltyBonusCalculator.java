package com.autoincentive.engine.strategy;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.dto.request.QuoteRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Strategy implementation for returning customer / brand loyalty bonuses.
 * Requires the customer to be an existing owner of the vehicle brand.
 */
@Component
public class LoyaltyBonusCalculator implements IncentiveCalculatorStrategy {

    @Override
    public ProgramType supports() {
        return ProgramType.LOYALTY_BONUS;
    }

    @Override
    public boolean isEligible(IncentiveProgram program, QuoteRequest request) {
        // Customer MUST be an existing brand owner to qualify for loyalty bonus
        return request.existingOwner()
                && program.getDiscountAmount() != null
                && program.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0;
    }

    @Override
    public BigDecimal calculateSavings(IncentiveProgram program, QuoteRequest request) {
        BigDecimal bonus = program.getDiscountAmount();
        return bonus.min(request.msrp());
    }

    @Override
    public String getExplanation(IncentiveProgram program, QuoteRequest request, BigDecimal savings) {
        return String.format("Brand loyalty bonus of $%s applied for returning owner", savings.toPlainString());
    }
}
