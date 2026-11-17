package com.finpulse.core.constant;

import com.finpulse.core.dto.CategoryDto;

import java.util.*;

public final class CategoryRegistry {

    private static final List<CategoryDto> CANONICAL_CATEGORIES = List.of(
            // Income categories
            new CategoryDto("Salary", "INCOME", "emerald", false),
            new CategoryDto("Freelance & Consulting", "INCOME", "teal", false),
            new CategoryDto("Investments & Dividends", "INCOME", "indigo", false),
            new CategoryDto("Business Income", "INCOME", "cyan", false),
            new CategoryDto("Other Income", "INCOME", "sky", false),

            // Expense categories
            new CategoryDto("Housing & Rent", "EXPENSE", "rose", false),
            new CategoryDto("Groceries & Dining", "EXPENSE", "amber", false),
            new CategoryDto("Utilities & Bills", "EXPENSE", "orange", false),
            new CategoryDto("Entertainment", "EXPENSE", "purple", false),
            new CategoryDto("Transportation", "EXPENSE", "blue", false),
            new CategoryDto("Shopping", "EXPENSE", "pink", false),
            new CategoryDto("Healthcare", "EXPENSE", "red", false),
            new CategoryDto("Education", "EXPENSE", "violet", false),
            new CategoryDto("Travel & Vacation", "EXPENSE", "yellow", false),
            new CategoryDto("Personal Care", "EXPENSE", "lime", false),
            new CategoryDto("Miscellaneous", "EXPENSE", "gray", false),

            // System categories (for transfers and initial setup)
            new CategoryDto("Transfer", "TRANSFER", "zinc", true),
            new CategoryDto("Opening Balance", "TRANSFER", "slate", true)
    );

    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("groceries", "Groceries & Dining"),
            Map.entry("dining", "Groceries & Dining"),
            Map.entry("food", "Groceries & Dining"),
            Map.entry("rent", "Housing & Rent"),
            Map.entry("housing", "Housing & Rent"),
            Map.entry("utilities", "Utilities & Bills"),
            Map.entry("bills", "Utilities & Bills"),
            Map.entry("wifi", "Utilities & Bills"),
            Map.entry("gym", "Entertainment"),
            Map.entry("streaming", "Entertainment"),
            Map.entry("transport", "Transportation"),
            Map.entry("travel", "Travel & Vacation"),
            Map.entry("health", "Healthcare"),
            Map.entry("medical", "Healthcare"),
            Map.entry("pharmacy", "Healthcare"),
            Map.entry("luxury", "Shopping")
    );

    private CategoryRegistry() {}

    public static List<CategoryDto> getAllCategories() {
        return Collections.unmodifiableList(CANONICAL_CATEGORIES);
    }

    public static Optional<CategoryDto> findByName(String name) {
        if (name == null) return Optional.empty();
        String trimmed = name.trim();

        // 1. Direct match
        Optional<CategoryDto> direct = CANONICAL_CATEGORIES.stream()
                .filter(c -> c.name().equalsIgnoreCase(trimmed))
                .findFirst();
        if (direct.isPresent()) return direct;

        // 2. Alias match
        String resolved = ALIASES.get(trimmed.toLowerCase());
        if (resolved != null) {
            return CANONICAL_CATEGORIES.stream()
                    .filter(c -> c.name().equalsIgnoreCase(resolved))
                    .findFirst();
        }

        return Optional.empty();
    }

    public static boolean isValidCategory(String name, String transactionType, boolean isTransfer) {
        if (name == null || transactionType == null) return false;
        String trimmed = name.trim();

        if (isTransfer) {
            return "Transfer".equalsIgnoreCase(trimmed) || "Opening Balance".equalsIgnoreCase(trimmed);
        }

        Optional<CategoryDto> opt = findByName(trimmed);
        if (opt.isEmpty()) return false;

        CategoryDto cat = opt.get();
        if (cat.isSystem()) {
            return false; // System categories cannot be used for regular transactions
        }

        return cat.type().equalsIgnoreCase(transactionType);
    }
}
