package com.finpulse.analytics.controller;

import com.finpulse.analytics.dto.*;
import com.finpulse.analytics.service.AnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Analytics REST Controller (Unit 4 & 5).
 * Exposes pure JDBC analytical queries and CSV streaming with strict input validation.
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AnalyticsController {

    private static final Pattern MONTH_PATTERN = Pattern.compile("^\\d{4}-(0[1-9]|1[0-2])$");

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Fixed, non-parameterized connectivity check via plain java.sql.Statement.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        boolean dbOk = analyticsService.checkHealth();
        return ResponseEntity.ok(Map.of(
                "status", dbOk ? "UP" : "DOWN",
                "database", dbOk ? "CONNECTED" : "DISCONNECTED",
                "service", "finpulse-analytics-service"
        ));
    }

    /**
     * GET /api/analytics/cashflow?months=6&userId=1
     */
    @GetMapping("/cashflow")
    public ResponseEntity<List<CashflowDto>> getCashflow(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user,
            @RequestParam(defaultValue = "6") int months) {
        Long resolvedUser = resolveUserId(userId, user);
        if (months < 1 || months > 120) {
            throw new IllegalArgumentException("Parameter 'months' must be between 1 and 120");
        }
        return ResponseEntity.ok(analyticsService.getCashflow(resolvedUser, months));
    }

    /**
     * GET /api/analytics/category-breakdown?month=YYYY-MM&userId=1
     */
    @GetMapping("/category-breakdown")
    public ResponseEntity<List<CategoryBreakdownDto>> getCategoryBreakdown(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user,
            @RequestParam(required = false) String month) {
        Long resolvedUser = resolveUserId(userId, user);
        String resolvedMonth = validateAndResolveMonth(month);
        return ResponseEntity.ok(analyticsService.getCategoryBreakdown(resolvedUser, resolvedMonth));
    }

    /**
     * GET /api/analytics/spending-spikes?month=YYYY-MM&userId=1
     */
    @GetMapping("/spending-spikes")
    public ResponseEntity<List<SpendingSpikeDto>> getSpendingSpikes(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user,
            @RequestParam(required = false) String month) {
        Long resolvedUser = resolveUserId(userId, user);
        String resolvedMonth = validateAndResolveMonth(month);
        return ResponseEntity.ok(analyticsService.getSpendingSpikes(resolvedUser, resolvedMonth));
    }

    /**
     * GET /api/analytics/timeline?days=30&userId=1
     */
    @GetMapping("/timeline")
    public ResponseEntity<List<TimelineDto>> getTimeline(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user,
            @RequestParam(defaultValue = "30") int days) {
        Long resolvedUser = resolveUserId(userId, user);
        if (days < 1 || days > 365) {
            throw new IllegalArgumentException("Parameter 'days' must be between 1 and 365");
        }
        return ResponseEntity.ok(analyticsService.getTimeline(resolvedUser, days));
    }

    /**
     * GET /api/analytics/recurring-merchants?month=YYYY-MM&userId=1
     */
    @GetMapping("/recurring-merchants")
    public ResponseEntity<List<RecurringMerchantDto>> getRecurringMerchants(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user,
            @RequestParam(required = false) String month) {
        Long resolvedUser = resolveUserId(userId, user);
        String resolvedMonth = validateAndResolveMonth(month);
        return ResponseEntity.ok(analyticsService.getRecurringMerchants(resolvedUser, resolvedMonth));
    }

    /**
     * GET /api/analytics/unused-budgets?month=YYYY-MM&userId=1
     */
    @GetMapping("/unused-budgets")
    public ResponseEntity<List<UnusedBudgetDto>> getUnusedBudgets(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user,
            @RequestParam(required = false) String month) {
        Long resolvedUser = resolveUserId(userId, user);
        String resolvedMonth = validateAndResolveMonth(month);
        return ResponseEntity.ok(analyticsService.getUnusedBudgets(resolvedUser, resolvedMonth));
    }

    /**
     * GET /api/analytics/account-balances?userId=1
     */
    @GetMapping("/account-balances")
    public ResponseEntity<List<AccountBalanceDto>> getAccountBalances(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user) {
        Long resolvedUser = resolveUserId(userId, user);
        return ResponseEntity.ok(analyticsService.getAccountBalances(resolvedUser));
    }

    /**
     * GET /api/analytics/overview?month=YYYY-MM&userId=1
     */
    @GetMapping("/overview")
    public ResponseEntity<OverviewDto> getOverview(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user,
            @RequestParam(required = false) String month) {
        Long resolvedUser = resolveUserId(userId, user);
        String resolvedMonth = validateAndResolveMonth(month);
        return ResponseEntity.ok(analyticsService.getOverview(resolvedUser, resolvedMonth));
    }

    /**
     * GET /api/analytics/export/transactions.csv?from=YYYY-MM-DD&to=YYYY-MM-DD&userId=1
     */
    @GetMapping(value = "/export/transactions.csv", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<StreamingResponseBody> exportTransactionsCsv(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        Long resolvedUser = resolveUserId(userId, user);
        LocalDate toDate = parseDateOrFallback(to, LocalDate.now());
        LocalDate fromDate = parseDateOrFallback(from, toDate.minusMonths(6));

        if (fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException(
                    String.format("Start date '%s' cannot be after end date '%s'", fromDate, toDate));
        }

        StreamingResponseBody responseBody = outputStream -> {
            try (OutputStreamWriter osw = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
                 BufferedWriter writer = new BufferedWriter(osw)) {
                // Write UTF-8 BOM so Excel opens with correct encoding
                writer.write('\uFEFF');
                analyticsService.streamTransactionsCsv(resolvedUser, fromDate, toDate, writer);
            } catch (Exception e) {
                throw new RuntimeException("Error during CSV streaming: " + e.getMessage(), e);
            }
        };

        String filename = String.format("finpulse-transactions-%s_%s.csv", fromDate, toDate);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(responseBody);
    }

    // --- Legacy / Backward-Compatible Endpoints ---

    @GetMapping("/user/{userId}/category-breakdown")
    public ResponseEntity<List<CategoryBreakdownDto>> getCategoryBreakdownLegacy(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getCategoryBreakdown(userId));
    }

    @GetMapping("/user/{userId}/budget-health")
    public ResponseEntity<List<BudgetHealthDto>> getBudgetHealthLegacy(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "2026-11") String monthYear) {
        return ResponseEntity.ok(analyticsService.getBudgetHealth(userId, monthYear));
    }

    @GetMapping("/set-operations")
    public ResponseEntity<Map<String, SetOperationResultDto>> getAllSetOperationsLegacy(
            @RequestParam(defaultValue = "2026-11") String monthYear) {
        return ResponseEntity.ok(analyticsService.getAllSetOperations(monthYear));
    }

    @GetMapping("/set-operations/union")
    public ResponseEntity<SetOperationResultDto> getUnionQueryLegacy() {
        return ResponseEntity.ok(analyticsService.getUnion());
    }

    @GetMapping("/set-operations/intersect")
    public ResponseEntity<SetOperationResultDto> getIntersectQueryLegacy() {
        return ResponseEntity.ok(analyticsService.getIntersect());
    }

    @GetMapping("/set-operations/except")
    public ResponseEntity<SetOperationResultDto> getExceptQueryLegacy(
            @RequestParam(defaultValue = "2026-11") String monthYear) {
        return ResponseEntity.ok(analyticsService.getExcept(monthYear));
    }

    @GetMapping("/user/{userId}/export/csv")
    public ResponseEntity<String> exportCsvAuditReportLegacy(@PathVariable Long userId) {
        String csvData = analyticsService.exportAuditCsv(userId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"finpulse_audit_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/user/{userId}/executive-dashboard")
    public ResponseEntity<Map<String, Object>> getMicroserviceExecutiveDashboardLegacy(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "2026-11") String monthYear) {
        return ResponseEntity.ok(analyticsService.getMicroserviceExecutiveDashboard(userId, monthYear));
    }

    // --- Helper Validation Methods ---

    private Long resolveUserId(Long userId, Long user) {
        if (userId != null) return userId;
        if (user != null) return user;
        return 1L;
    }

    private String validateAndResolveMonth(String month) {
        if (month == null || month.trim().isEmpty()) {
            return YearMonth.now().toString();
        }
        String clean = month.trim();
        if (!MONTH_PATTERN.matcher(clean).matches()) {
            throw new IllegalArgumentException(
                    "Invalid month format: '" + month + "'. Expected 'YYYY-MM' (e.g. 2026-11)");
        }
        return clean;
    }

    private LocalDate parseDateOrFallback(String dateStr, LocalDate fallback) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return fallback;
        }
        try {
            return LocalDate.parse(dateStr.trim());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "Invalid date format: '" + dateStr + "'. Expected 'YYYY-MM-DD'");
        }
    }
}
