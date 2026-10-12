package com.autoincentive.engine.web;

import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.dto.request.QuoteRequest;
import com.autoincentive.engine.dto.response.AppliedIncentiveDto;
import com.autoincentive.engine.dto.response.QuoteResponse;
import com.autoincentive.engine.service.QuoteService;
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
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(QuoteController.class)
@Import(GlobalExceptionHandler.class)
class QuoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private QuoteService quoteService;

    @Test
    @DisplayName("POST /api/v1/incentives/quote returns 200 OK with calculated quote")
    void calculateQuote_success() throws Exception {
        QuoteRequest request = new QuoteRequest(
                "1FA6P8CF5H5123456", "F-150", new BigDecimal("50000.00"), true, LocalDate.now()
        );

        AppliedIncentiveDto applied = new AppliedIncentiveDto(
                1L, "CASH_1500", "Customer Cash", ProgramType.CASH_REBATE,
                new BigDecimal("1500.00"), true, "Direct rebate"
        );

        QuoteResponse response = new QuoteResponse(
                "1FA6P8CF5H5123456", "F-150", new BigDecimal("50000.00"),
                new BigDecimal("1500.00"), new BigDecimal("48500.00"), List.of(applied)
        );

        when(quoteService.calculateQuote(any(QuoteRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/incentives/quote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vin").value("1FA6P8CF5H5123456"))
                .andExpect(jsonPath("$.totalIncentiveSavings").value(1500.00))
                .andExpect(jsonPath("$.netVehiclePrice").value(48500.00))
                .andExpect(jsonPath("$.appliedIncentives[0].programCode").value("CASH_1500"));
    }

    @Test
    @DisplayName("POST /api/v1/incentives/quote fails with 400 Bad Request when VIN is invalid length/format")
    void calculateQuote_invalidVin() throws Exception {
        QuoteRequest invalidRequest = new QuoteRequest(
                "SHORT_VIN", "F-150", new BigDecimal("50000.00"), true, LocalDate.now()
        );

        mockMvc.perform(post("/api/v1/incentives/quote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid Request Content"))
                .andExpect(jsonPath("$.invalidFields.vin").exists());
    }
}
