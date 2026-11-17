package com.finpulse.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finpulse.core.controller.TransactionController;
import com.finpulse.core.dto.TransactionRequest;
import com.finpulse.core.model.Account;
import com.finpulse.core.model.Transaction;
import com.finpulse.core.model.User;
import com.finpulse.core.service.TransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TransactionController.class)
public class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TransactionService transactionService;

    @Test
    @DisplayName("Integration Test: GET /api/transactions/user/1 returns transactions list")
    void testGetTransactionsByUser() throws Exception {
        User user = new User(1L, "alex", "alex@example.com", "Alex");
        Account account = new Account(1L, user, "Checking", "CHK-1", "CHECKING", new BigDecimal("1000.00"), "USD");
        Transaction tx = new Transaction(1L, account, "Food", new BigDecimal("45.00"), "EXPENSE", "Market", "Groceries", LocalDate.now());

        when(transactionService.getTransactionsByUserId(1L)).thenReturn(List.of(tx));

        mockMvc.perform(get("/api/transactions/user/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].merchant").value("Market"))
                .andExpect(jsonPath("$[0].amount").value(45.00));
    }

    @Test
    @DisplayName("Integration Test: POST /api/transactions with valid payload returns HTTP 201 Created")
    void testCreateTransactionEndpoint() throws Exception {
        User user = new User(1L, "alex", "alex@example.com", "Alex");
        Account account = new Account(1L, user, "Checking", "CHK-1", "CHECKING", new BigDecimal("1000.00"), "USD");

        TransactionRequest req = new TransactionRequest();
        req.setAccountId(1L);
        req.setCategory("Salary");
        req.setAmount(new BigDecimal("3000.00"));
        req.setTransactionType("INCOME");
        req.setMerchant("Employer Tech");
        req.setTransactionDate(LocalDate.now());

        Transaction created = new Transaction(10L, account, "Salary", new BigDecimal("3000.00"), "INCOME", "Employer Tech", null, LocalDate.now());

        when(transactionService.recordTransaction(any(TransactionRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.transactionType").value("INCOME"));
    }
}
