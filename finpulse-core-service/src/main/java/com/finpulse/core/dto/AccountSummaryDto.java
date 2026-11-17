package com.finpulse.core.dto;

import java.math.BigDecimal;

public class AccountSummaryDto {
    private Long id;
    private String accountName;
    private String accountNumber;
    private String accountType;
    private BigDecimal balance;
    private String currency;
    private Long transactionCount;

    public AccountSummaryDto() {}

    public AccountSummaryDto(Long id, String accountName, String accountNumber, String accountType, BigDecimal balance, String currency, Long transactionCount) {
        this.id = id;
        this.accountName = accountName;
        this.accountNumber = accountNumber;
        this.accountType = accountType;
        this.balance = balance;
        this.currency = currency;
        this.transactionCount = transactionCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Long getTransactionCount() { return transactionCount; }
    public void setTransactionCount(Long transactionCount) { this.transactionCount = transactionCount; }
}
