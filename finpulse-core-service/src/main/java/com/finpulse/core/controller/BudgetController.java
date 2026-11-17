package com.finpulse.core.controller;

import com.finpulse.core.dto.BudgetCopyRequest;
import com.finpulse.core.dto.BudgetDto;
import com.finpulse.core.dto.BudgetRequest;
import com.finpulse.core.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ResponseEntity<List<BudgetDto>> getBudgets(
            @RequestParam(required = false, defaultValue = "1") Long userId,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(budgetService.getBudgets(userId, month));
    }

    @PostMapping
    public ResponseEntity<BudgetDto> setBudget(@Valid @RequestBody BudgetRequest request) {
        BudgetDto saved = budgetService.setBudget(request);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetDto> updateBudget(@PathVariable Long id, @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.updateBudget(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(Map.of("message", "Budget removed successfully"));
    }

    @PostMapping("/copy")
    public ResponseEntity<List<BudgetDto>> copyBudgets(
            @RequestParam(required = false, defaultValue = "1") Long userId,
            @Valid @RequestBody BudgetCopyRequest request) {
        return ResponseEntity.ok(budgetService.copyBudgets(userId, request));
    }

    // Backward-compatibility endpoint
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BudgetDto>> getBudgetsByUserAndMonth(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "2026-11") String monthYear) {
        return ResponseEntity.ok(budgetService.getBudgets(userId, monthYear));
    }
}
