import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { analyticsApi } from '../api/analytics';

// UI Components
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MonthPicker } from '../components/ui/MonthPicker';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';

// Canvas Charts
import { BarChart } from '../components/charts/BarChart';
import { DonutChart } from '../components/charts/DonutChart';

export function Reports() {
  useDocumentTitle('Reports & Analytics');
  const { userId } = useAuth();
  const { formatAmount } = useCurrency();
  const toast = useToast();
  const location = useLocation();

  // Active month state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // Section data states
  const [loading, setLoading] = useState(true);
  const [analyticsOffline, setAnalyticsOffline] = useState(false);
  const [overview, setOverview] = useState(null);
  const [cashflow, setCashflow] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [spendingSpikes, setSpendingSpikes] = useState([]);
  const [recurringMerchants, setRecurringMerchants] = useState([]);
  const [unusedBudgets, setUnusedBudgets] = useState([]);
  const [timeline, setTimeline] = useState([]);

  // Category breakdown table sorting
  const [categorySortField, setCategorySortField] = useState('sharePercent');
  const [categorySortAsc, setCategorySortAsc] = useState(false);

  // Timeline kind filter ('ALL', 'ACTUAL', 'SCHEDULED')
  const [timelineFilter, setTimelineFilter] = useState('ALL');

  // CSV Export Date Range State
  const [exportPreset, setExportPreset] = useState('6months');
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Handle URL hash / search param scrolling
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section') || (location.hash ? location.hash.replace('#', '') : null);
    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    }
  }, [location]);

  // Load all analytical data independently via Promise.allSettled
  const loadReportsData = useCallback(async () => {
    setLoading(true);
    setAnalyticsOffline(false);

    try {
      const [ovRes, cfRes, cbRes, ssRes, rmRes, ubRes, tlRes] = await Promise.allSettled([
        analyticsApi.getOverview({ userId, month: selectedMonth }),
        analyticsApi.getCashflow({ userId, months: 6 }),
        analyticsApi.getCategoryBreakdown({ userId, month: selectedMonth }),
        analyticsApi.getSpendingSpikes({ userId, month: selectedMonth }),
        analyticsApi.getRecurringMerchants({ userId, month: selectedMonth }),
        analyticsApi.getUnusedBudgets({ userId, month: selectedMonth }),
        analyticsApi.getTimeline({ userId, days: 30 }),
      ]);

      const fulfilledCount = [ovRes, cfRes, cbRes, ssRes, rmRes, ubRes, tlRes].filter(
        (r) => r.status === 'fulfilled'
      ).length;

      if (fulfilledCount === 0) {
        setAnalyticsOffline(true);
      }

      setOverview(ovRes.status === 'fulfilled' ? ovRes.value : null);
      setCashflow(cfRes.status === 'fulfilled' && Array.isArray(cfRes.value) ? cfRes.value : []);
      setCategoryBreakdown(cbRes.status === 'fulfilled' && Array.isArray(cbRes.value) ? cbRes.value : []);
      setSpendingSpikes(ssRes.status === 'fulfilled' && Array.isArray(ssRes.value) ? ssRes.value : []);
      setRecurringMerchants(rmRes.status === 'fulfilled' && Array.isArray(rmRes.value) ? rmRes.value : []);
      setUnusedBudgets(ubRes.status === 'fulfilled' && Array.isArray(ubRes.value) ? ubRes.value : []);
      setTimeline(tlRes.status === 'fulfilled' && Array.isArray(tlRes.value) ? tlRes.value : []);
    } catch (err) {
      console.error('Failed to load analytical reports:', err);
      setAnalyticsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMonth]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  // Sorted Category Breakdown
  const sortedCategories = useMemo(() => {
    return categoryBreakdown.slice().sort((a, b) => {
      let valA = a[categorySortField];
      let valB = b[categorySortField];
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return categorySortAsc ? cmp : -cmp;
      }
      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return categorySortAsc ? valA - valB : valB - valA;
    });
  }, [categoryBreakdown, categorySortField, categorySortAsc]);

  const handleToggleCategorySort = (field) => {
    if (categorySortField === field) {
      setCategorySortAsc(!categorySortAsc);
    } else {
      setCategorySortField(field);
      setCategorySortAsc(false);
    }
  };

  // Filtered Timeline (Actual vs Scheduled)
  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'ALL') return timeline;
    return timeline.filter((item) => (item.kind || '').toUpperCase() === timelineFilter);
  }, [timeline, timelineFilter]);

  // Handle Export Presets
  const handleApplyPreset = (presetKey) => {
    setExportPreset(presetKey);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setExportTo(todayStr);

    if (presetKey === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setExportFrom(start.toISOString().split('T')[0]);
    } else if (presetKey === 'lastMonth') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setExportFrom(start.toISOString().split('T')[0]);
      setExportTo(end.toISOString().split('T')[0]);
    } else if (presetKey === '90days') {
      const start = new Date();
      start.setDate(start.getDate() - 90);
      setExportFrom(start.toISOString().split('T')[0]);
    } else if (presetKey === '6months') {
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      setExportFrom(start.toISOString().split('T')[0]);
    } else if (presetKey === 'ytd') {
      const start = new Date(today.getFullYear(), 0, 1);
      setExportFrom(start.toISOString().split('T')[0]);
    } else if (presetKey === 'all') {
      setExportFrom('2020-01-01');
    }
  };

  const handleDownloadCsv = () => {
    const url = analyticsApi.getExportCsvUrl({
      userId,
      from: exportFrom,
      to: exportTo,
    });
    toast.info('Downloading verified CSV export...');
    window.location.href = url;
  };

  const handleScrollToExport = () => {
    const el = document.getElementById('data-export');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Monthly summary calculations
  const monthlySummary = useMemo(() => {
    const income = overview?.income !== undefined ? Number(overview.income) : 0;
    const expenses = overview?.expenses !== undefined ? Number(overview.expenses) : 0;
    const prevIncome = overview?.previousIncome !== undefined ? Number(overview.previousIncome) : 0;
    const prevExpenses = overview?.previousExpenses !== undefined ? Number(overview.previousExpenses) : 0;
    const net = income - expenses;
    const savingsRate = overview?.savingsRate !== undefined ? Math.round(overview.savingsRate) : (income > 0 ? Math.round(((income - expenses) / income) * 100) : 0);

    const incomeDeltaPct = prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 100) : 0;
    const expenseDeltaPct = prevExpenses > 0 ? Math.round(((expenses - prevExpenses) / prevExpenses) * 100) : 0;

    return {
      income,
      expenses,
      net,
      savingsRate,
      incomeDeltaPct,
      expenseDeltaPct,
    };
  }, [overview]);

  return (
    <div className="page-container">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Analytical insights powered by pure JDBC queries: cash flow trends, spending spikes, and raw ledger exports."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            <Button variant="secondary" onClick={handleScrollToExport}>
              <Icon name="download" size={16} />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Analytics Service Offline Banner */}
      {analyticsOffline && (
        <ErrorState
          title="Analytics Service Unreachable"
          message="Unable to connect to the Financial Analytics Service on port 8082. Please verify that finpulse-analytics-service is running on http://localhost:8082."
          onRetry={loadReportsData}
        />
      )}

      {/* 1. Monthly Summary Row */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          label="Total Income"
          value={formatAmount(monthlySummary.income)}
          change={monthlySummary.incomeDeltaPct}
          changeLabel="vs previous month"
          variant="income"
          icon="trendUp"
        />
        <StatCard
          label="Total Expenses"
          value={formatAmount(monthlySummary.expenses)}
          change={monthlySummary.expenseDeltaPct}
          changeLabel="vs previous month"
          variant="expense"
          icon="trendDown"
        />
        <StatCard
          label="Net Cash Flow"
          value={formatAmount(monthlySummary.net)}
          subtext={monthlySummary.net >= 0 ? 'Net surplus for the month' : 'Net deficit for the month'}
          variant={monthlySummary.net >= 0 ? 'income' : 'expense'}
          icon="wallet"
        />
        <StatCard
          label="Savings Rate"
          value={`${monthlySummary.savingsRate}%`}
          subtext="Proportion of net earnings retained"
          variant={monthlySummary.savingsRate >= 20 ? 'income' : 'default'}
          icon="piggyBank"
        />
      </div>

      {/* 2. Cash Flow 6-Month Chart */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <CardTitle>Cash Flow Trend (6 Months)</CardTitle>
              <CardSubtitle>Historical monthly income vs. operating expenses</CardSubtitle>
            </div>
            <Badge variant="info">Pure JDBC Query</Badge>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SkeletonCard />
            </div>
          ) : cashflow.length === 0 ? (
            <EmptyState
              icon="chart"
              title="No cash flow data available"
              description="Historical income and expense trends will appear here once transactions are recorded across multiple billing cycles."
            />
          ) : (
            <div style={{ height: 280 }}>
              <BarChart
                data={cashflow}
                xKey="month"
                series={[
                  { key: 'income', label: 'Income', color: 'var(--color-income)' },
                  { key: 'expenses', label: 'Expenses', color: 'var(--color-expense)' },
                ]}
                height={260}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* 3. Where the Money Went (Category Breakdown) */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <CardTitle>Where the Money Went</CardTitle>
              <CardSubtitle>Category expenditure share for {selectedMonth}</CardSubtitle>
            </div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              {categoryBreakdown.length} active spending categories
            </span>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <SkeletonTable rows={4} columns={3} />
          ) : categoryBreakdown.length === 0 ? (
            <EmptyState
              icon="pieChart"
              title="No category expenses recorded"
              description={`Zero expense transactions have been recorded for ${selectedMonth}.`}
            />
          ) : (
            <div className="dashboard-grid" style={{ alignItems: 'center', marginBottom: 0 }}>
              {/* Donut Chart */}
              <div className="col-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DonutChart
                  data={categoryBreakdown.map((c) => ({
                    name: c.category,
                    amount: Number(c.amount || 0),
                  }))}
                  height={260}
                  showLegend={false}
                />
              </div>

              {/* Sortable Category Breakdown Table */}
              <div className="col-7">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th
                          onClick={() => handleToggleCategorySort('category')}
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Category
                            {categorySortField === 'category' && (
                              <Icon name={categorySortAsc ? 'chevronUp' : 'chevronDown'} size={14} />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleToggleCategorySort('amount')}
                          style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', width: '100%' }}>
                            Amount
                            {categorySortField === 'amount' && (
                              <Icon name={categorySortAsc ? 'chevronUp' : 'chevronDown'} size={14} />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleToggleCategorySort('sharePercent')}
                          style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', width: '100%' }}>
                            Share %
                            {categorySortField === 'sharePercent' && (
                              <Icon name={categorySortAsc ? 'chevronUp' : 'chevronDown'} size={14} />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCategories.map((item) => {
                        const pct = item.sharePercent != null ? Number(item.sharePercent) : 0;
                        return (
                          <tr key={item.category}>
                            <td>
                              <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="font-tabular" style={{ fontWeight: 'var(--weight-semibold)' }}>
                                {formatAmount(item.amount)}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                                <div style={{ width: 60 }}>
                                  <ProgressBar value={pct} max={100} height={4} variant="primary" />
                                </div>
                                <span className="font-tabular" style={{ width: 44, textAlign: 'right', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 4. Spending Spikes (Correlated Subquery) */}
      <Card id="spending-spikes" style={{ marginBottom: 'var(--space-6)' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <CardTitle>Spending Spikes</CardTitle>
              <CardSubtitle>
                Categories where {selectedMonth} spending exceeded 120% of the 3-month trailing average
              </CardSubtitle>
            </div>
            <Badge variant="warning">Correlated Subquery</Badge>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="grid-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : spendingSpikes.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-income-subtle)',
                border: '1px solid var(--color-income)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <Icon name="checkCircle" size={20} style={{ color: 'var(--color-income)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--color-income)', display: 'block', fontSize: 'var(--font-sm)' }}>
                  No unusual spending spikes this month!
                </strong>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  All category expenditures remain within your typical 3-month trailing bounds.
                </span>
              </div>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: 'var(--space-4)' }}>
              {spendingSpikes.map((spike) => {
                const diff = Number(spike.currentAmount || 0) - Number(spike.averageAmount || 0);
                const pct = Math.round(Number(spike.changePercent || 0));

                return (
                  <div
                    key={spike.category}
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-active)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
                        {spike.category}
                      </strong>
                      <Badge variant="expense">+{pct}% Spike</Badge>
                    </div>

                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--color-expense)' }}>{spike.category}</strong> is {pct}% above your usual trailing monthly benchmark.
                    </div>

                    <div
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 'var(--font-xs)',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Current Month</span>
                        <strong className="font-tabular" style={{ color: 'var(--text-primary)' }}>
                          {formatAmount(spike.currentAmount)}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>3-Mo Average</span>
                        <span className="font-tabular" style={{ color: 'var(--text-secondary)' }}>
                          {formatAmount(spike.averageAmount)}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Net Increase</span>
                        <strong className="font-tabular" style={{ color: 'var(--color-expense)' }}>
                          +{formatAmount(diff)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 5. Recurring Merchants (INTERSECT) */}
      <Card id="recurring-merchants" style={{ marginBottom: 'var(--space-6)' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <CardTitle>Recurring Merchants</CardTitle>
              <CardSubtitle>
                Merchants billed in both this month and last month (identified via SQL INTERSECT)
              </CardSubtitle>
            </div>
            <Badge variant="info">SQL INTERSECT</Badge>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <SkeletonTable rows={3} columns={4} />
          ) : recurringMerchants.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-active)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <Icon name="clock" size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 'var(--font-sm)' }}>
                  No duplicate consecutive merchants found
                </strong>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  No merchants recorded repeated charges across both consecutive monthly cycles.
                </span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Merchant / Payee</th>
                    <th>Classification</th>
                    <th style={{ textAlign: 'right' }}>This Month</th>
                    <th style={{ textAlign: 'right' }}>Last Month</th>
                    <th style={{ textAlign: 'right' }}>Monthly Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringMerchants.map((item) => {
                    const curr = Number(item.currentAmount || 0);
                    const prev = Number(item.previousAmount || 0);
                    const diff = curr - prev;

                    return (
                      <tr key={item.merchant}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Icon name="repeat" size={16} style={{ color: 'var(--accent)' }} />
                            <strong style={{ color: 'var(--text-primary)' }}>{item.merchant}</strong>
                          </div>
                        </td>
                        <td>
                          <Badge variant="neutral">Likely Recurring Subscription</Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-tabular" style={{ fontWeight: 'var(--weight-semibold)' }}>
                            {formatAmount(curr)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-tabular" style={{ color: 'var(--text-secondary)' }}>
                            {formatAmount(prev)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className="font-tabular"
                            style={{
                              color: diff === 0 ? 'var(--text-muted)' : diff > 0 ? 'var(--color-expense)' : 'var(--color-income)',
                            }}
                          >
                            {diff === 0 ? 'Exact match' : diff > 0 ? `+${formatAmount(diff)}` : `-${formatAmount(Math.abs(diff))}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 6. Unused Budgets (EXCEPT) */}
      <Card id="unused-budgets" style={{ marginBottom: 'var(--space-6)' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <CardTitle>Unused Budgets</CardTitle>
              <CardSubtitle>
                Budgeted categories with zero expenses recorded this month (identified via SQL EXCEPT)
              </CardSubtitle>
            </div>
            <Badge variant="success">SQL EXCEPT</Badge>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="grid-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : unusedBudgets.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-active)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <Icon name="checkCircle" size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 'var(--font-sm)' }}>
                  All budgets actively utilized
                </strong>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  Every budgeted category has recorded at least one transaction in {selectedMonth}.
                </span>
              </div>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: 'var(--space-4)' }}>
              {unusedBudgets.map((b) => (
                <div
                  key={b.category}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-income-subtle)',
                    border: '1px solid var(--color-income)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{b.category}</strong>
                    <Badge variant="income">100% Free</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <strong className="font-tabular" style={{ color: 'var(--color-income)' }}>
                      {formatAmount(b.monthlyLimit)}
                    </strong>{' '}
                    allocated remains completely untouched and free for savings or reallocation.
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 7. Timeline (UNION) */}
      <Card id="timeline" style={{ marginBottom: 'var(--space-6)' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <CardTitle>Cash Flow Timeline (Actual vs. Scheduled)</CardTitle>
              <CardSubtitle>
                Chronological timeline uniting past 30 days of actual transactions with next 30 days of scheduled commitments (SQL UNION)
              </CardSubtitle>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <SegmentedControl
                options={[
                  { value: 'ALL', label: 'All (60 Days)' },
                  { value: 'ACTUAL', label: 'Actual (Past)' },
                  { value: 'SCHEDULED', label: 'Scheduled (Next)' },
                ]}
                value={timelineFilter}
                onChange={setTimelineFilter}
              />
              <Badge variant="info">SQL UNION</Badge>
            </div>
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 'var(--space-4)' }}>
              <SkeletonTable rows={5} columns={5} />
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div style={{ padding: 'var(--space-4)' }}>
              <EmptyState
                icon="calendar"
                title="No timeline events found"
                description="No historical transactions or upcoming recurring commitments match this 60-day window."
              />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Record Type</th>
                    <th>Description / Payee</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimeline.map((item, idx) => {
                    const isActual = (item.kind || '').toUpperCase() === 'ACTUAL';
                    return (
                      <tr key={`${item.date}-${item.label}-${idx}`} style={{ opacity: isActual ? 1 : 0.85 }}>
                        <td>
                          <span className="font-tabular" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                            {item.date}
                          </span>
                        </td>
                        <td>
                          <Badge variant={isActual ? 'success' : 'warning'}>
                            <Icon name={isActual ? 'check' : 'clock'} size={12} style={{ marginRight: '4px' }} />
                            {isActual ? 'Actual' : 'Scheduled'}
                          </Badge>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
                            {item.label}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className="font-tabular"
                            style={{
                              fontWeight: 'var(--weight-semibold)',
                              color: isActual ? 'var(--text-primary)' : 'var(--accent)',
                            }}
                          >
                            {formatAmount(item.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 8. Data Export (CSV) */}
      <Card id="data-export">
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <CardTitle>Data Export (CSV)</CardTitle>
              <CardSubtitle>
                Stream verified ledger transactions directly from the pure JDBC export repository into a UTF-8 CSV spreadsheet
              </CardSubtitle>
            </div>
            <Badge variant="neutral">Pure JDBC Cursor Streaming</Badge>
          </div>
        </CardHeader>
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Preset Buttons */}
          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Quick Date Presets
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {[
                { key: 'thisMonth', label: 'This Month' },
                { key: 'lastMonth', label: 'Last Month' },
                { key: '90days', label: 'Last 90 Days' },
                { key: '6months', label: 'Last 6 Months' },
                { key: 'ytd', label: 'Year to Date' },
                { key: 'all', label: 'All History' },
              ].map((p) => (
                <Button
                  key={p.key}
                  variant={exportPreset === p.key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleApplyPreset(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date range inputs */}
          <div className="grid-2">
            <div>
              <label style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-1)' }}>
                Start Date (From)
              </label>
              <input
                type="date"
                className="input"
                value={exportFrom}
                onChange={(e) => {
                  setExportFrom(e.target.value);
                  setExportPreset('custom');
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-1)' }}>
                End Date (To)
              </label>
              <input
                type="date"
                className="input"
                value={exportTo}
                onChange={(e) => {
                  setExportTo(e.target.value);
                  setExportPreset('custom');
                }}
              />
            </div>
          </div>

          {/* File Spec & Schema Explanation */}
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-active)',
              fontSize: 'var(--font-xs)',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Generated Filename:</strong>{' '}
              <code style={{ color: 'var(--accent)', fontWeight: 600 }}>
                finpulse-transactions-{exportFrom}_{exportTo}.csv
              </code>
            </div>
            <div>
              <strong>Export Column Schema:</strong>{' '}
              <code>id, date, merchant, category, account, type, amount, notes, is_transfer</code>. Formatted with UTF-8 byte order mark (BOM) for native compatibility with Microsoft Excel, Apple Numbers, and Google Sheets.
            </div>
          </div>

          {/* Action Trigger */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button variant="primary" onClick={handleDownloadCsv}>
              <Icon name="download" size={16} />
              Download Verified CSV Export
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Reports;
