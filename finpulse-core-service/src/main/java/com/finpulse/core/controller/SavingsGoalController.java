package com.finpulse.core.controller;

import com.finpulse.core.dto.GoalContributeRequest;
import com.finpulse.core.dto.SavingsGoalDto;
import com.finpulse.core.dto.SavingsGoalRequest;
import com.finpulse.core.service.SavingsGoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
public class SavingsGoalController {

    private final SavingsGoalService savingsGoalService;

    public SavingsGoalController(SavingsGoalService savingsGoalService) {
        this.savingsGoalService = savingsGoalService;
    }

    @GetMapping
    public ResponseEntity<List<SavingsGoalDto>> getGoals(
            @RequestParam(required = false, defaultValue = "1") Long userId) {
        return ResponseEntity.ok(savingsGoalService.getGoals(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavingsGoalDto> getGoalById(@PathVariable Long id) {
        return ResponseEntity.ok(savingsGoalService.getGoalById(id));
    }

    @PostMapping
    public ResponseEntity<SavingsGoalDto> createGoal(@Valid @RequestBody SavingsGoalRequest request) {
        SavingsGoalDto created = savingsGoalService.createGoal(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingsGoalDto> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody SavingsGoalRequest request) {
        return ResponseEntity.ok(savingsGoalService.updateGoal(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteGoal(@PathVariable Long id) {
        savingsGoalService.deleteGoal(id);
        return ResponseEntity.ok(Map.of("message", "Savings goal removed successfully"));
    }

    @PostMapping("/{id}/contribute")
    public ResponseEntity<SavingsGoalDto> contribute(
            @PathVariable Long id,
            @Valid @RequestBody GoalContributeRequest request) {
        return ResponseEntity.ok(savingsGoalService.contribute(id, request));
    }
}
