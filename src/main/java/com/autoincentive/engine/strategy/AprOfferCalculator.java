package com.autoincentive.engine.strategy;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.dto.request.QuoteRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Strategy implementation for special APR financing offers (e.g. 1.90% APR for 60 months).
 *
 * WHY Subvention savings formula:
 * In automotive finance, the OEM subsidizes the interest differential between the standard market rate
 * (e.g., 6.50%) and the promo rate (e.g., 1.90%). We compute total interest savings over the loan term:
 * Savings = MSRP * ((StandardAPR - PromoAPR) / 100) * (TermMonths / 12).
 */
@Component
public class AprOfferCalculator implements IncentiveCalculatorStrategy {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal MONTHS_PER_YEAR = new BigDecimal("12");

    @Override
    public ProgramType supports() {
        return ProgramType.APR_OFFER;
    }

    @Override
    public boolean isEligible(IncentiveProgram program, QuoteRequest request) {
        return program.getAprRate() != null
                && program.getTermMonths() != null
                && program.getTermMonths() > 0
                && program.getStandardAprRate() != null
                && program.getStandardAprRate().compareTo(program.getAprRate()) > 0;
    }

    @Override
    public BigDecimal calculateSavings(IncentiveProgram program, QuoteRequest request) {
        BigDecimal standardRate = program.getStandardAprRate();
        BigDecimal promoRate = program.getAprRate();
        BigDecimal rateDiff = standardRate.subtract(promoRate);

        if (rateDiff.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal termMonths = BigDecimal.valueOf(program.getTermMonths());
        BigDecimal termYears = termMonths.divide(MONTHS_PER_YEAR, 6, RoundingMode.HALF_UP);
        BigDecimal rateFraction = rateDiff.divide(HUNDRED, 6, RoundingMode.HALF_UP);

        // Savings = MSRP * (rateDiff / 100) * (termMonths / 12)
        BigDecimal interestSavings = request.msrp()
                .multiply(rateFraction)
                .multiply(termYears)
                .setScale(2, RoundingMode.HALF_UP);

        return interestSavings.min(request.msrp());
    }

    @Override
    public String getExplanation(IncentiveProgram program, QuoteRequest request, BigDecimal savings) {
        return String.format(
                "Promotional %s%% APR for %d months (estimated interest savings of $%s vs %s%% standard APR)",
                program.getAprRate().toPlainString(),
                program.getTermMonths(),
                savings.toPlainString(),
                program.getStandardAprRate().toPlainString()
        );
    }
}
