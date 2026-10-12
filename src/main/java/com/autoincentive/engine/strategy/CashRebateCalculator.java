package com.autoincentive.engine.strategy;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.dto.request.QuoteRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Strategy implementation for direct Cash Rebates (e.g. $1,500 Customer Cash).
 */
@Component
public class CashRebateCalculator implements IncentiveCalculatorStrategy {

    @Override
    public ProgramType supports() {
        return ProgramType.CASH_REBATE;
    }

    @Override
    public boolean isEligible(IncentiveProgram program, QuoteRequest request) {
        return program.getDiscountAmount() != null
                && program.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0;
    }

    @Override
    public BigDecimal calculateSavings(IncentiveProgram program, QuoteRequest request) {
        // Direct cash reduction, capped at vehicle MSRP
        BigDecimal discount = program.getDiscountAmount();
        return discount.min(request.msrp());
    }

    @Override
    public String getExplanation(IncentiveProgram program, QuoteRequest request, BigDecimal savings) {
        return String.format("Direct cash rebate of $%s applied to vehicle price", savings.toPlainString());
    }
}
