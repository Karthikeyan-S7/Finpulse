package com.finpulse.core.controller;

import com.finpulse.core.dto.TransactionDto;
import com.finpulse.core.dto.TransactionRequest;
import com.finpulse.core.model.Transaction;
import com.finpulse.core.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<List<TransactionDto>> getTransactions(
            @RequestParam(required = false, defaultValue = "1") Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category) {
        LocalDate effectiveFrom = from != null ? from : startDate;
        LocalDate effectiveTo = to != null ? to : endDate;
        return ResponseEntity.ok(transactionService.getTransactions(userId, effectiveFrom, effectiveTo, accountId, type, category));
    }

    @PostMapping
    public ResponseEntity<TransactionDto> createTransaction(@Valid @RequestBody TransactionRequest request) {
        Transaction recorded = transactionService.recordTransaction(request);
        return new ResponseEntity<>(TransactionDto.fromEntity(recorded), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDto> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.updateTransaction(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok(Map.of("message", "Transaction deleted and account balance updated successfully"));
    }

    // Backward-compatibility endpoints
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionDto>> getTransactionsByUser(@PathVariable Long userId) {
        List<Transaction> list = transactionService.getTransactionsByUserId(userId);
        if (list == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(list.stream().map(TransactionDto::fromEntity).collect(Collectors.toList()));
    }

    @GetMapping("/user/{userId}/range")
    public ResponseEntity<List<TransactionDto>> getTransactionsByRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Transaction> list = transactionService.getTransactionsByDateRange(userId, startDate, endDate);
        if (list == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(list.stream().map(TransactionDto::fromEntity).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransactionById(id));
    }

    @GetMapping("/user/{userId}/overview")
    public ResponseEntity<Map<String, Object>> getFinancialOverview(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getFinancialOverview(userId));
    }
}
