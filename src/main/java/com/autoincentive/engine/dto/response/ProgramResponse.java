package com.autoincentive.engine.dto.response;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Response DTO for an incentive program.
 */
public record ProgramResponse(
        Long id,
        String programCode,
        String name,
        ProgramType type,
        String vehicleModel,
        BigDecimal discountAmount,
        BigDecimal aprRate,
        Integer termMonths,
        BigDecimal standardAprRate,
        boolean stackable,
        LocalDate startDate,
        LocalDate endDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProgramResponse fromEntity(IncentiveProgram p) {
        return new ProgramResponse(
                p.getId(),
                p.getProgramCode(),
                p.getName(),
                p.getType(),
                p.getVehicleModel(),
                p.getDiscountAmount(),
                p.getAprRate(),
                p.getTermMonths(),
                p.getStandardAprRate(),
                p.isStackable(),
                p.getStartDate(),
                p.getEndDate(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
