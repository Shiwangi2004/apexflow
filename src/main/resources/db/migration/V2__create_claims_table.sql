-- V2: Create claims table with Foreign Key, indexes, and unique(vin, program_id) constraint.
-- WHY: Dealers submit claims for incentives when selling a vehicle.
-- An audit trail of claimed amounts, approval statuses, and rejection reasons is maintained.
-- The unique(vin, program_id) constraint prevents duplicate claims for the same vehicle and program at the DB level.

CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    claim_reference VARCHAR(64) NOT NULL,
    vin VARCHAR(17) NOT NULL,
    dealer_id VARCHAR(64) NOT NULL,
    program_id BIGINT NOT NULL,
    vehicle_model VARCHAR(64) NOT NULL,
    msrp NUMERIC(12, 2) NOT NULL,
    claimed_amount NUMERIC(12, 2) NOT NULL,
    approved_amount NUMERIC(12, 2),
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    rejection_reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_claim_reference UNIQUE (claim_reference),
    CONSTRAINT fk_claims_program FOREIGN KEY (program_id) REFERENCES incentive_programs(id),
    CONSTRAINT uk_claims_vin_program UNIQUE (vin, program_id)
);

-- Index for querying claims by VIN (e.g., auditing all incentives claimed on a vehicle)
CREATE INDEX idx_claims_vin ON claims(vin);

-- Index for reporting/filtering by dealer
CREATE INDEX idx_claims_dealer ON claims(dealer_id);

-- Index for reporting by program
CREATE INDEX idx_claims_program ON claims(program_id);

-- Index for filtering by status (SUBMITTED, APPROVED, REJECTED)
CREATE INDEX idx_claims_status ON claims(status);
