package com.finpulse.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public class BudgetRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Monthly limit is required")
    @DecimalMin(value = "1.00", message = "Monthly limit must be at least 1.00")
    private BigDecimal monthlyLimit;

    @NotBlank(message = "Month-year is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Month-year must match format YYYY-MM")
    private String monthYear;

    public BudgetRequest() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getMonthlyLimit() { return monthlyLimit; }
    public void setMonthlyLimit(BigDecimal monthlyLimit) { this.monthlyLimit = monthlyLimit; }

    public String getMonthYear() { return monthYear; }
    public void setMonthYear(String monthYear) { this.monthYear = monthYear; }
}
