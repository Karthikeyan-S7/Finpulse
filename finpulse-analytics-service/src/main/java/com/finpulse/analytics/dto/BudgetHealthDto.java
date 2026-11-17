package com.finpulse.analytics.dto;

import java.math.BigDecimal;

public class BudgetHealthDto {
    private String category;
    private BigDecimal monthlyLimit;
    private BigDecimal totalSpent;
    private BigDecimal remaining;
    private Double utilizationPercent;
    private String status; // NORMAL, WARNING (>80%), EXCEEDED (>100%), UNSPENT

    public BudgetHealthDto() {}

    public BudgetHealthDto(String category, BigDecimal monthlyLimit, BigDecimal totalSpent, BigDecimal remaining, Double utilizationPercent, String status) {
        this.category = category;
        this.monthlyLimit = monthlyLimit;
        this.totalSpent = totalSpent;
        this.remaining = remaining;
        this.utilizationPercent = utilizationPercent;
        this.status = status;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getMonthlyLimit() { return monthlyLimit; }
    public void setMonthlyLimit(BigDecimal monthlyLimit) { this.monthlyLimit = monthlyLimit; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public BigDecimal getRemaining() { return remaining; }
    public void setRemaining(BigDecimal remaining) { this.remaining = remaining; }

    public Double getUtilizationPercent() { return utilizationPercent; }
    public void setUtilizationPercent(Double utilizationPercent) { this.utilizationPercent = utilizationPercent; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
