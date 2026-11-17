package com.finpulse.core.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType; // INCOME, EXPENSE

    @Column(length = 100)
    private String merchant;

    @Column(length = 255)
    private String description;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "is_transfer", nullable = false)
    private Boolean isTransfer = false;

    @Column(name = "transfer_group_id", length = 36)
    private String transferGroupId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Transaction() {}

    public Transaction(Long id, Account account, String category, BigDecimal amount, String transactionType, String merchant, String description, LocalDate transactionDate) {
        this.id = id;
        this.account = account;
        this.category = category;
        this.amount = amount;
        this.transactionType = transactionType;
        this.merchant = merchant;
        this.description = description;
        this.transactionDate = transactionDate;
        this.isTransfer = false;
    }

    public Transaction(Long id, Account account, String category, BigDecimal amount, String transactionType, String merchant, String description, LocalDate transactionDate, Boolean isTransfer, String transferGroupId) {
        this.id = id;
        this.account = account;
        this.category = category;
        this.amount = amount;
        this.transactionType = transactionType;
        this.merchant = merchant;
        this.description = description;
        this.transactionDate = transactionDate;
        this.isTransfer = isTransfer != null ? isTransfer : false;
        this.transferGroupId = transferGroupId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }

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

    public Boolean getIsTransfer() { return isTransfer; }
    public void setIsTransfer(Boolean isTransfer) { this.isTransfer = isTransfer; }

    public String getTransferGroupId() { return transferGroupId; }
    public void setTransferGroupId(String transferGroupId) { this.transferGroupId = transferGroupId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
