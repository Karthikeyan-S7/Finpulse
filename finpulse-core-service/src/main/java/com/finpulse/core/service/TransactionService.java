package com.finpulse.core.service;

import com.finpulse.core.constant.CategoryRegistry;
import com.finpulse.core.dto.TransactionDto;
import com.finpulse.core.dto.TransactionRequest;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public TransactionService(TransactionRepository transactionRepository, AccountRepository accountRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional(readOnly = true)
    public List<TransactionDto> getTransactions(Long userId, LocalDate from, LocalDate to, Long accountId, String type, String category) {
        Long resolvedUserId = userId != null ? userId : 1L;
        String resolvedType = (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type.trim())) 
                ? type.trim().toUpperCase() 
                : null;
        String resolvedCategory = (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category.trim())) 
                ? category.trim() 
                : null;

        if (resolvedCategory != null) {
            Optional<com.finpulse.core.dto.CategoryDto> cat = CategoryRegistry.findByName(resolvedCategory);
            if (cat.isPresent()) {
                resolvedCategory = cat.get().name();
            }
        }

        List<Transaction> list = transactionRepository.filterTransactions(
                resolvedUserId,
                accountId,
                from,
                to,
                resolvedType,
                resolvedCategory
        );

        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByUserId(Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionEntityById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public TransactionDto getTransactionById(Long id) {
        return toDto(getTransactionEntityById(id));
    }

    public Transaction recordTransaction(TransactionRequest request) {
        return recordTransactionInternal(request, false, null);
    }

    public Transaction recordTransactionInternal(TransactionRequest request, boolean isTransfer, String transferGroupId) {
        validateTransactionRequest(request, isTransfer);

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        BigDecimal amount = request.getAmount();
        String type = request.getTransactionType().trim().toUpperCase();

        // Overdraft Guard
        applyBalanceEffectWithOverdraftGuard(account, type, amount);
        accountRepository.save(account);

        String resolvedCategory = request.getCategory().trim();
        if (!isTransfer) {
            Optional<com.finpulse.core.dto.CategoryDto> canonical = CategoryRegistry.findByName(resolvedCategory);
            if (canonical.isPresent()) {
                resolvedCategory = canonical.get().name();
            }
        }

        Transaction transaction = new Transaction();
        transaction.setAccount(account);
        transaction.setCategory(resolvedCategory);
        transaction.setAmount(amount);
        transaction.setTransactionType(type);
        transaction.setMerchant(request.getMerchant() != null ? request.getMerchant().trim() : null);
        transaction.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setIsTransfer(isTransfer);
        transaction.setTransferGroupId(transferGroupId);

        return transactionRepository.save(transaction);
    }

    public TransactionDto createTransaction(TransactionRequest request) {
        Transaction tx = recordTransaction(request);
        return toDto(tx);
    }

    public TransactionDto updateTransaction(Long id, TransactionRequest request) {
        Transaction tx = getTransactionEntityById(id);
        Account oldAccount = tx.getAccount();
        BigDecimal oldAmount = tx.getAmount();
        String oldType = tx.getTransactionType();
        boolean isTransfer = Boolean.TRUE.equals(tx.getIsTransfer());

        validateTransactionRequest(request, isTransfer);

        if (isTransfer) {
            if (!oldType.equalsIgnoreCase(request.getTransactionType())) {
                throw new IllegalArgumentException("Cannot change transaction type of an automated transfer leg");
            }
            if (oldAccount != null && !request.getAccountId().equals(oldAccount.getId())) {
                throw new IllegalArgumentException("Cannot reassign account on a transfer leg. Please create a new transfer instead.");
            }
        }

        // Reverse old effect
        if (oldAccount != null) {
            reverseBalanceEffect(oldAccount, oldType, oldAmount);
        }

        // Target account may be the same or a new one
        Account targetAccount = (oldAccount != null && request.getAccountId().equals(oldAccount.getId()))
                ? oldAccount
                : accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        BigDecimal newAmount = request.getAmount();
        String newType = request.getTransactionType().trim().toUpperCase();

        // Apply new effect with overdraft check
        applyBalanceEffectWithOverdraftGuard(targetAccount, newType, newAmount);

        if (oldAccount != null) {
            accountRepository.save(oldAccount);
        }
        if (oldAccount == null || !targetAccount.getId().equals(oldAccount.getId())) {
            accountRepository.save(targetAccount);
        }

        String resolvedCategory = request.getCategory().trim();
        if (!isTransfer) {
            Optional<com.finpulse.core.dto.CategoryDto> canonical = CategoryRegistry.findByName(resolvedCategory);
            if (canonical.isPresent()) {
                resolvedCategory = canonical.get().name();
            }
        }

        tx.setAccount(targetAccount);
        tx.setCategory(resolvedCategory);
        tx.setAmount(newAmount);
        tx.setTransactionType(newType);
        tx.setMerchant(request.getMerchant() != null ? request.getMerchant().trim() : null);
        tx.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        tx.setTransactionDate(request.getTransactionDate());

        Transaction saved = transactionRepository.save(tx);

        // If part of transfer group, update paired transaction amount/date/description
        if (isTransfer && tx.getTransferGroupId() != null) {
            List<Transaction> pair = transactionRepository.findByTransferGroupId(tx.getTransferGroupId());
            for (Transaction partner : pair) {
                if (!partner.getId().equals(tx.getId())) {
                    Account partnerAcc = partner.getAccount();
                    if (partnerAcc != null) {
                        reverseBalanceEffect(partnerAcc, partner.getTransactionType(), partner.getAmount());
                        applyBalanceEffectWithOverdraftGuard(partnerAcc, partner.getTransactionType(), newAmount);
                        accountRepository.save(partnerAcc);
                    }
                    partner.setAmount(newAmount);
                    partner.setTransactionDate(request.getTransactionDate());
                    partner.setDescription(request.getDescription());
                    transactionRepository.save(partner);
                }
            }
        }

        return toDto(saved);
    }

    public void deleteTransaction(Long id) {
        Transaction tx = getTransactionEntityById(id);
        Account account = tx.getAccount();

        // Reversal of balance on delete
        if (account != null) {
            reverseBalanceEffect(account, tx.getTransactionType(), tx.getAmount());
            accountRepository.save(account);
        }

        // If part of a transfer pair, reverse and delete both paired rows
        if (Boolean.TRUE.equals(tx.getIsTransfer()) && tx.getTransferGroupId() != null) {
            List<Transaction> pair = transactionRepository.findByTransferGroupId(tx.getTransferGroupId());
            for (Transaction partner : pair) {
                if (!partner.getId().equals(tx.getId())) {
                    Account partnerAcc = partner.getAccount();
                    if (partnerAcc != null) {
                        reverseBalanceEffect(partnerAcc, partner.getTransactionType(), partner.getAmount());
                        accountRepository.save(partnerAcc);
                    }
                    transactionRepository.delete(partner);
                }
            }
        }

        transactionRepository.delete(tx);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFinancialOverview(Long userId) {
        Long resolvedUserId = userId != null ? userId : 1L;
        BigDecimal totalIncome = transactionRepository.getTotalAmountByType(resolvedUserId, "INCOME");
        BigDecimal totalExpense = transactionRepository.getTotalAmountByType(resolvedUserId, "EXPENSE");
        BigDecimal totalNetWorth = accountRepository.getTotalNetWorthByUserId(resolvedUserId);

        BigDecimal safeIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;
        BigDecimal safeExpense = totalExpense != null ? totalExpense : BigDecimal.ZERO;
        BigDecimal safeNetWorth = totalNetWorth != null ? totalNetWorth : BigDecimal.ZERO;

        List<Object[]> rawCategoryTotals = transactionRepository.getCategoryExpenseTotals(resolvedUserId);
        Map<String, BigDecimal> categoryExpenses = new HashMap<>();
        if (rawCategoryTotals != null) {
            for (Object[] row : rawCategoryTotals) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    categoryExpenses.put((String) row[0], (BigDecimal) row[1]);
                }
            }
        }

        Map<String, Object> overview = new HashMap<>();
        overview.put("netWorth", safeNetWorth);
        overview.put("totalIncome", safeIncome);
        overview.put("totalExpense", safeExpense);
        overview.put("netSavings", safeIncome.subtract(safeExpense));
        overview.put("categoryExpenses", categoryExpenses);

        return overview;
    }

    private void validateTransactionRequest(TransactionRequest request, boolean isTransfer) {
        if (request == null) {
            throw new IllegalArgumentException("Transaction request cannot be null");
        }

        if (request.getAccountId() == null) {
            throw new IllegalArgumentException("Account ID is required");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transaction amount must be strictly positive");
        }

        if (request.getTransactionDate() == null) {
            throw new IllegalArgumentException("Transaction date is required");
        }

        if (request.getTransactionDate().isAfter(LocalDate.now().plusYears(1))) {
            throw new IllegalArgumentException("Transaction date cannot be more than 1 year in the future: " + request.getTransactionDate());
        }

        String type = request.getTransactionType() != null ? request.getTransactionType().trim().toUpperCase() : "";
        if (!"INCOME".equals(type) && !"EXPENSE".equals(type)) {
            throw new IllegalArgumentException("Invalid transaction type: " + request.getTransactionType() + ". Must be INCOME or EXPENSE.");
        }

        String category = request.getCategory() != null ? request.getCategory().trim() : "";
        if (!CategoryRegistry.isValidCategory(category, type, isTransfer)) {
            throw new IllegalArgumentException("Category '" + category + "' is not valid for transaction type '" + type + "'");
        }
    }

    private void applyBalanceEffectWithOverdraftGuard(Account account, String type, BigDecimal amount) {
        BigDecimal currentBalance = account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;
        if ("EXPENSE".equals(type)) {
            if (isOverdraftProtectedAccount(account.getAccountType())) {
                BigDecimal resulting = currentBalance.subtract(amount);
                if (resulting.compareTo(BigDecimal.ZERO) < 0) {
                    throw new InsufficientFundsException(
                            "Insufficient funds: transaction would cause overdraft on " + account.getAccountType() +
                            " account '" + account.getAccountName() + "'. Current balance: " + currentBalance +
                            ", transaction amount: " + amount
                    );
                }
            }
            account.setBalance(currentBalance.subtract(amount));
        } else if ("INCOME".equals(type)) {
            account.setBalance(currentBalance.add(amount));
        }
    }

    private void reverseBalanceEffect(Account account, String type, BigDecimal amount) {
        BigDecimal currentBalance = account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;
        if ("EXPENSE".equalsIgnoreCase(type)) {
            account.setBalance(currentBalance.add(amount));
        } else if ("INCOME".equalsIgnoreCase(type)) {
            account.setBalance(currentBalance.subtract(amount));
        }
    }

    private boolean isOverdraftProtectedAccount(String accountType) {
        if (accountType == null) return true;
        String norm = accountType.trim().toUpperCase();
        return "CHECKING".equals(norm) || "SAVINGS".equals(norm) || "CASH".equals(norm);
    }

    public TransactionDto toDto(Transaction tx) {
        if (tx == null) return null;
        String accountName = (tx.getAccount() != null) ? tx.getAccount().getAccountName() : null;
        Long accountId = (tx.getAccount() != null) ? tx.getAccount().getId() : null;
        return new TransactionDto(
                tx.getId(),
                accountId,
                accountName,
                tx.getCategory(),
                tx.getAmount(),
                tx.getTransactionType(),
                tx.getMerchant(),
                tx.getDescription(),
                tx.getTransactionDate(),
                tx.getIsTransfer(),
                tx.getTransferGroupId(),
                tx.getCreatedAt()
        );
    }
}
