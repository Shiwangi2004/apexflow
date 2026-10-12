package com.autoincentive.engine.service;

import com.autoincentive.engine.domain.model.Claim;
import com.autoincentive.engine.domain.model.ClaimStatus;
import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.domain.repository.ClaimRepository;
import com.autoincentive.engine.domain.repository.IncentiveProgramRepository;
import com.autoincentive.engine.dto.event.ClaimSubmittedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

/**
 * Service responsible for asynchronous business validation of claims.
 *
 * WHY separate validation service:
 * Separates Kafka message ingestion plumbing from domain business logic.
 * Enables clean unit testing of business validation rules without needing Kafka mocks.
 */
@Service
public class ClaimValidationService {

    private static final Logger log = LoggerFactory.getLogger(ClaimValidationService.class);

    private final ClaimRepository claimRepository;
    private final IncentiveProgramRepository programRepository;

    public ClaimValidationService(ClaimRepository claimRepository,
                                  IncentiveProgramRepository programRepository) {
        this.claimRepository = claimRepository;
        this.programRepository = programRepository;
    }

    @Transactional
    public Claim validateClaim(ClaimSubmittedEvent event) {
        log.info("Executing async validation for claimId={} vin={} programId={}",
                event.claimId(), event.vin(), event.programId());

        Claim claim = claimRepository.findById(event.claimId()).orElse(null);
        if (claim == null) {
            log.warn("Claim not found for id={}, skipping validation", event.claimId());
            return null;
        }

        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            log.info("Claim id={} is already in state {}, skipping", claim.getId(), claim.getStatus());
            return claim;
        }

        // 1. Check for existing approved claim for same VIN and program
        List<Claim> existingClaims = claimRepository.findByVin(claim.getVin());
        boolean hasApprovedDuplicate = existingClaims.stream()
                .anyMatch(c -> !c.getId().equals(claim.getId())
                        && c.getProgram().getId().equals(claim.getProgram().getId())
                        && c.getStatus() == ClaimStatus.APPROVED);

        if (hasApprovedDuplicate) {
            claim.reject("Duplicate claim: Vehicle VIN already has an approved claim for this program");
            return claimRepository.save(claim);
        }

        // 2. Validate program existence and active dates
        Optional<IncentiveProgram> programOpt = programRepository.findById(event.programId());
        if (programOpt.isEmpty()) {
            claim.reject("Incentive program does not exist: ID " + event.programId());
            return claimRepository.save(claim);
        }

        IncentiveProgram program = programOpt.get();
        LocalDate claimDate = event.submittedAt() != null
                ? event.submittedAt().atZone(ZoneId.systemDefault()).toLocalDate()
                : LocalDate.now();

        if (claimDate.isBefore(program.getStartDate()) || claimDate.isAfter(program.getEndDate())) {
            claim.reject(String.format("Program is inactive on submission date. Active from %s to %s",
                    program.getStartDate(), program.getEndDate()));
            return claimRepository.save(claim);
        }

        // 3. Validate vehicle model match (if program specifies a target model)
        if (program.getVehicleModel() != null
                && !program.getVehicleModel().trim().equalsIgnoreCase(claim.getVehicleModel().trim())) {
            claim.reject(String.format("Vehicle model mismatch: Program targets '%s', claim is for '%s'",
                    program.getVehicleModel(), claim.getVehicleModel()));
            return claimRepository.save(claim);
        }

        // 4. Validate claimed amount against program terms
        if (program.getType() == ProgramType.CASH_REBATE || program.getType() == ProgramType.LOYALTY_BONUS) {
            BigDecimal maxAllowed = program.getDiscountAmount();
            if (maxAllowed != null && claim.getClaimedAmount().compareTo(maxAllowed) > 0) {
                claim.reject(String.format("Claimed amount $%s exceeds program maximum allowed discount $%s",
                        claim.getClaimedAmount().toPlainString(), maxAllowed.toPlainString()));
                return claimRepository.save(claim);
            }
        }

        if (claim.getClaimedAmount().compareTo(claim.getMsrp()) > 0) {
            claim.reject(String.format("Claimed amount $%s cannot exceed vehicle MSRP $%s",
                    claim.getClaimedAmount().toPlainString(), claim.getMsrp().toPlainString()));
            return claimRepository.save(claim);
        }

        // All business checks passed: Approve claim
        claim.approve(claim.getClaimedAmount());
        log.info("Claim id={} APPROVED for amount={}", claim.getId(), claim.getApprovedAmount());
        return claimRepository.save(claim);
    }
}
