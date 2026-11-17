package com.finpulse.core.repository;

import com.finpulse.core.model.RecurringPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringPaymentRepository extends JpaRepository<RecurringPayment, Long> {

    @Query("SELECT r FROM RecurringPayment r JOIN FETCH r.account a WHERE r.user.id = :userId ORDER BY r.nextDueDate ASC")
    List<RecurringPayment> findByUserIdWithAccount(@Param("userId") Long userId);

    List<RecurringPayment> findByUserId(Long userId);

    List<RecurringPayment> findByUserIdAndIsActiveTrue(Long userId);

    List<RecurringPayment> findByUserIdAndNextDueDateBetween(Long userId, LocalDate start, LocalDate end);

    @Query("SELECT r FROM RecurringPayment r JOIN FETCH r.account a WHERE r.id = :id")
    Optional<RecurringPayment> findByIdWithAccount(@Param("id") Long id);
}
