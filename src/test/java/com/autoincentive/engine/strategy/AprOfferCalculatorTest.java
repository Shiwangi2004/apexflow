package com.autoincentive.engine.strategy;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.dto.request.QuoteRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class AprOfferCalculatorTest {

    private AprOfferCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new AprOfferCalculator();
    }

    @Test
    @DisplayName("Supports APR_OFFER type")
    void supports() {
        assertThat(calculator.supports()).isEqualTo(ProgramType.APR_OFFER);
    }

    @Test
    @DisplayName("Eligible when APR rate and terms are valid and below standard rate")
    void isEligible() {
        IncentiveProgram program = new IncentiveProgram();
        program.setAprRate(new BigDecimal("1.90"));
        program.setTermMonths(60);
        program.setStandardAprRate(new BigDecimal("6.50"));

        QuoteRequest request = new QuoteRequest("1FA6P8CF5H5123456", "F-150", new BigDecimal("50000.00"), false, LocalDate.now());
        assertThat(calculator.isEligible(program, request)).isTrue();
    }

    @Test
    @DisplayName("Calculates interest subvention savings accurately")
    void calculateSavings() {
        // MSRP: $40,000, Standard: 6.5%, Promo: 1.5%, Term: 60 months (5 years)
        // Rate diff = 5.0%
        // Savings = 40,000 * 0.05 * 5 = $10,000.00
        IncentiveProgram program = new IncentiveProgram();
        program.setAprRate(new BigDecimal("1.50"));
        program.setTermMonths(60);
        program.setStandardAprRate(new BigDecimal("6.50"));

        QuoteRequest request = new QuoteRequest("1FA6P8CF5H5123456", "Explorer", new BigDecimal("40000.00"), false, LocalDate.now());
        BigDecimal savings = calculator.calculateSavings(program, request);

        assertThat(savings).isEqualByComparingTo("10000.00");
    }
}
