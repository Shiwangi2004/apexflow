package com.autoincentive.engine.service;

import com.autoincentive.engine.domain.model.Claim;
import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.repository.ClaimRepository;
import com.autoincentive.engine.domain.repository.IncentiveProgramRepository;
import com.autoincentive.engine.dto.event.ClaimSubmittedEvent;
import com.autoincentive.engine.dto.request.SubmitClaimRequest;
import com.autoincentive.engine.dto.response.ClaimResponse;
import com.autoincentive.engine.messaging.ClaimEventProducer;
import com.autoincentive.engine.web.error.DuplicateClaimException;
import com.autoincentive.engine.web.error.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service managing claim submission and retrieval.
 */
@Service
public class ClaimService {

    private static final Logger log = LoggerFactory.getLogger(ClaimService.class);

    private final ClaimRepository claimRepository;
    private final IncentiveProgramRepository programRepository;
    private final ClaimEventProducer eventProducer;

    public ClaimService(ClaimRepository claimRepository,
                        IncentiveProgramRepository programRepository,
                        ClaimEventProducer eventProducer) {
        this.claimRepository = claimRepository;
        this.programRepository = programRepository;
        this.eventProducer = eventProducer;
    }

    /**
     * Submits a new claim synchronously, persists it as SUBMITTED, and produces a Kafka event.
     */
    @Transactional
    public ClaimResponse submitClaim(SubmitClaimRequest request) {
        // Fast pre-check: Fail immediately if duplicate exists before doing heavy work
        if (claimRepository.existsByVinAndProgramId(request.vin(), request.programId())) {
            throw new DuplicateClaimException(
                    String.format("Claim already exists for VIN %s and Program ID %d", request.vin(), request.programId())
            );
        }

        IncentiveProgram program = programRepository.findById(request.programId())
                .orElseThrow(() -> new ResourceNotFoundException("Incentive program not found with ID: " + request.programId()));

        String claimReference = "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Claim claim = new Claim(
                null,
                claimReference,
                request.vin(),
                request.dealerId(),
                program,
                request.vehicleModel(),
                request.msrp(),
                request.claimedAmount()
        );

        Claim savedClaim = claimRepository.save(claim);
        log.info("Claim created in DB with ID={} ref={} status={}",
                savedClaim.getId(), savedClaim.getClaimReference(), savedClaim.getStatus());

        // Publish event to Kafka topic for asynchronous validation
        ClaimSubmittedEvent event = new ClaimSubmittedEvent(
                savedClaim.getId(),
                savedClaim.getClaimReference(),
                savedClaim.getVin(),
                savedClaim.getDealerId(),
                savedClaim.getProgram().getId(),
                savedClaim.getVehicleModel(),
                savedClaim.getMsrp(),
                savedClaim.getClaimedAmount(),
                savedClaim.getCreatedAt()
        );

        eventProducer.publishClaimSubmitted(event);

        return ClaimResponse.fromEntity(savedClaim);
    }

    @Transactional(readOnly = true)
    public ClaimResponse getClaimById(Long id) {
        return claimRepository.findById(id)
                .map(ClaimResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public ClaimResponse getClaimByReference(String reference) {
        return claimRepository.findByClaimReference(reference)
                .map(ClaimResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with reference: " + reference));
    }

    @Transactional(readOnly = true)
    public Page<ClaimResponse> getClaimsByDealer(String dealerId, Pageable pageable) {
        return claimRepository.findByDealerId(dealerId, pageable)
                .map(ClaimResponse::fromEntity);
    }
}
