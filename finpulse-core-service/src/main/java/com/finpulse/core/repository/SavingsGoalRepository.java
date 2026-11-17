package com.finpulse.core.repository;

import com.finpulse.core.model.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {
    List<SavingsGoal> findByUserId(Long userId);
    List<SavingsGoal> findByUserIdOrderByCreatedAtDesc(Long userId);
}
