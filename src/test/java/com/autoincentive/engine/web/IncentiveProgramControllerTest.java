package com.autoincentive.engine.web;

import com.autoincentive.engine.domain.model.ProgramType;
import com.autoincentive.engine.dto.request.CreateProgramRequest;
import com.autoincentive.engine.dto.response.ProgramResponse;
import com.autoincentive.engine.service.IncentiveProgramService;
import com.autoincentive.engine.web.error.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IncentiveProgramController.class)
@Import(GlobalExceptionHandler.class)
class IncentiveProgramControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private IncentiveProgramService programService;

    @Test
    @DisplayName("GET /api/v1/programs returns paged list of incentive programs")
    void getAllPrograms_returnsPagedList() throws Exception {
        ProgramResponse response = new ProgramResponse(
                1L, "CASH_1000", "Summer Cash", ProgramType.CASH_REBATE, "F-150",
                new BigDecimal("1000.00"), null, null, new BigDecimal("6.50"), true,
                LocalDate.now(), LocalDate.now().plusDays(30), Instant.now(), Instant.now()
        );

        when(programService.getAllPrograms(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(response)));

        mockMvc.perform(get("/api/v1/programs")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].programCode").value("CASH_1000"))
                .andExpect(jsonPath("$.content[0].name").value("Summer Cash"))
                .andExpect(jsonPath("$.content[0].discountAmount").value(1000.00));
    }

    @Test
    @DisplayName("POST /api/v1/programs creates program and returns 201 Created")
    void createProgram_success() throws Exception {
        CreateProgramRequest request = new CreateProgramRequest(
                "CASH_1000", "Summer Cash", ProgramType.CASH_REBATE, "F-150",
                new BigDecimal("1000.00"), null, null, new BigDecimal("6.50"), true,
                LocalDate.now(), LocalDate.now().plusDays(30)
        );

        ProgramResponse response = new ProgramResponse(
                1L, "CASH_1000", "Summer Cash", ProgramType.CASH_REBATE, "F-150",
                new BigDecimal("1000.00"), null, null, new BigDecimal("6.50"), true,
                LocalDate.now(), LocalDate.now().plusDays(30), Instant.now(), Instant.now()
        );

        when(programService.createProgram(any(CreateProgramRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/programs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.programCode").value("CASH_1000"));
    }

    @Test
    @DisplayName("POST /api/v1/programs fails validation when required fields are missing, returns ProblemDetail")
    void createProgram_validationFailure() throws Exception {
        // Missing programCode and name
        CreateProgramRequest invalidRequest = new CreateProgramRequest(
                "", "", ProgramType.CASH_REBATE, "F-150",
                new BigDecimal("1000.00"), null, null, null, true,
                LocalDate.now(), LocalDate.now().plusDays(30)
        );

        mockMvc.perform(post("/api/v1/programs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid Request Content"))
                .andExpect(jsonPath("$.invalidFields.programCode").exists())
                .andExpect(jsonPath("$.invalidFields.name").exists());
    }
}
