package com.finpulse.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionRequest {

    @NotNull(message = "Account ID is required")
    private Long accountId;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Transaction type is required (INCOME or EXPENSE)")
    private String transactionType;

    private String merchant;

    private String description;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    public TransactionRequest() {}

    public TransactionRequest(Long accountId, String category, BigDecimal amount, String transactionType, String merchant, String description, LocalDate transactionDate) {
        this.accountId = accountId;
        this.category = category;
        this.amount = amount;
        this.transactionType = transactionType;
        this.merchant = merchant;
        this.description = description;
        this.transactionDate = transactionDate;
    }

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDate transactionDate) { this.transactionDate = transactionDate; }
}
