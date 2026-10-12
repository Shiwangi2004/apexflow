package com.autoincentive.engine.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * Entity representing an incentive claim submitted by a dealer.
 *
 * WHY FetchType.LAZY on @ManyToOne:
 * Hibernate defaults @ManyToOne to FetchType.EAGER. Eager fetching immediately triggers
 * joins or secondary select queries on every claim fetch, even when the caller only needs
 * claim metadata. Explicitly using LAZY prevents hidden query bloat and preserves N+1 control.
 *
 * WHY unique(vin, program_id) in database:
 * Even if two concurrent requests bypass application-level validation at the exact same millisecond,
 * the database unique constraint guarantees absolute data integrity.
 */
@Entity
@Table(
        name = "claims",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_claims_vin_program", columnNames = {"vin", "program_id"})
        }
)
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_reference", nullable = false, unique = true, length = 64)
    private String claimReference;

    @Column(name = "vin", nullable = false, length = 17)
    private String vin;

    @Column(name = "dealer_id", nullable = false, length = 64)
    private String dealerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id", nullable = false)
    private IncentiveProgram program;

    @Column(name = "vehicle_model", nullable = false, length = 64)
    private String vehicleModel;

    @Column(name = "msrp", nullable = false, precision = 12, scale = 2)
    private BigDecimal msrp;

    @Column(name = "claimed_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal claimedAmount;

    @Column(name = "approved_amount", precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ClaimStatus status = ClaimStatus.SUBMITTED;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Claim() {
    }

    public Claim(Long id, String claimReference, String vin, String dealerId,
                 IncentiveProgram program, String vehicleModel, BigDecimal msrp,
                 BigDecimal claimedAmount) {
        this.id = id;
        this.claimReference = claimReference;
        this.vin = vin;
        this.dealerId = dealerId;
        this.program = program;
        this.vehicleModel = vehicleModel;
        this.msrp = msrp;
        this.claimedAmount = claimedAmount;
        this.status = ClaimStatus.SUBMITTED;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Business domain methods: encapsulate state transitions
    public void approve(BigDecimal amount) {
        this.status = ClaimStatus.APPROVED;
        this.approvedAmount = amount;
        this.rejectionReason = null;
    }

    public void reject(String reason) {
        this.status = ClaimStatus.REJECTED;
        this.approvedAmount = BigDecimal.ZERO;
        this.rejectionReason = reason;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClaimReference() {
        return claimReference;
    }

    public void setClaimReference(String claimReference) {
        this.claimReference = claimReference;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public String getDealerId() {
        return dealerId;
    }

    public void setDealerId(String dealerId) {
        this.dealerId = dealerId;
    }

    public IncentiveProgram getProgram() {
        return program;
    }

    public void setProgram(IncentiveProgram program) {
        this.program = program;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public BigDecimal getMsrp() {
        return msrp;
    }

    public void setMsrp(BigDecimal msrp) {
        this.msrp = msrp;
    }

    public BigDecimal getClaimedAmount() {
        return claimedAmount;
    }

    public void setClaimedAmount(BigDecimal claimedAmount) {
        this.claimedAmount = claimedAmount;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Claim claim)) return false;
        return Objects.equals(claimReference, claim.claimReference);
    }

    @Override
    public int hashCode() {
        return Objects.hash(claimReference);
    }
}
