-- FinPulse Database Migration Script: v1 to v2
-- Upgrades existing finpulse_db to support transfers, recurring bills, savings goals, and user localization

USE finpulse_db;

-- 1. Helper procedure for idempotent column addition
DROP PROCEDURE IF EXISTS AddColIfNotExists;
DELIMITER //
CREATE PROCEDURE AddColIfNotExists(
    IN tblName VARCHAR(64),
    IN colName VARCHAR(64),
    IN colDef VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = tblName AND column_name = colName
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE ', tblName, ' ADD COLUMN ', colName, ' ', colDef);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- 2. Upgrade users table
CALL AddColIfNotExists('users', 'currency', 'CHAR(3) NOT NULL DEFAULT ''INR''');
CALL AddColIfNotExists('users', 'locale', 'VARCHAR(10) NOT NULL DEFAULT ''en-IN''');

-- 3. Upgrade accounts table
CALL AddColIfNotExists('accounts', 'is_archived', 'BOOLEAN NOT NULL DEFAULT FALSE');

-- 4. Upgrade transactions table
ALTER TABLE transactions MODIFY COLUMN merchant VARCHAR(100) NULL;
CALL AddColIfNotExists('transactions', 'is_transfer', 'BOOLEAN NOT NULL DEFAULT FALSE');
CALL AddColIfNotExists('transactions', 'transfer_group_id', 'VARCHAR(36) NULL');

-- Clean up helper procedure
DROP PROCEDURE IF EXISTS AddColIfNotExists;

-- 5. Create missing indexes on transactions
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'transactions' AND index_name = 'idx_transactions_acc_date');
SET @sql := IF(@exist = 0, 'CREATE INDEX idx_transactions_acc_date ON transactions(account_id, transaction_date)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'transactions' AND index_name = 'idx_transactions_category');
SET @sql := IF(@exist = 0, 'CREATE INDEX idx_transactions_category ON transactions(category)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'transactions' AND index_name = 'idx_transactions_merchant');
SET @sql := IF(@exist = 0, 'CREATE INDEX idx_transactions_merchant ON transactions(merchant)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. Add unique constraint on budgets (user_id, category, month_year)
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'budgets' AND constraint_name = 'uq_budgets_user_cat_month');
SET @sql := IF(@exist = 0, 'ALTER TABLE budgets ADD CONSTRAINT uq_budgets_user_cat_month UNIQUE (user_id, category, month_year)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7. Create recurring_payments table
CREATE TABLE IF NOT EXISTS recurring_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    merchant VARCHAR(100) NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_recurring_user_due (user_id, next_due_date)
);

-- 8. Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    saved_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    target_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
