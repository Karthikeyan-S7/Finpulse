package com.finpulse.core.service;

import com.finpulse.core.dto.TransferRequest;
import com.finpulse.core.dto.TransferResponse;
import com.finpulse.core.exception.BusinessConflictException;
import com.finpulse.core.exception.InsufficientFundsException;
import com.finpulse.core.exception.ResourceNotFoundException;
import com.finpulse.core.model.Account;
import com.finpulse.core.model.Transaction;
import com.finpulse.core.repository.AccountRepository;
import com.finpulse.core.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@Transactional
public class TransferService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public TransferService(AccountRepository accountRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    public TransferResponse executeTransfer(TransferRequest request) {
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw new BusinessConflictException("Source and destination accounts must be different for a transfer");
        }

        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be strictly positive");
        }

        if (request.date() != null && request.date().isAfter(LocalDate.now().plusYears(1))) {
            throw new IllegalArgumentException("Transfer date cannot be more than 1 year in the future: " + request.date());
        }

        Account fromAccount = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found with id: " + request.fromAccountId()));

        Account toAccount = accountRepository.findById(request.toAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found with id: " + request.toAccountId()));

        if (Boolean.TRUE.equals(fromAccount.getIsArchived())) {
            throw new BusinessConflictException("Cannot transfer from archived account: " + fromAccount.getAccountName());
        }

        if (Boolean.TRUE.equals(toAccount.getIsArchived())) {
            throw new BusinessConflictException("Cannot transfer to archived account: " + toAccount.getAccountName());
        }

        // Overdraft Guard on source account
        if (isOverdraftProtected(fromAccount.getAccountType())) {
            BigDecimal resulting = fromAccount.getBalance().subtract(request.amount());
            if (resulting.compareTo(BigDecimal.ZERO) < 0) {
                throw new InsufficientFundsException(
                        "Insufficient funds: transfer would overdraft source account '" +
                        fromAccount.getAccountName() + "'. Current balance: " + fromAccount.getBalance() +
                        ", transfer amount: " + request.amount()
                );
            }
        }

        // Apply balance changes
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.amount()));
        toAccount.setBalance(toAccount.getBalance().add(request.amount()));

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        String transferGroupId = UUID.randomUUID().toString();
        String description = (request.note() != null && !request.note().isBlank())
                ? request.note().trim()
                : "Transfer between accounts";

        // Source transaction: EXPENSE
        Transaction debitTx = new Transaction();
        debitTx.setAccount(fromAccount);
        debitTx.setCategory("Transfer");
        debitTx.setAmount(request.amount());
        debitTx.setTransactionType("EXPENSE");
        debitTx.setMerchant("Transfer to " + toAccount.getAccountName());
        debitTx.setDescription(description);
        debitTx.setTransactionDate(request.date());
        debitTx.setIsTransfer(true);
        debitTx.setTransferGroupId(transferGroupId);

        // Destination transaction: INCOME
        Transaction creditTx = new Transaction();
        creditTx.setAccount(toAccount);
        creditTx.setCategory("Transfer");
        creditTx.setAmount(request.amount());
        creditTx.setTransactionType("INCOME");
        creditTx.setMerchant("Transfer from " + fromAccount.getAccountName());
        creditTx.setDescription(description);
        creditTx.setTransactionDate(request.date());
        creditTx.setIsTransfer(true);
        creditTx.setTransferGroupId(transferGroupId);

        transactionRepository.save(debitTx);
        transactionRepository.save(creditTx);

        return new TransferResponse(
                transferGroupId,
                fromAccount.getId(),
                toAccount.getId(),
                request.amount(),
                request.date(),
                "COMPLETED",
                "Successfully transferred " + request.amount() + " from " + fromAccount.getAccountName() + " to " + toAccount.getAccountName()
        );
    }

    private boolean isOverdraftProtected(String accountType) {
        if (accountType == null) return true;
        String norm = accountType.trim().toUpperCase();
        return "CHECKING".equals(norm) || "SAVINGS".equals(norm) || "CASH".equals(norm);
    }
}
