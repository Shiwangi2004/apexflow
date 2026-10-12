package com.autoincentive.engine.domain.repository;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for IncentiveProgram.
 *
 * WHY Spring Data JPA:
 * Provides CRUD methods out of the box with zero boilerplate code. At runtime,
 * Spring dynamically creates proxy implementations based on interface declarations.
 */
@Repository
public interface IncentiveProgramRepository extends JpaRepository<IncentiveProgram, Long> {

    Optional<IncentiveProgram> findByProgramCode(String programCode);

    boolean existsByProgramCode(String programCode);

    /**
     * Finds active programs on a specific date eligible for the given vehicle model or applicable to all models.
     *
     * WHY JPQL query:
     * Eliminates in-memory filtering by pushing the date interval and model matching
     * down to the database index level (idx_programs_dates, idx_programs_vehicle_model).
     */
    @Query("""
           SELECT p FROM IncentiveProgram p
           WHERE p.startDate <= :date
             AND p.endDate >= :date
             AND (p.vehicleModel IS NULL OR LOWER(p.vehicleModel) = LOWER(:model))
           """)
    List<IncentiveProgram> findActiveProgramsForModel(@Param("date") LocalDate date, @Param("model") String model);
}
