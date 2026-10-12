-- V1: Create incentive_programs table with appropriate types, defaults, and lookup indexes.
-- WHY: Programs define financial rules (cash rebates, APR financing, loyalty discounts)
-- offered by manufacturers to dealers and end-consumers.

CREATE TABLE incentive_programs (
    id BIGSERIAL PRIMARY KEY,
    program_code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,
    vehicle_model VARCHAR(64),
    discount_amount NUMERIC(12, 2),
    apr_rate NUMERIC(5, 2),
    term_months INTEGER,
    standard_apr_rate NUMERIC(5, 2) DEFAULT 6.50,
    stackable BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_program_code UNIQUE (program_code)
);

-- Index for searching active programs by date range during quote generation
CREATE INDEX idx_programs_dates ON incentive_programs(start_date, end_date);

-- Index for filtering by vehicle model (e.g. F-150, Explorer)
CREATE INDEX idx_programs_vehicle_model ON incentive_programs(vehicle_model);
