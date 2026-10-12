package com.autoincentive.engine.web;

import com.autoincentive.engine.domain.model.ClaimStatus;
import com.autoincentive.engine.dto.request.SubmitClaimRequest;
import com.autoincentive.engine.dto.response.ClaimResponse;
import com.autoincentive.engine.service.ClaimService;
import com.autoincentive.engine.web.error.DuplicateClaimException;
import com.autoincentive.engine.web.error.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ClaimController.class)
@Import(GlobalExceptionHandler.class)
class ClaimControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClaimService claimService;

    @Test
    @DisplayName("POST /api/v1/claims returns 201 Created with SUBMITTED status")
    void submitClaim_success() throws Exception {
        SubmitClaimRequest request = new SubmitClaimRequest(
                "1FA6P8CF5H5123456", "DLR-1001", 10L, "F-150",
                new BigDecimal("50000.00"), new BigDecimal("1500.00")
        );

        ClaimResponse response = new ClaimResponse(
                1L, "CLM-ABCD1234", "1FA6P8CF5H5123456", "DLR-1001",
                10L, "F150_CASH", "F-150", new BigDecimal("50000.00"),
                new BigDecimal("1500.00"), null, ClaimStatus.SUBMITTED,
                null, Instant.now(), Instant.now()
        );

        when(claimService.submitClaim(any(SubmitClaimRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/claims")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.claimReference").value("CLM-ABCD1234"))
                .andExpect(jsonPath("$.status").value("SUBMITTED"));
    }

    @Test
    @DisplayName("POST /api/v1/claims returns 409 Conflict when duplicate claim is detected")
    void submitClaim_duplicateConflict() throws Exception {
        SubmitClaimRequest request = new SubmitClaimRequest(
                "1FA6P8CF5H5123456", "DLR-1001", 10L, "F-150",
                new BigDecimal("50000.00"), new BigDecimal("1500.00")
        );

        when(claimService.submitClaim(any(SubmitClaimRequest.class)))
                .thenThrow(new DuplicateClaimException("Claim already exists for VIN 1FA6P8CF5H5123456 and Program ID 10"));

        mockMvc.perform(post("/api/v1/claims")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Duplicate Claim Conflict"))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("Claim already exists for VIN")));
    }
}
