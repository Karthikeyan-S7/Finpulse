package com.finpulse.core.service;

import com.finpulse.core.dto.RecurringPaymentDto;
import com.finpulse.core.dto.RecurringPaymentRequest;
import com.finpulse.core.dto.TransactionDto;
import com.finpulse.core.dto.TransactionRequest;
import com.finpulse.core.exception.BusinessConflictException;
import com.finpulse.core.exception.ResourceNotFoundException;
import com.finpulse.core.model.Account;
import com.finpulse.core.model.RecurringPayment;
import com.finpulse.core.model.Transaction;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.AccountRepository;
import com.finpulse.core.repository.RecurringPaymentRepository;
import com.finpulse.core.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RecurringPaymentService {

    private final RecurringPaymentRepository recurringPaymentRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionService transactionService;

    public RecurringPaymentService(RecurringPaymentRepository recurringPaymentRepository,
                                   UserRepository userRepository,
                                   AccountRepository accountRepository,
                                   TransactionService transactionService) {
        this.recurringPaymentRepository = recurringPaymentRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionService = transactionService;
    }

    @Transactional(readOnly = true)
    public List<RecurringPaymentDto> getRecurringPayments(Long userId) {
        Long resolvedUserId = userId != null ? userId : 1L;
        List<RecurringPayment> list = recurringPaymentRepository.findByUserIdWithAccount(resolvedUserId);
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RecurringPaymentDto getRecurringPaymentById(Long id) {
        RecurringPayment r = recurringPaymentRepository.findByIdWithAccount(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring payment not found with id: " + id));
        return toDto(r);
    }

    public RecurringPaymentDto createRecurringPayment(RecurringPaymentRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.userId()));

        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.accountId()));

        RecurringPayment rp = new RecurringPayment(
                null,
                user,
                account,
                request.name().trim(),
                request.merchant() != null ? request.merchant().trim() : null,
                request.category().trim(),
                request.amount(),
                request.frequency().trim().toUpperCase(),
                request.nextDueDate(),
                request.isActive() != null ? request.isActive() : true
        );

        RecurringPayment saved = recurringPaymentRepository.save(rp);
        return toDto(saved);
    }

    public RecurringPaymentDto updateRecurringPayment(Long id, RecurringPaymentRequest request) {
        RecurringPayment rp = recurringPaymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring payment not found with id: " + id));

        if (!rp.getAccount().getId().equals(request.accountId())) {
            Account newAccount = accountRepository.findById(request.accountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.accountId()));
            rp.setAccount(newAccount);
        }

        rp.setName(request.name().trim());
        rp.setMerchant(request.merchant() != null ? request.merchant().trim() : null);
        rp.setCategory(request.category().trim());
        rp.setAmount(request.amount());
        rp.setFrequency(request.frequency().trim().toUpperCase());
        rp.setNextDueDate(request.nextDueDate());
        if (request.isActive() != null) {
            rp.setIsActive(request.isActive());
        }

        RecurringPayment updated = recurringPaymentRepository.save(rp);
        return toDto(updated);
    }

    public RecurringPaymentDto setActiveStatus(Long id, Boolean isActive) {
        RecurringPayment rp = recurringPaymentRepository.findByIdWithAccount(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring payment not found with id: " + id));

        rp.setIsActive(isActive != null ? isActive : !Boolean.TRUE.equals(rp.getIsActive()));
        RecurringPayment saved = recurringPaymentRepository.save(rp);
        return toDto(saved);
    }

    public void deleteRecurringPayment(Long id) {
        if (!recurringPaymentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Recurring payment not found with id: " + id);
        }
        recurringPaymentRepository.deleteById(id);
    }

    public TransactionDto payRecurring(Long id) {
        RecurringPayment rp = recurringPaymentRepository.findByIdWithAccount(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring payment not found with id: " + id));

        if (!Boolean.TRUE.equals(rp.getIsActive())) {
            throw new BusinessConflictException("Cannot process payment for inactive recurring obligation: " + rp.getName());
        }

        // 1. Create the expense transaction
        TransactionRequest txRequest = new TransactionRequest();
        txRequest.setAccountId(rp.getAccount().getId());
        txRequest.setCategory(rp.getCategory());
        txRequest.setAmount(rp.getAmount());
        txRequest.setTransactionType("EXPENSE");
        txRequest.setMerchant(rp.getMerchant() != null ? rp.getMerchant() : rp.getName());
        txRequest.setDescription("Recurring bill payment: " + rp.getName());
        txRequest.setTransactionDate(LocalDate.now());

        Transaction tx = transactionService.recordTransaction(txRequest);

        // 2. Advance nextDueDate safely by frequency
        LocalDate nextDate = advanceDueDate(rp.getNextDueDate(), rp.getFrequency());
        rp.setNextDueDate(nextDate);
        recurringPaymentRepository.save(rp);

        return transactionService.toDto(tx);
    }

    public static LocalDate advanceDueDate(LocalDate currentDate, String frequency) {
        if (currentDate == null) currentDate = LocalDate.now();
        String freq = frequency != null ? frequency.trim().toUpperCase() : "MONTHLY";

        return switch (freq) {
            case "WEEKLY" -> currentDate.plusWeeks(1);
            case "YEARLY" -> currentDate.plusYears(1);
            default -> currentDate.plusMonths(1); // MONTHLY: natively month-end safe in Java (e.g. Jan 31 -> Feb 28)
        };
    }

    public RecurringPaymentDto toDto(RecurringPayment rp) {
        Long userId = (rp.getUser() != null) ? rp.getUser().getId() : null;
        Long accountId = (rp.getAccount() != null) ? rp.getAccount().getId() : null;
        String accountName = (rp.getAccount() != null) ? rp.getAccount().getAccountName() : null;

        return new RecurringPaymentDto(
                rp.getId(),
                userId,
                accountId,
                accountName,
                rp.getName(),
                rp.getMerchant(),
                rp.getCategory(),
                rp.getAmount(),
                rp.getFrequency(),
                rp.getNextDueDate(),
                rp.getIsActive(),
                rp.getCreatedAt()
        );
    }
}
