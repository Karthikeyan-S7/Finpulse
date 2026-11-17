package com.finpulse.core.service;

import com.finpulse.core.dto.AccountCreateRequest;
import com.finpulse.core.dto.AccountDto;
import com.finpulse.core.dto.AccountDeleteResponse;
import com.finpulse.core.dto.AccountSummaryDto;
import com.finpulse.core.dto.AccountUpdateRequest;
import com.finpulse.core.exception.BusinessConflictException;
import com.finpulse.core.exception.ResourceNotFoundException;
import com.finpulse.core.model.Account;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.AccountRepository;
import com.finpulse.core.repository.TransactionRepository;
import com.finpulse.core.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<AccountDto> getAccounts(Long userId, boolean includeArchived) {
        Long resolvedUserId = userId != null ? userId : 1L;
        List<Account> accounts = includeArchived
                ? accountRepository.findByUserId(resolvedUserId)
                : accountRepository.findByUserIdAndIsArchivedFalse(resolvedUserId);
        return accounts.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Account> getAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Account getAccountEntityById(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + accountId));
    }

    @Transactional(readOnly = true)
    public AccountDto getAccountById(Long accountId) {
        return toDto(getAccountEntityById(accountId));
    }

    @Transactional(readOnly = true)
    public BigDecimal getUserNetWorth(Long userId) {
        return accountRepository.getTotalNetWorthByUserId(userId != null ? userId : 1L);
    }

    @Transactional(readOnly = true)
    public List<AccountSummaryDto> getAccountSummariesByUserId(Long userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        return accounts.stream().map(acc -> {
            Long count = transactionRepository.countByAccountId(acc.getId());
            return new AccountSummaryDto(
                    acc.getId(),
                    acc.getAccountName(),
                    acc.getAccountNumber(),
                    acc.getAccountType(),
                    acc.getBalance(),
                    acc.getCurrency(),
                    count
            );
        }).collect(Collectors.toList());
    }

    public AccountDto createAccount(AccountCreateRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.userId()));

        if (accountRepository.existsByAccountNumber(request.accountNumber().trim())) {
            throw new BusinessConflictException("Account number already exists: " + request.accountNumber());
        }

        BigDecimal initialBalance = request.balance() != null ? request.balance() : BigDecimal.ZERO;
        String currency = (request.currency() != null && !request.currency().isBlank())
                ? request.currency().trim().toUpperCase()
                : user.getCurrency();

        Account account = new Account(
                null,
                user,
                request.accountName().trim(),
                request.accountNumber().trim(),
                request.accountType().trim().toUpperCase(),
                initialBalance,
                currency,
                false
        );

        Account saved = accountRepository.save(account);
        return toDto(saved);
    }

    public Account createAccount(Long userId, Account account) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        account.setUser(user);
        return accountRepository.save(account);
    }

    public AccountDto updateAccount(Long id, AccountUpdateRequest request) {
        Account account = getAccountEntityById(id);

        if (request.accountName() != null && !request.accountName().isBlank()) {
            account.setAccountName(request.accountName().trim());
        }
        if (request.accountType() != null && !request.accountType().isBlank()) {
            account.setAccountType(request.accountType().trim().toUpperCase());
        }
        if (request.isArchived() != null) {
            account.setIsArchived(request.isArchived());
        }

        Account updated = accountRepository.save(account);
        return toDto(updated);
    }

    public AccountDeleteResponse deleteAccount(Long id) {
        Account account = getAccountEntityById(id);
        Long txCount = transactionRepository.countByAccountId(id);

        if (txCount != null && txCount > 0) {
            account.setIsArchived(true);
            accountRepository.save(account);
            return new AccountDeleteResponse(id, "ARCHIVED", "Account contains " + txCount + " transaction(s) and has been archived.");
        } else {
            accountRepository.delete(account);
            return new AccountDeleteResponse(id, "DELETED", "Account had no transactions and was permanently deleted.");
        }
    }

    public void updateAccountBalance(Long accountId, BigDecimal balanceDelta) {
        Account account = getAccountEntityById(accountId);
        account.setBalance(account.getBalance().add(balanceDelta));
        accountRepository.save(account);
    }

    public AccountDto toDto(Account account) {
        Long userId = (account.getUser() != null) ? account.getUser().getId() : null;
        return new AccountDto(
                account.getId(),
                userId,
                account.getAccountName(),
                account.getAccountNumber(),
                account.getAccountType(),
                account.getBalance(),
                account.getCurrency(),
                account.getIsArchived(),
                account.getCreatedAt()
        );
    }
}
