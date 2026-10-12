package com.autoincentive.engine.web;

import com.autoincentive.engine.dto.request.CreateProgramRequest;
import com.autoincentive.engine.dto.request.UpdateProgramRequest;
import com.autoincentive.engine.dto.response.ProgramResponse;
import com.autoincentive.engine.service.IncentiveProgramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for Incentive Program CRUD operations with pagination.
 *
 * WHY Constructor Injection:
 * Spring team strongly recommends constructor injection over field injection (@Autowired).
 * It enables final immutable fields, facilitates pure unit testing without reflection or Spring test context,
 * and makes bean dependencies explicit.
 */
@RestController
@RequestMapping("/api/v1/programs")
@Tag(name = "Incentive Programs", description = "CRUD and lifecycle management for OEM incentive programs")
public class IncentiveProgramController {

    private final IncentiveProgramService programService;

    public IncentiveProgramController(IncentiveProgramService programService) {
        this.programService = programService;
    }

    @GetMapping
    @Operation(summary = "List all incentive programs with pagination")
    public ResponseEntity<Page<ProgramResponse>> getAllPrograms(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(programService.getAllPrograms(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get incentive program details by ID")
    public ResponseEntity<ProgramResponse> getProgramById(@PathVariable Long id) {
        return ResponseEntity.ok(programService.getProgramById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new incentive program")
    public ResponseEntity<ProgramResponse> createProgram(@Valid @RequestBody CreateProgramRequest request) {
        ProgramResponse created = programService.createProgram(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing incentive program")
    public ResponseEntity<ProgramResponse> updateProgram(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProgramRequest request) {
        return ResponseEntity.ok(programService.updateProgram(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an incentive program")
    public ResponseEntity<Void> deleteProgram(@PathVariable Long id) {
        programService.deleteProgram(id);
        return ResponseEntity.noContent().build();
    }
}
