package com.autoincentive.engine.domain.repository;

import com.autoincentive.engine.domain.model.Claim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Claim.
 */
@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    Optional<Claim> findByClaimReference(String claimReference);

    /**
     * Checks if a claim already exists for the given VIN and program.
     * Used for application-level idempotency / duplicate detection before state mutation.
     */
    @Query("SELECT COUNT(c) > 0 FROM Claim c WHERE c.vin = :vin AND c.program.id = :programId")
    boolean existsByVinAndProgramId(@Param("vin") String vin, @Param("programId") Long programId);

    List<Claim> findByVin(String vin);

    Page<Claim> findByDealerId(String dealerId, Pageable pageable);
}
