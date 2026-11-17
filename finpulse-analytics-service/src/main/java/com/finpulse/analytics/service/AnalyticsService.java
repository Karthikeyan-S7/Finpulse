package com.finpulse.analytics.service;

import com.finpulse.analytics.client.CoreServiceClient;
import com.finpulse.analytics.dto.*;
import com.finpulse.analytics.jdbc.JdbcReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.Writer;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
public class AnalyticsService {

    private final JdbcReportRepository jdbcRepository;
    private final CoreServiceClient coreServiceClient;

    @Autowired
    public AnalyticsService(JdbcReportRepository jdbcRepository, CoreServiceClient coreServiceClient) {
        this.jdbcRepository = jdbcRepository;
        this.coreServiceClient = coreServiceClient;
    }

    public boolean checkHealth() {
        return jdbcRepository.checkDatabaseConnectivity();
    }

    public List<CashflowDto> getCashflow(Long userId, int months) {
        return jdbcRepository.getCashflow(userId, months);
    }

    public List<CategoryBreakdownDto> getCategoryBreakdown(Long userId, String monthYear) {
        return jdbcRepository.getCategoryBreakdown(userId, monthYear);
    }

    public List<CategoryBreakdownDto> getCategoryBreakdown(Long userId) {
        return jdbcRepository.getCategoryBreakdown(userId);
    }

    public List<SpendingSpikeDto> getSpendingSpikes(Long userId, String monthYear) {
        return jdbcRepository.getSpendingSpikes(userId, monthYear);
    }

    public List<TimelineDto> getTimeline(Long userId, int days) {
        return jdbcRepository.getTimeline(userId, days);
    }

    public List<RecurringMerchantDto> getRecurringMerchants(Long userId, String monthYear) {
        return jdbcRepository.getRecurringMerchants(userId, monthYear);
    }

    public List<UnusedBudgetDto> getUnusedBudgets(Long userId, String monthYear) {
        return jdbcRepository.getUnusedBudgets(userId, monthYear);
    }

    public List<AccountBalanceDto> getAccountBalances(Long userId) {
        return jdbcRepository.getAccountBalances(userId);
    }

    @SuppressWarnings("unchecked")
    public OverviewDto getOverview(Long userId, String monthYear) {
        // Fetch core summary over HTTP (will throw CoreServiceUnavailableException if down)
        Map<String, Object> summary = coreServiceClient.getSummary(userId, monthYear);

        BigDecimal netWorth = toBigDecimal(summary.get("netWorth"));
        BigDecimal assetsTotal = toBigDecimal(summary.get("assetsTotal"));
        BigDecimal liabilitiesTotal = toBigDecimal(summary.get("liabilitiesTotal"));
        BigDecimal income = toBigDecimal(summary.get("income"));
        BigDecimal expenses = toBigDecimal(summary.get("expenses"));
        Double savingsRate = toDouble(summary.get("savingsRate"));
        BigDecimal previousIncome = toBigDecimal(summary.get("previousIncome"));
        BigDecimal previousExpenses = toBigDecimal(summary.get("previousExpenses"));

        List<Map<String, Object>> accounts = new ArrayList<>();
        if (summary.get("accounts") instanceof List<?> list) {
            for (Object obj : list) {
                if (obj instanceof Map<?, ?> m) {
                    accounts.add((Map<String, Object>) m);
                }
            }
        }

        // Query pure JDBC analytics
        List<SpendingSpikeDto> allSpikes = jdbcRepository.getSpendingSpikes(userId, monthYear);
        List<SpendingSpikeDto> topSpikes = allSpikes.stream().limit(3).toList();
        List<UnusedBudgetDto> unused = jdbcRepository.getUnusedBudgets(userId, monthYear);
        List<RecurringMerchantDto> recurring = jdbcRepository.getRecurringMerchants(userId, monthYear);

        return new OverviewDto(
                netWorth,
                assetsTotal,
                liabilitiesTotal,
                income,
                expenses,
                savingsRate,
                previousIncome,
                previousExpenses,
                topSpikes,
                allSpikes.size(),
                unused.size(),
                recurring.size(),
                accounts
        );
    }

    public void streamTransactionsCsv(Long userId, LocalDate from, LocalDate to, Writer writer) throws Exception {
        jdbcRepository.streamTransactionsCsv(userId, from, to, writer);
    }

    // --- Legacy methods for backward-compatibility with tests & existing routes ---

    public Map<String, SetOperationResultDto> getAllSetOperations(String monthYear) {
        Map<String, SetOperationResultDto> map = new HashMap<>();
        map.put("union", jdbcRepository.executeUnionQuery());
        map.put("intersect", jdbcRepository.executeIntersectQuery());
        map.put("except", jdbcRepository.executeExceptQuery(monthYear));
        return map;
    }

    public SetOperationResultDto getUnion() {
        return jdbcRepository.executeUnionQuery();
    }

    public SetOperationResultDto getIntersect() {
        return jdbcRepository.executeIntersectQuery();
    }

    public SetOperationResultDto getExcept(String monthYear) {
        return jdbcRepository.executeExceptQuery(monthYear);
    }

    public String exportAuditCsv(Long userId) {
        return jdbcRepository.streamCsvAuditReport(userId);
    }

    public List<BudgetHealthDto> getBudgetHealth(Long userId, String monthYear) {
        return jdbcRepository.getBudgetHealth(userId, monthYear);
    }

    public Map<String, Object> getMicroserviceExecutiveDashboard(Long userId, String monthYear) {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("accountsFromCoreService", coreServiceClient.getAccountSummaries(userId));
        dashboard.put("categoryBreakdownFromJdbc", jdbcRepository.getCategoryBreakdown(userId, monthYear));
        dashboard.put("budgetHealthFromJdbc", getBudgetHealth(userId, monthYear));
        return dashboard;
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal bd) return bd;
        if (obj instanceof Number num) return BigDecimal.valueOf(num.doubleValue());
        try {
            return new BigDecimal(obj.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private Double toDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number num) return num.doubleValue();
        try {
            return Double.parseDouble(obj.toString());
        } catch (Exception e) {
            return 0.0;
        }
    }
}
