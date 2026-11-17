package com.finpulse.core.controller;

import com.finpulse.core.dto.AccountCreateRequest;
import com.finpulse.core.dto.AccountDto;
import com.finpulse.core.dto.AccountDeleteResponse;
import com.finpulse.core.dto.AccountSummaryDto;
import com.finpulse.core.dto.AccountUpdateRequest;
import com.finpulse.core.model.Account;
import com.finpulse.core.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<List<AccountDto>> getAccounts(
            @RequestParam(required = false, defaultValue = "1") Long userId,
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived) {
        return ResponseEntity.ok(accountService.getAccounts(userId, includeArchived));
    }

    @PostMapping
    public ResponseEntity<AccountDto> createAccount(@Valid @RequestBody AccountCreateRequest request) {
        AccountDto created = accountService.createAccount(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/summary")
    public ResponseEntity<List<AccountSummaryDto>> getAccountSummariesQuery(@RequestParam(required = false, defaultValue = "1") Long userId) {
        return ResponseEntity.ok(accountService.getAccountSummariesByUserId(userId));
    }

    @GetMapping("/net-worth")
    public ResponseEntity<BigDecimal> getUserNetWorthQuery(@RequestParam(required = false, defaultValue = "1") Long userId) {
        return ResponseEntity.ok(accountService.getUserNetWorth(userId));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<AccountDto> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.getAccountById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountDto> updateAccount(@PathVariable Long id, @RequestBody AccountUpdateRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AccountDeleteResponse> deleteAccount(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.deleteAccount(id));
    }

    // Backward-compatibility endpoints
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AccountDto>> getAccountsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(accountService.getAccounts(userId, true));
    }

    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<List<AccountSummaryDto>> getAccountSummaries(@PathVariable Long userId) {
        return ResponseEntity.ok(accountService.getAccountSummariesByUserId(userId));
    }

    @GetMapping("/user/{userId}/net-worth")
    public ResponseEntity<BigDecimal> getUserNetWorth(@PathVariable Long userId) {
        return ResponseEntity.ok(accountService.getUserNetWorth(userId));
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<AccountDto> createAccountLegacy(@PathVariable Long userId, @RequestBody Account account) {
        Account created = accountService.createAccount(userId, account);
        return new ResponseEntity<>(accountService.toDto(created), HttpStatus.CREATED);
    }
}
