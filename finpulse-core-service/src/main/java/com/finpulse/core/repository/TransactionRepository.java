package com.finpulse.core.repository;

import com.finpulse.core.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
           "AND (:type IS NULL OR t.transactionType = :type) " +
           "AND (:category IS NULL OR t.category = :category) " +
           "ORDER BY t.transactionDate DESC, t.id DESC")
    List<Transaction> filterTransactions(
            @Param("userId") Long userId,
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("type") String type,
            @Param("category") String category
    );

    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t JOIN t.account a " +
           "WHERE a.user.id = :userId AND t.transactionType = 'EXPENSE' AND t.isTransfer = false " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.category")
    List<Object[]> getCategoryExpenseTotalsForRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t JOIN t.account a " +
           "WHERE a.user.id = :userId AND t.category = :category AND t.transactionType = 'EXPENSE' AND t.isTransfer = false " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal getCategorySpendForRange(
            @Param("userId") Long userId,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t JOIN t.account a " +
           "WHERE a.user.id = :userId AND t.transactionType = 'INCOME' AND t.isTransfer = false " +
           "AND t.category != 'Transfer' AND (t.merchant IS NULL OR t.merchant != 'Opening Balance') " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal getMonthlyIncome(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t JOIN t.account a " +
           "WHERE a.user.id = :userId AND t.transactionType = 'EXPENSE' AND t.isTransfer = false " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal getMonthlyExpense(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t WHERE t.account.user.id = :userId AND t.transactionType = 'EXPENSE' GROUP BY t.category")
    List<Object[]> getCategoryExpenseTotals(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.account.user.id = :userId AND t.transactionType = :type")
    BigDecimal getTotalAmountByType(@Param("userId") Long userId, @Param("type") String type);
}
