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

class CashRebateCalculatorTest {

    private CashRebateCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new CashRebateCalculator();
    }

    @Test
    @DisplayName("Supports CASH_REBATE type")
    void supports() {
        assertThat(calculator.supports()).isEqualTo(ProgramType.CASH_REBATE);
    }

    @Test
    @DisplayName("Eligible when program has positive discount amount")
    void isEligible_positiveDiscount() {
        IncentiveProgram program = new IncentiveProgram();
        program.setDiscountAmount(new BigDecimal("1500.00"));
        QuoteRequest request = new QuoteRequest("1FA6P8CF5H5123456", "Mustang", new BigDecimal("45000.00"), false, LocalDate.now());

        assertThat(calculator.isEligible(program, request)).isTrue();
    }

    @Test
    @DisplayName("Not eligible when discount amount is zero or null")
    void isEligible_zeroOrNullDiscount() {
        IncentiveProgram program = new IncentiveProgram();
        QuoteRequest request = new QuoteRequest("1FA6P8CF5H5123456", "Mustang", new BigDecimal("45000.00"), false, LocalDate.now());

        program.setDiscountAmount(null);
        assertThat(calculator.isEligible(program, request)).isFalse();

        program.setDiscountAmount(BigDecimal.ZERO);
        assertThat(calculator.isEligible(program, request)).isFalse();
    }

    @Test
    @DisplayName("Calculates savings as discount amount capped at MSRP")
    void calculateSavings() {
        IncentiveProgram program = new IncentiveProgram();
        program.setDiscountAmount(new BigDecimal("2000.00"));
        QuoteRequest request = new QuoteRequest("1FA6P8CF5H5123456", "F-150", new BigDecimal("55000.00"), false, LocalDate.now());

        BigDecimal savings = calculator.calculateSavings(program, request);
        assertThat(savings).isEqualByComparingTo("2000.00");
    }
}
