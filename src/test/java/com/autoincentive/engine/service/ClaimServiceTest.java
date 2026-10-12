package com.autoincentive.engine.service;

import com.autoincentive.engine.domain.model.Claim;
import com.autoincentive.engine.domain.model.ClaimStatus;
import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.domain.repository.ClaimRepository;
import com.autoincentive.engine.domain.repository.IncentiveProgramRepository;
import com.autoincentive.engine.dto.event.ClaimSubmittedEvent;
import com.autoincentive.engine.dto.request.SubmitClaimRequest;
import com.autoincentive.engine.dto.response.ClaimResponse;
import com.autoincentive.engine.messaging.ClaimEventProducer;
import com.autoincentive.engine.web.error.DuplicateClaimException;
import com.autoincentive.engine.web.error.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private IncentiveProgramRepository programRepository;

    @Mock
    private ClaimEventProducer eventProducer;

    private ClaimService claimService;

    @BeforeEach
    void setUp() {
        claimService = new ClaimService(claimRepository, programRepository, eventProducer);
    }

    @Test
    @DisplayName("Successfully creates SUBMITTED claim and publishes Kafka event keyed by VIN")
    void submitClaim_success() {
        SubmitClaimRequest request = new SubmitClaimRequest(
                "1FA6P8CF5H5123456",
                "DLR-1001",
                10L,
                "F-150",
                new BigDecimal("52000.00"),
                new BigDecimal("1500.00")
        );

        IncentiveProgram program = new IncentiveProgram(
                10L, "F150_CASH", "F-150 Customer Cash", ProgramType.CASH_REBATE,
                "F-150", new BigDecimal("1500.00"), null, null, null, true,
                LocalDate.now().minusDays(1), LocalDate.now().plusDays(30)
        );

        when(claimRepository.existsByVinAndProgramId("1FA6P8CF5H5123456", 10L)).thenReturn(false);
        when(programRepository.findById(10L)).thenReturn(Optional.of(program));

        when(claimRepository.save(any(Claim.class))).thenAnswer(invocation -> {
            Claim claim = invocation.getArgument(0);
            claim.setId(101L);
            return claim;
        });

        ClaimResponse response = claimService.submitClaim(request);

        assertThat(response.id()).isEqualTo(101L);
        assertThat(response.status()).isEqualTo(ClaimStatus.SUBMITTED);
        assertThat(response.vin()).isEqualTo("1FA6P8CF5H5123456");

        // Verify Kafka event published
        ArgumentCaptor<ClaimSubmittedEvent> eventCaptor = ArgumentCaptor.forClass(ClaimSubmittedEvent.class);
        verify(eventProducer, times(1)).publishClaimSubmitted(eventCaptor.capture());
        ClaimSubmittedEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent.vin()).isEqualTo("1FA6P8CF5H5123456");
        assertThat(publishedEvent.claimId()).isEqualTo(101L);
        assertThat(publishedEvent.claimedAmount()).isEqualByComparingTo("1500.00");
    }

    @Test
    @DisplayName("Throws DuplicateClaimException when VIN already has a claim for the program")
    void submitClaim_duplicateThrowsException() {
        SubmitClaimRequest request = new SubmitClaimRequest(
                "1FA6P8CF5H5123456", "DLR-1001", 10L, "F-150",
                new BigDecimal("52000.00"), new BigDecimal("1500.00")
        );

        when(claimRepository.existsByVinAndProgramId("1FA6P8CF5H5123456", 10L)).thenReturn(true);

        assertThatThrownBy(() -> claimService.submitClaim(request))
                .isInstanceOf(DuplicateClaimException.class)
                .hasMessageContaining("Claim already exists for VIN");

        verify(claimRepository, never()).save(any());
        verify(eventProducer, never()).publishClaimSubmitted(any());
    }

    @Test
    @DisplayName("Throws ResourceNotFoundException when program does not exist")
    void submitClaim_programNotFoundThrowsException() {
        SubmitClaimRequest request = new SubmitClaimRequest(
                "1FA6P8CF5H5123456", "DLR-1001", 999L, "F-150",
                new BigDecimal("52000.00"), new BigDecimal("1500.00")
        );

        when(claimRepository.existsByVinAndProgramId("1FA6P8CF5H5123456", 999L)).thenReturn(false);
        when(programRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> claimService.submitClaim(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Incentive program not found with ID: 999");
    }
}
