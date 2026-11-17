package com.finpulse.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finpulse.core.dto.TransferRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CoreIntegrationEndpointsTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Integration Test: Validation failure on POST returns standardized 400 error shape with fieldErrors and path")
    void testValidationErrorShape() throws Exception {
        // Missing accountId, negative amount
        Map<String, Object> invalidPayload = Map.of(
                "category", "Shopping",
                "amount", -50.00,
                "transactionType", "EXPENSE",
                "transactionDate", LocalDate.now().toString()
        );

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPayload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.path").value("/api/transactions"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.fieldErrors.accountId").exists());
    }

    @Test
    @DisplayName("Integration Test: Requesting non-existent entity returns standardized 404 error shape")
    void testResourceNotFoundShape() throws Exception {
        mockMvc.perform(get("/api/accounts/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.path").value("/api/accounts/999999"))
                .andExpect(jsonPath("$.message").value(containsString("Account not found")));
    }

    @Test
    @DisplayName("Integration Test: Self-transfer returns standardized 409 Conflict error shape")
    void testConflictErrorShape() throws Exception {
        TransferRequest selfTransfer = new TransferRequest(1L, 1L, new BigDecimal("100.00"), LocalDate.now(), "Self transfer");

        mockMvc.perform(post("/api/transfers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfTransfer)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.path").value("/api/transfers"))
                .andExpect(jsonPath("$.message").value(containsString("Source and destination accounts must be different")));
    }

    @Test
    @DisplayName("Integration Test: GET /api/categories returns canonical categories list with system flags")
    void testCategoriesEndpoint() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$[?(@.name == 'Salary')].type").value("INCOME"))
                .andExpect(jsonPath("$[?(@.name == 'Housing & Rent')].type").value("EXPENSE"))
                .andExpect(jsonPath("$[?(@.name == 'Transfer')].isSystem").value(true));
    }

    @Test
    @DisplayName("Integration Test: GET /api/summary returns executive metrics and accounts list")
    void testSummaryEndpoint() throws Exception {
        mockMvc.perform(get("/api/summary?userId=1&month=" + LocalDate.now().toString().substring(0, 7)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.netWorth").isNumber())
                .andExpect(jsonPath("$.income").isNumber())
                .andExpect(jsonPath("$.expenses").isNumber())
                .andExpect(jsonPath("$.accounts", hasSize(greaterThan(0))));
    }

    @Test
    @DisplayName("Integration Test: DELETE /api/accounts on account with transactions archives instead of hard-deleting")
    void testAccountDeleteArchivesWhenHasTransactions() throws Exception {
        // Account 1 in seeded data has many transactions
        mockMvc.perform(delete("/api/accounts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.action").value("ARCHIVED"))
                .andExpect(jsonPath("$.message").value(containsString("archived")));
    }
}
