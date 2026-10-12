package com.autoincentive.engine.web;

import com.autoincentive.engine.dto.request.SubmitClaimRequest;
import com.autoincentive.engine.dto.response.ClaimResponse;
import com.autoincentive.engine.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for dealer incentive claim submission and inquiry.
 */
@RestController
@RequestMapping("/api/v1/claims")
@Tag(name = "Claims", description = "Endpoints for dealer incentive claim submission and audit status")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping
    @Operation(summary = "Submit a new incentive claim for asynchronous validation")
    public ResponseEntity<ClaimResponse> submitClaim(@Valid @RequestBody SubmitClaimRequest request) {
        ClaimResponse response = claimService.submitClaim(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get claim details by ID")
    public ResponseEntity<ClaimResponse> getClaimById(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getClaimById(id));
    }

    @GetMapping("/reference/{reference}")
    @Operation(summary = "Get claim details by unique claim reference code")
    public ResponseEntity<ClaimResponse> getClaimByReference(@PathVariable String reference) {
        return ResponseEntity.ok(claimService.getClaimByReference(reference));
    }

    @GetMapping("/dealer/{dealerId}")
    @Operation(summary = "List claims submitted by a specific dealer with pagination")
    public ResponseEntity<Page<ClaimResponse>> getClaimsByDealer(
            @PathVariable String dealerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(claimService.getClaimsByDealer(dealerId, pageable));
    }
}
