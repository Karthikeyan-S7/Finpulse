package com.finpulse.core.repository;

import com.finpulse.core.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findByUserId(Long userId);

    List<Account> findByUserIdAndIsArchivedFalse(Long userId);

    Optional<Account> findByIdAndUserId(Long id, Long userId);

    boolean existsByAccountNumber(String accountNumber);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.user.id = :userId AND a.isArchived = false")
    BigDecimal getTotalNetWorthByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.user.id = :userId AND a.isArchived = false AND a.balance > 0")
    BigDecimal getTotalAssetsByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(ABS(a.balance)), 0) FROM Account a WHERE a.user.id = :userId AND a.isArchived = false AND a.balance < 0")
    BigDecimal getTotalLiabilitiesByUserId(@Param("userId") Long userId);
}
