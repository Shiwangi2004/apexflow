package com.autoincentive.engine.service;

import com.autoincentive.engine.domain.model.IncentiveProgram;
import com.autoincentive.engine.domain.repository.IncentiveProgramRepository;
import com.autoincentive.engine.dto.request.CreateProgramRequest;
import com.autoincentive.engine.dto.request.UpdateProgramRequest;
import com.autoincentive.engine.dto.response.ProgramResponse;
import com.autoincentive.engine.web.error.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Service handling lifecycle and CRUD operations for Incentive Programs.
 *
 * WHY @Transactional:
 * Ensures atomicity. Read-only methods use readOnly=true, which provides performance optimizations
 * by preventing Hibernate dirty-checking and allowing read-replica routing in enterprise clusters.
 */
@Service
public class IncentiveProgramService {

    private final IncentiveProgramRepository programRepository;

    public IncentiveProgramService(IncentiveProgramRepository programRepository) {
        this.programRepository = programRepository;
    }

    @Transactional(readOnly = true)
    public Page<ProgramResponse> getAllPrograms(Pageable pageable) {
        return programRepository.findAll(pageable)
                .map(ProgramResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProgramResponse getProgramById(Long id) {
        return programRepository.findById(id)
                .map(ProgramResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Incentive program not found with ID: " + id));
    }

    @Transactional
    public ProgramResponse createProgram(CreateProgramRequest request) {
        if (request.startDate().isAfter(request.endDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        if (programRepository.existsByProgramCode(request.programCode())) {
            throw new IllegalArgumentException("Program code already exists: " + request.programCode());
        }

        IncentiveProgram program = new IncentiveProgram();
        program.setProgramCode(request.programCode().trim());
        program.setName(request.name().trim());
        program.setType(request.type());
        program.setVehicleModel(request.vehicleModel() != null ? request.vehicleModel().trim() : null);
        program.setDiscountAmount(request.discountAmount());
        program.setAprRate(request.aprRate());
        program.setTermMonths(request.termMonths());
        program.setStandardAprRate(request.standardAprRate() != null ? request.standardAprRate() : new BigDecimal("6.50"));
        program.setStackable(request.stackable());
        program.setStartDate(request.startDate());
        program.setEndDate(request.endDate());

        IncentiveProgram saved = programRepository.save(program);
        return ProgramResponse.fromEntity(saved);
    }

    @Transactional
    public ProgramResponse updateProgram(Long id, UpdateProgramRequest request) {
        if (request.startDate().isAfter(request.endDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        IncentiveProgram program = programRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incentive program not found with ID: " + id));

        program.setName(request.name().trim());
        program.setVehicleModel(request.vehicleModel() != null ? request.vehicleModel().trim() : null);
        program.setDiscountAmount(request.discountAmount());
        program.setAprRate(request.aprRate());
        program.setTermMonths(request.termMonths());
        if (request.standardAprRate() != null) {
            program.setStandardAprRate(request.standardAprRate());
        }
        program.setStackable(request.stackable());
        program.setStartDate(request.startDate());
        program.setEndDate(request.endDate());

        IncentiveProgram updated = programRepository.save(program);
        return ProgramResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteProgram(Long id) {
        if (!programRepository.existsById(id)) {
            throw new ResourceNotFoundException("Incentive program not found with ID: " + id);
        }
        programRepository.deleteById(id);
    }
}
