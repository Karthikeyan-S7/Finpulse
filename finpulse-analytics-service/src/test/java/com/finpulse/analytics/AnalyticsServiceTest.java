package com.finpulse.analytics;

import com.finpulse.analytics.client.CoreServiceClient;
import com.finpulse.analytics.dto.CategoryBreakdownDto;
import com.finpulse.analytics.dto.SetOperationResultDto;
import com.finpulse.analytics.jdbc.JdbcReportRepository;
import com.finpulse.analytics.service.AnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AnalyticsServiceTest {

    @Mock
    private JdbcReportRepository jdbcRepository;

    @Mock
    private CoreServiceClient coreServiceClient;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    @DisplayName("Unit Test: Fetching category breakdown via JDBC analytics service")
    void testGetCategoryBreakdown() {
        CategoryBreakdownDto dto = new CategoryBreakdownDto("Housing", new BigDecimal("1750.00"), 1L, 65.5);
        when(jdbcRepository.getCategoryBreakdown(1L)).thenReturn(List.of(dto));

        List<CategoryBreakdownDto> result = analyticsService.getCategoryBreakdown(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Housing", result.get(0).getCategory());
        assertEquals(new BigDecimal("1750.00"), result.get(0).getTotalAmount());
        verify(jdbcRepository, times(1)).getCategoryBreakdown(1L);
    }

    @Test
    @DisplayName("Unit Test: Fetching all SQL set operations (UNION, INTERSECT, EXCEPT)")
    void testGetAllSetOperations() {
        SetOperationResultDto unionDto = new SetOperationResultDto("UNION", "Test union", "SELECT 1 UNION SELECT 2", List.of());
        SetOperationResultDto intersectDto = new SetOperationResultDto("INTERSECT", "Test intersect", "SELECT 1 INTERSECT SELECT 1", List.of());
        SetOperationResultDto exceptDto = new SetOperationResultDto("EXCEPT", "Test except", "SELECT 1 EXCEPT SELECT 2", List.of());

        when(jdbcRepository.executeUnionQuery()).thenReturn(unionDto);
        when(jdbcRepository.executeIntersectQuery()).thenReturn(intersectDto);
        when(jdbcRepository.executeExceptQuery("2026-11")).thenReturn(exceptDto);

        Map<String, SetOperationResultDto> results = analyticsService.getAllSetOperations("2026-11");

        assertNotNull(results);
        assertTrue(results.containsKey("union"));
        assertTrue(results.containsKey("intersect"));
        assertTrue(results.containsKey("except"));
        assertEquals("UNION", results.get("union").getOperation());
    }

    @Test
    @DisplayName("Unit Test: CSV report generation via pure JDBC repository")
    void testExportAuditCsv() {
        String mockCsv = "Transaction ID,Date,Account,Category,Type,Merchant,Amount,Description\n1,2026-11-01,Checking,Groceries,EXPENSE,Whole Foods,50.00,Food";
        when(jdbcRepository.streamCsvAuditReport(1L)).thenReturn(mockCsv);

        String result = analyticsService.exportAuditCsv(1L);

        assertNotNull(result);
        assertTrue(result.contains("Whole Foods"));
        verify(jdbcRepository, times(1)).streamCsvAuditReport(1L);
    }
}
