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

class LoyaltyBonusCalculatorTest {

    private LoyaltyBonusCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new LoyaltyBonusCalculator();
    }

    @Test
    @DisplayName("Supports LOYALTY_BONUS type")
    void supports() {
        assertThat(calculator.supports()).isEqualTo(ProgramType.LOYALTY_BONUS);
    }

    @Test
    @DisplayName("Eligible only when buyer is existing owner")
    void isEligible() {
        IncentiveProgram program = new IncentiveProgram();
        program.setDiscountAmount(new BigDecimal("1000.00"));

        QuoteRequest ownerRequest = new QuoteRequest("1FA6P8CF5H5123456", "F-150", new BigDecimal("50000.00"), true, LocalDate.now());
        QuoteRequest nonOwnerRequest = new QuoteRequest("1FA6P8CF5H5123456", "F-150", new BigDecimal("50000.00"), false, LocalDate.now());

        assertThat(calculator.isEligible(program, ownerRequest)).isTrue();
        assertThat(calculator.isEligible(program, nonOwnerRequest)).isFalse();
    }

    @Test
    @DisplayName("Calculates loyalty bonus discount")
    void calculateSavings() {
        IncentiveProgram program = new IncentiveProgram();
        program.setDiscountAmount(new BigDecimal("750.00"));

        QuoteRequest request = new QuoteRequest("1FA6P8CF5H5123456", "F-150", new BigDecimal("50000.00"), true, LocalDate.now());
        BigDecimal savings = calculator.calculateSavings(program, request);

        assertThat(savings).isEqualByComparingTo("750.00");
    }
}
