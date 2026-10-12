package com.autoincentive.engine.strategy;

import com.autoincentive.engine.domain.model.ProgramType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IncentiveCalculatorRegistryTest {

    private IncentiveCalculatorRegistry registry;
    private CashRebateCalculator cashCalculator;
    private AprOfferCalculator aprCalculator;
    private LoyaltyBonusCalculator loyaltyCalculator;

    @BeforeEach
    void setUp() {
        cashCalculator = new CashRebateCalculator();
        aprCalculator = new AprOfferCalculator();
        loyaltyCalculator = new LoyaltyBonusCalculator();
        registry = new IncentiveCalculatorRegistry(List.of(cashCalculator, aprCalculator, loyaltyCalculator));
    }

    @Test
    @DisplayName("Resolves correct strategy for each program type")
    void getStrategy() {
        assertThat(registry.getStrategy(ProgramType.CASH_REBATE)).isSameAs(cashCalculator);
        assertThat(registry.getStrategy(ProgramType.APR_OFFER)).isSameAs(aprCalculator);
        assertThat(registry.getStrategy(ProgramType.LOYALTY_BONUS)).isSameAs(loyaltyCalculator);
    }

    @Test
    @DisplayName("Throws IllegalArgumentException if strategy is not found")
    void getStrategy_notFound() {
        IncentiveCalculatorRegistry emptyRegistry = new IncentiveCalculatorRegistry(List.of());
        assertThatThrownBy(() -> emptyRegistry.getStrategy(ProgramType.CASH_REBATE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No calculation strategy registered");
    }
}
