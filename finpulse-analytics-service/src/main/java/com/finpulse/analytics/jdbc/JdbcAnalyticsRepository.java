package com.finpulse.analytics.jdbc;

import javax.sql.DataSource;

/**
 * Backward-compatible subclass of JdbcReportRepository.
 */
public class JdbcAnalyticsRepository extends JdbcReportRepository {

    public JdbcAnalyticsRepository(DataSource dataSource) {
        super(dataSource);
    }
}
