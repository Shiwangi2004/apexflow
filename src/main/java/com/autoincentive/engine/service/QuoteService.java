package com.autoincentive.engine.service;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.repository.IncentiveProgramRepository;
import com.autoincentive.engine.dto.request.QuoteRequest;
import com.autoincentive.engine.dto.response.AppliedIncentiveDto;
import com.autoincentive.engine.dto.response.QuoteResponse;
import com.autoincentive.engine.strategy.IncentiveCalculatorRegistry;
import com.autoincentive.engine.strategy.IncentiveCalculatorStrategy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

/**
 * Service calculating vehicle incentive quotes using Strategy pattern and Java Streams.
 *
 * WHY Java Streams:
 * Streams provide declarative, composable processing pipelines (filter, map, sorted, collect)
 * which makes complex eligibility and stackability filtering expressive and testable.
 *
 * STACKABILITY RULES:
 * 1. Stackable programs can be combined together (e.g. $1,500 Cash Rebate + $500 Loyalty Bonus = $2,000).
 * 2. Non-stackable programs (e.g. 0.9% APR Subvention) cannot be combined with other programs.
 * 3. The engine computes the maximum financial advantage for the customer:
 *    It compares the sum of all stackable programs against the best individual non-stackable program,
 *    selecting the option that maximizes savings.
 */
@Service
public class QuoteService {

    private final IncentiveProgramRepository programRepository;
    private final IncentiveCalculatorRegistry calculatorRegistry;

    public QuoteService(IncentiveProgramRepository programRepository,
                        IncentiveCalculatorRegistry calculatorRegistry) {
        this.programRepository = programRepository;
        this.calculatorRegistry = calculatorRegistry;
    }

    @Transactional(readOnly = true)
    public QuoteResponse calculateQuote(QuoteRequest request) {
        List<IncentiveProgram> activePrograms = programRepository.findActiveProgramsForModel(
                request.effectiveQuoteDate(),
                request.vehicleModel()
        );

        // Evaluate all active programs against their respective calculation strategies
        List<AppliedIncentiveDto> eligibleIncentives = activePrograms.stream()
                .filter(program -> calculatorRegistry.hasStrategy(program.getType()))
                .filter(program -> {
                    IncentiveCalculatorStrategy strategy = calculatorRegistry.getStrategy(program.getType());
                    return strategy.isEligible(program, request);
                })
                .map(program -> {
                    IncentiveCalculatorStrategy strategy = calculatorRegistry.getStrategy(program.getType());
                    BigDecimal savings = strategy.calculateSavings(program, request);
                    String explanation = strategy.getExplanation(program, request, savings);
                    return new AppliedIncentiveDto(
                            program.getId(),
                            program.getProgramCode(),
                            program.getName(),
                            program.getType(),
                            savings,
                            program.isStackable(),
                            explanation
                    );
                })
                .filter(dto -> dto.calculatedSavings().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        // Separate into stackable vs non-stackable programs
        List<AppliedIncentiveDto> stackableList = eligibleIncentives.stream()
                .filter(AppliedIncentiveDto::stackable)
                .toList();

        List<AppliedIncentiveDto> nonStackableList = eligibleIncentives.stream()
                .filter(dto -> !dto.stackable())
                .sorted(Comparator.comparing(AppliedIncentiveDto::calculatedSavings).reversed())
                .toList();

        BigDecimal sumStackableSavings = stackableList.stream()
                .map(AppliedIncentiveDto::calculatedSavings)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        AppliedIncentiveDto bestNonStackable = nonStackableList.isEmpty() ? null : nonStackableList.get(0);
        BigDecimal bestNonStackableSavings = bestNonStackable != null ? bestNonStackable.calculatedSavings() : BigDecimal.ZERO;

        List<AppliedIncentiveDto> selectedIncentives;
        BigDecimal totalSavings;

        // Choose the combination that gives the customer the highest discount
        if (bestNonStackable != null && bestNonStackableSavings.compareTo(sumStackableSavings) > 0) {
            selectedIncentives = List.of(bestNonStackable);
            totalSavings = bestNonStackableSavings;
        } else {
            selectedIncentives = stackableList;
            totalSavings = sumStackableSavings;
        }

        // Incentive savings cannot exceed MSRP
        BigDecimal cappedSavings = totalSavings.min(request.msrp());
        BigDecimal netVehiclePrice = request.msrp().subtract(cappedSavings).max(BigDecimal.ZERO);

        return new QuoteResponse(
                request.vin(),
                request.vehicleModel(),
                request.msrp(),
                cappedSavings,
                netVehiclePrice,
                selectedIncentives
        );
    }
}
