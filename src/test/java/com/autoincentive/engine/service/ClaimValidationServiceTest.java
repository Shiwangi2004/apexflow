package com.autoincentive.engine.service;

import com.autoincentive.engine.domain.model.Claim;
import com.autoincentive.engine.domain.model.ClaimStatus;
import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.domain.repository.ClaimRepository;
import com.autoincentive.engine.domain.repository.IncentiveProgramRepository;
import com.autoincentive.engine.dto.event.ClaimSubmittedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClaimValidationServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private IncentiveProgramRepository programRepository;

    private ClaimValidationService validationService;

    @BeforeEach
    void setUp() {
        validationService = new ClaimValidationService(claimRepository, programRepository);
    }

    @Test
    @DisplayName("Approves valid claim matching program terms and dates")
    void validateClaim_approvesValidClaim() {
        LocalDate today = LocalDate.now();
        IncentiveProgram program = new IncentiveProgram(
                10L, "PROG_CASH", "Customer Cash", ProgramType.CASH_REBATE,
                "F-150", new BigDecimal("1500.00"), null, null, null, true,
                today.minusDays(5), today.plusDays(30)
        );

        Claim claim = new Claim(
                50L, "CLM-1234", "1FA6P8CF5H5123456", "DLR-1",
                program, "F-150", new BigDecimal("50000.00"), new BigDecimal("1500.00")
        );

        ClaimSubmittedEvent event = new ClaimSubmittedEvent(
                50L, "CLM-1234", "1FA6P8CF5H5123456", "DLR-1",
                10L, "F-150", new BigDecimal("50000.00"), new BigDecimal("1500.00"), Instant.now()
        );

        when(claimRepository.findById(50L)).thenReturn(Optional.of(claim));
        when(claimRepository.findByVin("1FA6P8CF5H5123456")).thenReturn(List.of(claim));
        when(programRepository.findById(10L)).thenReturn(Optional.of(program));
        when(claimRepository.save(any(Claim.class))).thenAnswer(i -> i.getArgument(0));

        Claim result = validationService.validateClaim(event);

        assertThat(result.getStatus()).isEqualTo(ClaimStatus.APPROVED);
        assertThat(result.getApprovedAmount()).isEqualByComparingTo("1500.00");
        assertThat(result.getRejectionReason()).isNull();
    }

    @Test
    @DisplayName("Rejects claim when duplicate approved claim exists for the VIN")
    void validateClaim_rejectsDuplicateApprovedClaim() {
        LocalDate today = LocalDate.now();
        IncentiveProgram program = new IncentiveProgram(
                10L, "PROG_CASH", "Customer Cash", ProgramType.CASH_REBATE,
                "F-150", new BigDecimal("1500.00"), null, null, null, true,
                today.minusDays(5), today.plusDays(30)
        );

        Claim newClaim = new Claim(
                51L, "CLM-9999", "1FA6P8CF5H5123456", "DLR-1",
                program, "F-150", new BigDecimal("50000.00"), new BigDecimal("1500.00")
        );

        Claim existingApprovedClaim = new Claim(
                50L, "CLM-1234", "1FA6P8CF5H5123456", "DLR-1",
                program, "F-150", new BigDecimal("50000.00"), new BigDecimal("1500.00")
        );
        existingApprovedClaim.approve(new BigDecimal("1500.00"));

        ClaimSubmittedEvent event = new ClaimSubmittedEvent(
                51L, "CLM-9999", "1FA6P8CF5H5123456", "DLR-1",
                10L, "F-150", new BigDecimal("50000.00"), new BigDecimal("1500.00"), Instant.now()
        );

        when(claimRepository.findById(51L)).thenReturn(Optional.of(newClaim));
        when(claimRepository.findByVin("1FA6P8CF5H5123456")).thenReturn(List.of(existingApprovedClaim, newClaim));
        when(claimRepository.save(any(Claim.class))).thenAnswer(i -> i.getArgument(0));

        Claim result = validationService.validateClaim(event);

        assertThat(result.getStatus()).isEqualTo(ClaimStatus.REJECTED);
        assertThat(result.getRejectionReason()).contains("Duplicate claim");
    }

    @Test
    @DisplayName("Rejects claim when claimed amount exceeds program discount")
    void validateClaim_rejectsExcessiveAmount() {
        LocalDate today = LocalDate.now();
        IncentiveProgram program = new IncentiveProgram(
                10L, "PROG_CASH", "Customer Cash", ProgramType.CASH_REBATE,
                "F-150", new BigDecimal("1000.00"), null, null, null, true,
                today.minusDays(5), today.plusDays(30)
        );

        // Dealer claimed $2,500 on a $1,000 max program
        Claim claim = new Claim(
                52L, "CLM-5555", "1FA6P8CF5H5123456", "DLR-1",
                program, "F-150", new BigDecimal("50000.00"), new BigDecimal("2500.00")
        );

        ClaimSubmittedEvent event = new ClaimSubmittedEvent(
                52L, "CLM-5555", "1FA6P8CF5H5123456", "DLR-1",
                10L, "F-150", new BigDecimal("50000.00"), new BigDecimal("2500.00"), Instant.now()
        );

        when(claimRepository.findById(52L)).thenReturn(Optional.of(claim));
        when(claimRepository.findByVin("1FA6P8CF5H5123456")).thenReturn(List.of(claim));
        when(programRepository.findById(10L)).thenReturn(Optional.of(program));
        when(claimRepository.save(any(Claim.class))).thenAnswer(i -> i.getArgument(0));

        Claim result = validationService.validateClaim(event);

        assertThat(result.getStatus()).isEqualTo(ClaimStatus.REJECTED);
        assertThat(result.getRejectionReason()).contains("exceeds program maximum");
    }

    @Test
    @DisplayName("Rejects claim when vehicle model does not match program eligibility")
    void validateClaim_rejectsModelMismatch() {
        LocalDate today = LocalDate.now();
        IncentiveProgram program = new IncentiveProgram(
                10L, "MUSTANG_CASH", "Mustang Cash", ProgramType.CASH_REBATE,
                "Mustang", new BigDecimal("1000.00"), null, null, null, true,
                today.minusDays(5), today.plusDays(30)
        );

        // Claimed on an F-150
        Claim claim = new Claim(
                53L, "CLM-6666", "1FA6P8CF5H5123456", "DLR-1",
                program, "F-150", new BigDecimal("50000.00"), new BigDecimal("1000.00")
        );

        ClaimSubmittedEvent event = new ClaimSubmittedEvent(
                53L, "CLM-6666", "1FA6P8CF5H5123456", "DLR-1",
                10L, "F-150", new BigDecimal("50000.00"), new BigDecimal("1000.00"), Instant.now()
        );

        when(claimRepository.findById(53L)).thenReturn(Optional.of(claim));
        when(claimRepository.findByVin("1FA6P8CF5H5123456")).thenReturn(List.of(claim));
        when(programRepository.findById(10L)).thenReturn(Optional.of(program));
        when(claimRepository.save(any(Claim.class))).thenAnswer(i -> i.getArgument(0));

        Claim result = validationService.validateClaim(event);

        assertThat(result.getStatus()).isEqualTo(ClaimStatus.REJECTED);
        assertThat(result.getRejectionReason()).contains("Vehicle model mismatch");
    }
}
