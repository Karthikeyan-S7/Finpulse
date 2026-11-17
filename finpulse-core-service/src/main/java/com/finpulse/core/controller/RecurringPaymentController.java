package com.finpulse.core.controller;

import com.finpulse.core.dto.RecurringActivePatchRequest;
import com.finpulse.core.dto.RecurringPaymentDto;
import com.finpulse.core.dto.RecurringPaymentRequest;
import com.finpulse.core.dto.TransactionDto;
import com.finpulse.core.service.RecurringPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recurring")
public class RecurringPaymentController {

    private final RecurringPaymentService recurringPaymentService;

    public RecurringPaymentController(RecurringPaymentService recurringPaymentService) {
        this.recurringPaymentService = recurringPaymentService;
    }

    @GetMapping
    public ResponseEntity<List<RecurringPaymentDto>> getRecurringPayments(
            @RequestParam(required = false, defaultValue = "1") Long userId) {
        return ResponseEntity.ok(recurringPaymentService.getRecurringPayments(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecurringPaymentDto> getRecurringPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(recurringPaymentService.getRecurringPaymentById(id));
    }

    @PostMapping
    public ResponseEntity<RecurringPaymentDto> createRecurringPayment(@Valid @RequestBody RecurringPaymentRequest request) {
        RecurringPaymentDto created = recurringPaymentService.createRecurringPayment(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringPaymentDto> updateRecurringPayment(
            @PathVariable Long id,
            @Valid @RequestBody RecurringPaymentRequest request) {
        return ResponseEntity.ok(recurringPaymentService.updateRecurringPayment(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRecurringPayment(@PathVariable Long id) {
        recurringPaymentService.deleteRecurringPayment(id);
        return ResponseEntity.ok(Map.of("message", "Recurring payment removed successfully"));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<RecurringPaymentDto> toggleActiveStatus(
            @PathVariable Long id,
            @RequestBody(required = false) RecurringActivePatchRequest request) {
        Boolean targetState = (request != null) ? request.isActive() : null;
        return ResponseEntity.ok(recurringPaymentService.setActiveStatus(id, targetState));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<TransactionDto> payRecurring(@PathVariable Long id) {
        TransactionDto tx = recurringPaymentService.payRecurring(id);
        return ResponseEntity.ok(tx);
    }
}
