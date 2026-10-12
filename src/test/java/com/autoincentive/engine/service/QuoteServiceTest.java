package com.autoincentive.engine.service;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.domain.repository.IncentiveProgramRepository;
import com.autoincentive.engine.dto.request.QuoteRequest;
import com.autoincentive.engine.dto.response.QuoteResponse;
import com.autoincentive.engine.strategy.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuoteServiceTest {

    @Mock
    private IncentiveProgramRepository programRepository;

    private QuoteService quoteService;

    @BeforeEach
    void setUp() {
        IncentiveCalculatorRegistry registry = new IncentiveCalculatorRegistry(List.of(
                new CashRebateCalculator(),
                new AprOfferCalculator(),
                new LoyaltyBonusCalculator()
        ));
        quoteService = new QuoteService(programRepository, registry);
    }

    @Test
    @DisplayName("Combines multiple stackable programs (Cash + Loyalty) for eligible owner")
    void calculateQuote_stackableCombination() {
        LocalDate today = LocalDate.now();
        QuoteRequest request = new QuoteRequest(
                "1FA6P8CF5H5123456",
                "F-150",
                new BigDecimal("50000.00"),
                true, // existing owner
                today
        );

        IncentiveProgram cashProgram = new IncentiveProgram(
                1L, "CASH_1500", "$1500 Customer Cash", ProgramType.CASH_REBATE,
                "F-150", new BigDecimal("1500.00"), null, null, null, true,
                today.minusDays(5), today.plusDays(30)
        );

        IncentiveProgram loyaltyProgram = new IncentiveProgram(
                2L, "LOYALTY_500", "Brand Loyalty", ProgramType.LOYALTY_BONUS,
                "F-150", new BigDecimal("500.00"), null, null, null, true,
                today.minusDays(5), today.plusDays(30)
        );

        when(programRepository.findActiveProgramsForModel(eq(today), eq("F-150")))
                .thenReturn(List.of(cashProgram, loyaltyProgram));

        QuoteResponse response = quoteService.calculateQuote(request);

        assertThat(response.totalIncentiveSavings()).isEqualByComparingTo("2000.00");
        assertThat(response.netVehiclePrice()).isEqualByComparingTo("48000.00");
        assertThat(response.appliedIncentives()).hasSize(2);
    }

    @Test
    @DisplayName("Non-stackable APR offer wins when it yields greater savings than stackable programs")
    void calculateQuote_nonStackableWins() {
        LocalDate today = LocalDate.now();
        QuoteRequest request = new QuoteRequest(
                "1FA6P8CF5H5123456",
                "F-150",
                new BigDecimal("50000.00"),
                false, // non-owner
                today
        );

        IncentiveProgram stackableCash = new IncentiveProgram(
                1L, "CASH_1000", "$1000 Customer Cash", ProgramType.CASH_REBATE,
                "F-150", new BigDecimal("1000.00"), null, null, null, true,
                today.minusDays(5), today.plusDays(30)
        );

        // APR Promo: 1.5% vs 6.5% standard for 60 months on $50,000 MSRP
        // Rate diff = 5.0% -> Savings = 50000 * 0.05 * 5 = $12,500.00
        IncentiveProgram nonStackableApr = new IncentiveProgram(
                2L, "APR_PROMO", "1.5% Promo Financing", ProgramType.APR_OFFER,
                "F-150", null, new BigDecimal("1.50"), 60, new BigDecimal("6.50"), false, // non-stackable!
                today.minusDays(5), today.plusDays(30)
        );

        when(programRepository.findActiveProgramsForModel(eq(today), eq("F-150")))
                .thenReturn(List.of(stackableCash, nonStackableApr));

        QuoteResponse response = quoteService.calculateQuote(request);

        // Best non-stackable ($12,500) beats stackable ($1,000)
        assertThat(response.totalIncentiveSavings()).isEqualByComparingTo("12500.00");
        assertThat(response.netVehiclePrice()).isEqualByComparingTo("37500.00");
        assertThat(response.appliedIncentives()).hasSize(1);
        assertThat(response.appliedIncentives().get(0).programCode()).isEqualTo("APR_PROMO");
    }

    @Test
    @DisplayName("Filters out loyalty program when buyer is not an existing owner")
    void calculateQuote_filtersNonOwnerLoyalty() {
        LocalDate today = LocalDate.now();
        QuoteRequest request = new QuoteRequest(
                "1FA6P8CF5H5123456",
                "Explorer",
                new BigDecimal("42000.00"),
                false, // not an existing owner
                today
        );

        IncentiveProgram loyaltyProgram = new IncentiveProgram(
                1L, "LOYALTY_1000", "Owner Loyalty", ProgramType.LOYALTY_BONUS,
                "Explorer", new BigDecimal("1000.00"), null, null, null, true,
                today.minusDays(5), today.plusDays(30)
        );

        when(programRepository.findActiveProgramsForModel(eq(today), eq("Explorer")))
                .thenReturn(List.of(loyaltyProgram));

        QuoteResponse response = quoteService.calculateQuote(request);

        assertThat(response.totalIncentiveSavings()).isEqualByComparingTo("0.00");
        assertThat(response.appliedIncentives()).isEmpty();
    }
}
