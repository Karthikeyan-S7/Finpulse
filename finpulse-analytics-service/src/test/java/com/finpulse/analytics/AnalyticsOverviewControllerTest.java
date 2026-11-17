package com.finpulse.analytics;

import com.finpulse.analytics.client.CoreServiceClient;
import com.finpulse.analytics.controller.AnalyticsController;
import com.finpulse.analytics.dto.*;
import com.finpulse.analytics.exception.CoreServiceUnavailableException;
import com.finpulse.analytics.exception.GlobalExceptionHandler;
import com.finpulse.analytics.jdbc.JdbcReportRepository;
import com.finpulse.analytics.service.AnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnalyticsController.class)
@Import({AnalyticsService.class, GlobalExceptionHandler.class})
public class AnalyticsOverviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JdbcReportRepository jdbcRepository;

    @MockBean
    private CoreServiceClient coreServiceClient;

    @Test
    @DisplayName("Controller Test: Overview succeeds when Core service is available")
    void testOverviewSuccessWhenCoreIsUp() throws Exception {
        Map<String, Object> summary = Map.of(
                "netWorth", new BigDecimal("481501.00"),
                "assetsTotal", new BigDecimal("496001.00"),
                "liabilitiesTotal", new BigDecimal("14500.00"),
                "income", new BigDecimal("75000.00"),
                "expenses", new BigDecimal("62886.00"),
                "savingsRate", 16.2,
                "previousIncome", new BigDecimal("75000.00"),
                "previousExpenses", new BigDecimal("58200.00"),
                "accounts", List.of()
        );

        when(coreServiceClient.getSummary(eq(1L), any())).thenReturn(summary);
        when(jdbcRepository.getSpendingSpikes(eq(1L), any())).thenReturn(List.of(
                new SpendingSpikeDto("Shopping", new BigDecimal("30300.00"), new BigDecimal("6333.33"), 378.4)
        ));
        when(jdbcRepository.getUnusedBudgets(eq(1L), any())).thenReturn(List.of(
                new UnusedBudgetDto("Healthcare", new BigDecimal("3000.00"))
        ));
        when(jdbcRepository.getRecurringMerchants(eq(1L), any())).thenReturn(List.of(
                new RecurringMerchantDto("Netflix India", new BigDecimal("649.00"), new BigDecimal("649.00"))
        ));

        mockMvc.perform(get("/api/analytics/overview")
                        .param("userId", "1")
                        .param("month", "2026-11"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.netWorth").value(481501.0))
                .andExpect(jsonPath("$.topSpikes[0].category").value("Shopping"))
                .andExpect(jsonPath("$.spikesCount").value(1))
                .andExpect(jsonPath("$.unusedBudgetsCount").value(1))
                .andExpect(jsonPath("$.recurringMerchantsCount").value(1));
    }

    @Test
    @DisplayName("Resilience Test: Core service down maps to HTTP 503 with standardized error shape")
    void testOverviewMapsTo503WhenCoreServiceDown() throws Exception {
        when(coreServiceClient.getSummary(eq(1L), any()))
                .thenThrow(new CoreServiceUnavailableException(
                        "Core service unavailable at http://localhost:8081: Connection refused"));

        mockMvc.perform(get("/api/analytics/overview")
                        .param("userId", "1")
                        .param("month", "2026-11"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.error").value("Service Unavailable"))
                .andExpect(jsonPath("$.message").value("Core service unavailable at http://localhost:8081: Connection refused"))
                .andExpect(jsonPath("$.path").value("/api/analytics/overview"));
    }

    @Test
    @DisplayName("Validation Test: Invalid month parameter format returns HTTP 400 Bad Request")
    void testInvalidMonthParameterReturns400() throws Exception {
        mockMvc.perform(get("/api/analytics/spending-spikes")
                        .param("userId", "1")
                        .param("month", "2026-13")) // Invalid month 13
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Invalid month format: '2026-13'. Expected 'YYYY-MM' (e.g. 2026-11)"))
                .andExpect(jsonPath("$.path").value("/api/analytics/spending-spikes"));
    }

    @Test
    @DisplayName("Controller Test: Plain statement health check returns UP")
    void testHealthCheckEndpoint() throws Exception {
        when(jdbcRepository.checkDatabaseConnectivity()).thenReturn(true);

        mockMvc.perform(get("/api/analytics/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("CONNECTED"))
                .andExpect(jsonPath("$.service").value("finpulse-analytics-service"));
    }
}
