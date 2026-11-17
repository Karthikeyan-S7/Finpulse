package com.finpulse.core.repository;

import com.finpulse.core.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserId(Long userId);
    List<Budget> findByUserIdAndMonthYear(Long userId, String monthYear);
    Optional<Budget> findByUserIdAndCategoryAndMonthYear(Long userId, String category, String monthYear);
    boolean existsByUserIdAndCategoryAndMonthYear(Long userId, String category, String monthYear);
}
