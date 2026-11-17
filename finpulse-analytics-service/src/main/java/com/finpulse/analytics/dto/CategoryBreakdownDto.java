package com.finpulse.analytics.dto;

import java.math.BigDecimal;

public record CategoryBreakdownDto(
        String category,
        BigDecimal amount,
        Double sharePercent
) {
    // Overloaded constructor for legacy test compatibility
    public CategoryBreakdownDto(String category, BigDecimal amount, Long transactionCount, Double sharePercent) {
        this(category, amount, sharePercent);
    }

    // Backward-compatibility accessors
    public String getCategory() {
        return category;
    }

    public BigDecimal getTotalAmount() {
        return amount;
    }

    public Double getSharePercent() {
        return sharePercent;
    }

    public Double getPercentageOfTotal() {
        return sharePercent;
    }

    public Long getTransactionCount() {
        return 0L;
    }
}
