package com.autoincentive.engine.strategy;

import com.autoincentive.engine.domain.model.ProgramType;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry holding all available IncentiveCalculatorStrategy implementations.
 *
 * WHY Spring constructor injection of List<T>:
 * Spring discovers all beans implementing the interface and injects them automatically.
 * When a developer adds a new strategy in the future, it is automatically picked up
 * and registered without modifying this class.
 */
@Component
public class IncentiveCalculatorRegistry {

    private final Map<ProgramType, IncentiveCalculatorStrategy> strategyMap;

    public IncentiveCalculatorRegistry(List<IncentiveCalculatorStrategy> strategies) {
        this.strategyMap = Collections.unmodifiableMap(
                strategies.stream()
                        .collect(Collectors.toMap(IncentiveCalculatorStrategy::supports, Function.identity()))
        );
    }

    public IncentiveCalculatorStrategy getStrategy(ProgramType type) {
        IncentiveCalculatorStrategy strategy = strategyMap.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("No calculation strategy registered for program type: " + type);
        }
        return strategy;
    }

    public boolean hasStrategy(ProgramType type) {
        return strategyMap.containsKey(type);
    }
}
