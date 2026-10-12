package com.autoincentive.engine.repository;

import com.autoincentive.engine.domain.model.Claim;
import com.autoincentive.engine.domain.model.ClaimStatus;
import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.domain.repository.ClaimRepository;
import com.autoincentive.engine.domain.repository.IncentiveProgramRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration test running real PostgreSQL 16 container via Testcontainers.
 *
 * WHY Testcontainers over H2 in-memory DB:
 * H2 has different SQL dialects, index behaviors, and constraint locking compared to Postgres.
 * Running tests against the exact production database image (postgres:16-alpine) validates
 * Flyway migrations, database constraints, and custom indexes under real-world conditions.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ClaimRepositoryTestcontainersTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("test_incentivedb")
            .withUsername("test_user")
            .withPassword("test_pass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private IncentiveProgramRepository programRepository;

    @Test
    @DisplayName("Saves and retrieves Claim entity linked to IncentiveProgram in real PostgreSQL")
    void testSaveAndFindClaim() {
        IncentiveProgram program = new IncentiveProgram();
        program.setProgramCode("TEST_PROG_01");
        program.setName("Test Cash Incentive");
        program.setType(ProgramType.CASH_REBATE);
        program.setVehicleModel("F-150");
        program.setDiscountAmount(new BigDecimal("1500.00"));
        program.setStackable(true);
        program.setStartDate(LocalDate.now().minusDays(1));
        program.setEndDate(LocalDate.now().plusDays(30));
        IncentiveProgram savedProgram = programRepository.save(program);

        String claimRef = "CLM-" + UUID.randomUUID().toString().substring(0, 8);
        Claim claim = new Claim(
                null,
                claimRef,
                "1FA6P8CF5H5123456",
                "DLR-1001",
                savedProgram,
                "F-150",
                new BigDecimal("50000.00"),
                new BigDecimal("1500.00")
        );
        Claim savedClaim = claimRepository.saveAndFlush(claim);

        assertThat(savedClaim.getId()).isNotNull();

        Optional<Claim> retrieved = claimRepository.findByClaimReference(claimRef);
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getVin()).isEqualTo("1FA6P8CF5H5123456");
        assertThat(retrieved.get().getStatus()).isEqualTo(ClaimStatus.SUBMITTED);
        assertThat(retrieved.get().getProgram().getId()).isEqualTo(savedProgram.getId());
    }

    @Test
    @DisplayName("Enforces unique(vin, program_id) DB constraint throwing DataIntegrityViolationException on duplicates")
    void testUniqueConstraintOnVinAndProgramId() {
        IncentiveProgram program = new IncentiveProgram();
        program.setProgramCode("TEST_PROG_DUP");
        program.setName("Duplicate Check Program");
        program.setType(ProgramType.CASH_REBATE);
        program.setVehicleModel("Mustang");
        program.setDiscountAmount(new BigDecimal("1000.00"));
        program.setStackable(true);
        program.setStartDate(LocalDate.now().minusDays(1));
        program.setEndDate(LocalDate.now().plusDays(30));
        IncentiveProgram savedProgram = programRepository.save(program);

        // First claim for VIN + program
        Claim claim1 = new Claim(
                null,
                "CLM-11111111",
                "1FA6P8CF5H5999999",
                "DLR-1001",
                savedProgram,
                "Mustang",
                new BigDecimal("45000.00"),
                new BigDecimal("1000.00")
        );
        claimRepository.saveAndFlush(claim1);

        // Second claim for SAME VIN + SAME program -> must violate unique constraint uk_claims_vin_program
        Claim claim2 = new Claim(
                null,
                "CLM-22222222",
                "1FA6P8CF5H5999999",
                "DLR-1002",
                savedProgram,
                "Mustang",
                new BigDecimal("45000.00"),
                new BigDecimal("1000.00")
        );

        assertThatThrownBy(() -> claimRepository.saveAndFlush(claim2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
