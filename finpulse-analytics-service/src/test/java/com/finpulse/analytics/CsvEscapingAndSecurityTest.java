package com.finpulse.analytics;

import com.finpulse.analytics.jdbc.JdbcReportRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CsvEscapingAndSecurityTest {

    @Test
    @DisplayName("Unit Test: Normal strings without special characters remain unquoted")
    void testPlainStringNoEscaping() {
        assertEquals("Amazon India", JdbcReportRepository.escapeCsv("Amazon India"));
        assertEquals("Shopping", JdbcReportRepository.escapeCsv("Shopping"));
        assertEquals("", JdbcReportRepository.escapeCsv(""));
        assertEquals("", JdbcReportRepository.escapeCsv(null));
    }

    @Test
    @DisplayName("Unit Test: Strings with commas or newlines are properly wrapped in quotes")
    void testCommasAndNewlinesEscaped() {
        assertEquals("\"Fruits, Vegetables & Herbs\"", JdbcReportRepository.escapeCsv("Fruits, Vegetables & Herbs"));
        assertEquals("\"Line 1\nLine 2\"", JdbcReportRepository.escapeCsv("Line 1\nLine 2"));
    }

    @Test
    @DisplayName("Unit Test: Double quotes are doubled per RFC 4180")
    void testQuotesEscaped() {
        assertEquals("\"Item with \"\"Quotes\"\" inside\"", JdbcReportRepository.escapeCsv("Item with \"Quotes\" inside"));
    }

    @Test
    @DisplayName("Security Test: CSV Formula Injection protection (prefix with apostrophe)")
    void testCsvInjectionProtection() {
        // Equal sign
        assertEquals("'=1+1", JdbcReportRepository.escapeCsv("=1+1"));
        assertEquals("\"'=SUM(A1:A10), calc\"", JdbcReportRepository.escapeCsv("=SUM(A1:A10), calc"));

        // Plus sign
        assertEquals("'+12345", JdbcReportRepository.escapeCsv("+12345"));

        // Minus sign
        assertEquals("'-2+5", JdbcReportRepository.escapeCsv("-2+5"));

        // At symbol (contains comma, so wrapped in quotes)
        assertEquals("\"'@SUM(1,2)\"", JdbcReportRepository.escapeCsv("@SUM(1,2)"));
        assertEquals("'@Formula", JdbcReportRepository.escapeCsv("@Formula"));
    }
}
