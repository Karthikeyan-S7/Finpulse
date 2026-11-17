package com.finpulse.core.dto;

import com.finpulse.core.model.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TransactionDto(
        Long id,
        Long accountId,
        String accountName,
        String category,
        BigDecimal amount,
        String transactionType,
        String merchant,
        String description,
        LocalDate transactionDate,
        Boolean isTransfer,
        String transferGroupId,
        LocalDateTime createdAt
) {
    public static TransactionDto fromEntity(Transaction tx) {
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
