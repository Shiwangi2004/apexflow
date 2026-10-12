package com.autoincentive.engine.dto.response;

import com.autoincentive.engine.domain.model.Claim;
import com.autoincentive.engine.domain.model.ClaimStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Response DTO representing the state of an incentive claim.
 */
public record ClaimResponse(
        Long id,
        String claimReference,
        String vin,
        String dealerId,
        Long programId,
        String programCode,
        String vehicleModel,
        BigDecimal msrp,
        BigDecimal claimedAmount,
        BigDecimal approvedAmount,
        ClaimStatus status,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt
) {
    public static ClaimResponse fromEntity(Claim c) {
        return new ClaimResponse(
                c.getId(),
                c.getClaimReference(),
                c.getVin(),
                c.getDealerId(),
                c.getProgram() != null ? c.getProgram().getId() : null,
                c.getProgram() != null ? c.getProgram().getProgramCode() : null,
                c.getVehicleModel(),
                c.getMsrp(),
                c.getClaimedAmount(),
                c.getApprovedAmount(),
                c.getStatus(),
                c.getRejectionReason(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
