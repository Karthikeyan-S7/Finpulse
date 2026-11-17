# 13. Appendix: Source Code Samples — FinPulse

The following 10 code excerpts represent core technical patterns across the FinPulse architecture (Spring Boot 3, JPA, Pure JDBC, React Hooks, and HTML5 Canvas 2D). All excerpts are copied verbatim from the codebase with exact file paths and line ranges.

---

## 1. JPA Entity: `Transaction.java`
- **File:** [`finpulse-core-service/src/main/java/com/finpulse/core/model/Transaction.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-core-service/src/main/java/com/finpulse/core/model/Transaction.java#L1-L43)
- **Lines:** 1–43
- **Significance:** Demonstrates Spring Data JPA entity mappings (`@Entity`, `@Table`), lazy loading relationship to parent account (`@ManyToOne(fetch = FetchType.LAZY)`), double-entry transfer tracking (`isTransfer`, `transferGroupId`), and column constraints.

```java
package com.finpulse.core.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType; // INCOME, EXPENSE

    @Column(length = 100)
    private String merchant;

    @Column(length = 255)
    private String description;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "is_transfer", nullable = false)
    private Boolean isTransfer = false;

    @Column(name = "transfer_group_id", length = 36)
    private String transferGroupId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
```

---

## 2. Presentation Layer with `@Valid` DTO: `TransactionController.java`
- **File:** [`finpulse-core-service/src/main/java/com/finpulse/core/controller/TransactionController.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-core-service/src/main/java/com/finpulse/core/controller/TransactionController.java#L37-L68)
- **Lines:** 37–68
- **Significance:** Illustrates REST controller endpoints with `@Valid` payload validation, standard HTTP status codes (`201 CREATED`, `200 OK`), and clean separation from entity models via DTOs.

```java
    @PostMapping
    public ResponseEntity<TransactionDto> createTransaction(@Valid @RequestBody TransactionRequest request) {
        Transaction recorded = transactionService.recordTransaction(request);
        return new ResponseEntity<>(TransactionDto.fromEntity(recorded), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDto> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.updateTransaction(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok(Map.of("message", "Transaction deleted and account balance updated successfully"));
    }

    // Backward-compatibility endpoints
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionDto>> getTransactionsByUser(@PathVariable Long userId) {
        List<Transaction> list = transactionService.getTransactionsByUserId(userId);
        return ResponseEntity.ok(list.stream().map(TransactionDto::fromEntity).collect(Collectors.toList()));
    }
```

---

## 3. Transactional Business Service: `TransferService.java`
- **File:** [`finpulse-core-service/src/main/java/com/finpulse/core/service/TransferService.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-core-service/src/main/java/com/finpulse/core/service/TransferService.java#L30-L72)
- **Lines:** 30–72
- **Significance:** Demonstrates ACID transaction enforcement via `@Transactional`, checking overdraft guards, validation against self-transfers, and paired debit/credit record creation with UUID linking.

```java
    @Transactional
    public TransferResponse executeTransfer(TransferRequest request) {
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw new BusinessConflictException("Source and destination accounts must be different for a transfer");
        }

        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be strictly positive");
        }

        if (request.date() != null && request.date().isAfter(LocalDate.now().plusYears(1))) {
            throw new IllegalArgumentException("Transfer date cannot be more than 1 year in the future: " + request.date());
        }

        Account fromAccount = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found with id: " + request.fromAccountId()));

        Account toAccount = accountRepository.findById(request.toAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found with id: " + request.toAccountId()));

        if (Boolean.TRUE.equals(fromAccount.getIsArchived())) {
            throw new BusinessConflictException("Cannot transfer from archived account: " + fromAccount.getAccountName());
        }

        if (Boolean.TRUE.equals(toAccount.getIsArchived())) {
            throw new BusinessConflictException("Cannot transfer to archived account: " + toAccount.getAccountName());
        }

        // Overdraft Guard on source account
        if (isOverdraftProtected(fromAccount.getAccountType())) {
            BigDecimal resulting = fromAccount.getBalance().subtract(request.amount());
            if (resulting.compareTo(BigDecimal.ZERO) < 0) {
                throw new InsufficientFundsException(String.format(
                        "Insufficient funds in %s. Current balance: %s, transfer amount: %s",
                        fromAccount.getAccountName(), fromAccount.getBalance(), request.amount()
                ));
            }
        }
```

---

## 4. Spring Data Repository with JPQL: `TransactionRepository.java`
- **File:** [`finpulse-core-service/src/main/java/com/finpulse/core/repository/TransactionRepository.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-core-service/src/main/java/com/finpulse/core/repository/TransactionRepository.java#L15-L42)
- **Lines:** 15–42
- **Significance:** Illustrates custom JPQL queries with fetch joins (`JOIN FETCH t.account a`) to eliminate N+1 hibernate query problems and parameterized filtering across date ranges.

```java
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByAccountId(Long accountId);

    Long countByAccountId(Long accountId);

    List<Transaction> findByTransferGroupId(String transferGroupId);

    @Query("SELECT t FROM Transaction t JOIN FETCH t.account a WHERE a.user.id = :userId ORDER BY t.transactionDate DESC, t.id DESC")
    List<Transaction> findByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t JOIN FETCH t.account a WHERE a.user.id = :userId AND t.transactionDate BETWEEN :startDate AND :endDate ORDER BY t.transactionDate DESC, t.id DESC")
    List<Transaction> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT t FROM Transaction t JOIN FETCH t.account a WHERE a.user.id = :userId " +
           "AND (:accountId IS NULL OR a.id = :accountId) " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate) " +
           "ORDER BY t.transactionDate DESC, t.id DESC")
    List<Transaction> findFiltered(
            @Param("userId") Long userId,
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
```

---

## 5. Global Exception Handler: `GlobalExceptionHandler.java`
- **File:** [`finpulse-core-service/src/main/java/com/finpulse/core/exception/GlobalExceptionHandler.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-core-service/src/main/java/com/finpulse/core/exception/GlobalExceptionHandler.java#L18-L48)
- **Lines:** 18–48
- **Significance:** Centralizes REST error responses using `@RestControllerAdvice`, mapping domain exceptions (`ResourceNotFoundException`, `InsufficientFundsException`) to structured JSON `ErrorResponse` objects with timestamps and paths.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                Collections.emptyMap(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientFunds(InsufficientFundsException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                ex.getMessage(),
                Collections.emptyMap(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }
```

---

## 6. Pure JDBC Execution: `JdbcReportRepository.java`
- **File:** [`finpulse-analytics-service/src/main/java/com/finpulse/analytics/jdbc/JdbcReportRepository.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-analytics-service/src/main/java/com/finpulse/analytics/jdbc/JdbcReportRepository.java#L58-L98)
- **Lines:** 58–98
- **Significance:** Demonstrates pure JDBC execution without JPA/Hibernate overhead using `DataSource.getConnection()`, `PreparedStatement` with parameterized binding, and `ResultSet` iteration inside try-with-resources.

```java
    public List<CashflowDto> getCashflow(Long userId, int months) {
        if (months <= 0) {
            months = 6;
        }

        YearMonth currentYm = YearMonth.now();
        YearMonth startYm = currentYm.minusMonths(months - 1);
        LocalDate startDate = startYm.atDay(1);

        Map<String, CashflowDto> monthMap = new LinkedHashMap<>();
        for (int i = 0; i < months; i++) {
            String ymStr = startYm.plusMonths(i).toString();
            monthMap.put(ymStr, new CashflowDto(ymStr, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        }

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.CASHFLOW_QUERY)) {

            ps.setLong(1, userId);
            ps.setDate(2, Date.valueOf(startDate));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String month = rs.getString("month_year");
                    BigDecimal income = rs.getBigDecimal("total_income");
                    BigDecimal expenses = rs.getBigDecimal("total_expenses");
                    if (income == null) income = BigDecimal.ZERO;
                    if (expenses == null) expenses = BigDecimal.ZERO;
                    BigDecimal net = income.subtract(expenses);

                    monthMap.put(month, new CashflowDto(month, income, expenses, net));
                }
            }
        } catch (SQLException e) {
            log.error("Failed to execute cashflow query for userId={}, months={}: {}", userId, months, e.getMessage(), e);
            throw new RuntimeException("Database error calculating cashflow: " + e.getMessage(), e);
        }

        return new ArrayList<>(monthMap.values());
    }
```

---

## 7. Raw ANSI SQL Set Operation Query: `SqlQueryCatalog.java`
- **File:** [`finpulse-analytics-service/src/main/java/com/finpulse/analytics/jdbc/SqlQueryCatalog.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-analytics-service/src/main/java/com/finpulse/analytics/jdbc/SqlQueryCatalog.java#L125-L162)
- **Lines:** 125–162
- **Significance:** Demonstrates ANSI SQL `INTERSECT` set operation finding recurring merchants charged across consecutive months, joined with spend aggregates.

```java
    public static final String RECURRING_MERCHANTS_INTERSECT_QUERY =
            "SELECT " +
            "    m.merchant, " +
            "    curr.current_amount, " +
            "    prev.previous_amount " +
            "FROM ( " +
            "    SELECT t1.merchant " +
            "    FROM transactions t1 " +
            "    JOIN accounts a1 ON t1.account_id = a1.id " +
            "    WHERE a1.user_id = ? " +
            "      AND t1.transaction_type = 'EXPENSE' " +
            "      AND t1.is_transfer = FALSE " +
            "      AND t1.merchant IS NOT NULL AND t1.merchant <> '' " +
            "      AND SUBSTRING(CAST(t1.transaction_date AS CHAR(10)), 1, 7) = ? " +
            "    INTERSECT " +
            "    SELECT t2.merchant " +
            "    FROM transactions t2 " +
            "    JOIN accounts a2 ON t2.account_id = a2.id " +
            "    WHERE a2.user_id = ? " +
            "      AND t2.transaction_type = 'EXPENSE' " +
            "      AND t2.is_transfer = FALSE " +
            "      AND t2.merchant IS NOT NULL AND t2.merchant <> '' " +
            "      AND SUBSTRING(CAST(t2.transaction_date AS CHAR(10)), 1, 7) = ? " +
            ") m " +
            "JOIN ( " +
            "    SELECT t.merchant, SUM(t.amount) AS current_amount " +
            "    FROM transactions t " +
            "    JOIN accounts a ON t.account_id = a.id " +
            "    WHERE a.user_id = ? " +
            "      AND t.transaction_type = 'EXPENSE' " +
            "      AND t.is_transfer = FALSE " +
            "      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? " +
            "    GROUP BY t.merchant " +
            ") curr ON m.merchant = curr.merchant " +
            "JOIN ( " +
            "    SELECT t.merchant, SUM(t.amount) AS previous_amount " +
            "    FROM transactions t " +
            "    JOIN accounts a ON t.account_id = a.id " +
            "    WHERE a.user_id = ? " +
            "      AND t.transaction_type = 'EXPENSE' " +
            "      AND t.is_transfer = FALSE " +
            "      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? " +
            "    GROUP BY t.merchant " +
            ") prev ON m.merchant = prev.merchant " +
            "ORDER BY curr.current_amount DESC";
```

---

## 8. Inter-Service REST Client: `CoreServiceClient.java`
- **File:** [`finpulse-analytics-service/src/main/java/com/finpulse/analytics/client/CoreServiceClient.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-analytics-service/src/main/java/com/finpulse/analytics/client/CoreServiceClient.java#L25-L60)
- **Lines:** 25–60
- **Significance:** Illustrates microservice-to-microservice synchronous REST communication using Spring's `RestTemplateBuilder`, timeouts, and graceful degradation fallback.

```java
@Component
public class CoreServiceClient {

    private final RestTemplate restTemplate;
    private final String coreServiceUrl;

    @Autowired
    public CoreServiceClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${finpulse.core-service.url:http://localhost:8081}") String coreServiceUrl,
            @Value("${finpulse.core-service.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${finpulse.core-service.read-timeout-ms:3000}") int readTimeoutMs) {
        this.coreServiceUrl = coreServiceUrl.replaceAll("/+$", "");
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }

    public List<AccountSummaryDto> getAccountSummaries(Long userId) {
        String url = String.format("%s/api/accounts/summary?userId=%d", coreServiceUrl, userId);
        try {
            ResponseEntity<List<AccountSummaryDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<AccountSummaryDto>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("Failed to fetch account summaries from core service ({}): {}", url, e.getMessage());
            return Collections.emptyList();
        }
    }
```

---

## 9. React Custom Hook: `useFinancialAnalytics.js`
- **File:** [`finpulse-frontend/src/hooks/useFinancialAnalytics.js`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-frontend/src/hooks/useFinancialAnalytics.js#L1-L40)
- **Lines:** 1–40
- **Significance:** Custom hook encapsulating memoized client-side financial metrics, burn velocity calculation, savings rate derivation, and transfer exclusion.

```javascript
import { useMemo } from 'react';

export function useFinancialAnalytics(transactions = [], budgets = []) {
  return useMemo(() => {
    let income = 0;
    let expenses = 0;
    const categoryTotals = {};
    const historicalCategoryTotals = {}; // transactions in prior 90 days

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based
    const currentDay = Math.max(1, now.getDate());

    // 90 days ago cutoff for trailing 3-month average calculation
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    transactions.forEach((tx) => {
      // Exclude transfers and opening balances
      if (tx.isTransfer || tx.category === 'Transfer' || tx.merchant === 'Opening Balance') {
        return;
      }

      const amount = Number(tx.amount) || 0;
      const txDate = tx.transactionDate ? new Date(tx.transactionDate) : null;
      const isCurrentMonth = txDate && txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;

      if (tx.transactionType === 'INCOME') {
        if (isCurrentMonth || !txDate) {
          income += amount;
        }
      } else if (tx.transactionType === 'EXPENSE') {
        if (isCurrentMonth || !txDate) {
          expenses += amount;
          const cat = tx.category || 'Other';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
        }
        if (txDate && txDate >= ninetyDaysAgo && !isCurrentMonth) {
          const cat = tx.category || 'Other';
          historicalCategoryTotals[cat] = (historicalCategoryTotals[cat] || 0) + amount;
        }
      }
    });
```

---

## 10. Native HTML5 Canvas 2D Chart Rendering: `DonutChart.jsx`
- **File:** [`finpulse-frontend/src/components/charts/DonutChart.jsx`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-frontend/src/components/charts/DonutChart.jsx#L85-L125)
- **Lines:** 85–125
- **Significance:** Demonstrates raw HTML5 Canvas 2D graphics (`ctx.arc`, `ctx.beginPath`, `ctx.fill`) with smooth ease-out progress animations, inner cutout radius, and centered financial labels without third-party chart libraries.

```javascript
  const onDraw = useCallback(
    ({ ctx, width, height: canvasHeight, progress, colors }) => {
      if (slices.length === 0 || total === 0) return;

      const centerX = width / 2;
      const centerY = canvasHeight / 2;
      const radius = Math.min(centerX, centerY) - 8;
      const innerRadius = radius * (innerRadiusRatio || 0.65);

      let startAngle = -Math.PI / 2;

      slices.forEach((slice, i) => {
        const sliceAngle = (slice.amount / total) * (Math.PI * 2) * progress;
        const endAngle = startAngle + sliceAngle;
        const isHovered = hoveredIndex === i;
        const currentRadius = isHovered ? radius + 4 : radius;

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = slice.color || getCategoryColor(slice.name, i);
        ctx.fill();

        startAngle = endAngle;
      });

      // Draw Center Aggregate Text
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatCurrency(total), centerX, centerY - 6);

      ctx.fillStyle = colors.muted;
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Total', centerX, centerY + 14);
    },
    [slices, total, hoveredIndex, innerRadiusRatio, formatCurrency]
  );
```
