package com.autoincentive.engine.web;

import com.autoincentive.engine.dto.request.QuoteRequest;
import com.autoincentive.engine.dto.response.QuoteResponse;
import com.autoincentive.engine.service.QuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for incentive calculation quotes.
 */
@RestController
@RequestMapping("/api/v1/incentives")
@Tag(name = "Incentive Quotes", description = "Calculate eligible discounts and net vehicle pricing")
public class QuoteController {

    private final QuoteService quoteService;

    public QuoteController(QuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @PostMapping("/quote")
    @Operation(summary = "Calculate incentive quote for a vehicle and buyer profile")
    public ResponseEntity<QuoteResponse> calculateQuote(@Valid @RequestBody QuoteRequest request) {
        QuoteResponse response = quoteService.calculateQuote(request);
        return ResponseEntity.ok(response);
    }
}
