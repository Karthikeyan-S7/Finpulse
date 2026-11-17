import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { accountsApi } from '../api/accounts';
import { transactionsApi } from '../api/transactions';
import { budgetsApi } from '../api/budgets';
import { recurringApi } from '../api/recurring';
import { analyticsApi } from '../api/analytics';

// UI Components
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MonthPicker } from '../components/ui/MonthPicker';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';

// Chart Components (Chunk 6)
import { BarChart } from '../components/charts/BarChart';
import { DonutChart } from '../components/charts/DonutChart';

// Modals
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { TransferModal } from '../components/transactions/TransferModal';

export function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user, userId } = useAuth();
  const { formatAmount } = useCurrency();
  const toast = useToast();

  // Active month state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Data states
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [cashflow, setCashflow] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [overview, setOverview] = useState(null);

  // Loading and individual error states
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [loadingRecurring, setLoadingRecurring] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsOffline, setAnalyticsOffline] = useState(false);

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [payingBillId, setPayingBillId] = useState(null);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // 1. Fetch Accounts
  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await accountsApi.getAll(userId);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load accounts:', err.message);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }, [userId]);

  // 2. Fetch Transactions (for selected month and recent)
  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const data = await transactionsApi.getAll({ userId });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load transactions:', err.message);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [userId]);

  // 3. Fetch Budgets
  const loadBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const data = await budgetsApi.getAll({ userId, month: selectedMonth });
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load budgets:', err.message);
      setBudgets([]);
    } finally {
      setLoadingBudgets(false);
    }
  }, [userId, selectedMonth]);

  // 4. Fetch Recurring Payments
  const loadRecurring = useCallback(async () => {
    setLoadingRecurring(true);
    try {
      const data = await recurringApi.getAll(userId);
      setRecurring(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load recurring:', err.message);
      setRecurring([]);
    } finally {
      setLoadingRecurring(false);
    }
  }, [userId]);

  // 5. Fetch Analytics (Overview, Cashflow, Category Breakdown)
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setAnalyticsOffline(false);

    try {
      const [ovRes, cfRes, cbRes] = await Promise.allSettled([
        analyticsApi.getOverview({ userId, month: selectedMonth }),
        analyticsApi.getCashflow({ userId, months: 6 }),
        analyticsApi.getCategoryBreakdown({ userId, month: selectedMonth }),
      ]);

      if (ovRes.status === 'fulfilled' && ovRes.value) {
        setOverview(ovRes.value);
      } else {
        setOverview(null);
        setAnalyticsOffline(true);
      }

      if (cfRes.status === 'fulfilled' && Array.isArray(cfRes.value)) {
        setCashflow(cfRes.value);
      } else {
        setCashflow([]);
      }

      if (cbRes.status === 'fulfilled' && Array.isArray(cbRes.value)) {
        setCategoryBreakdown(cbRes.value);
      } else {
        setCategoryBreakdown([]);
      }
    } catch {
      setAnalyticsOffline(true);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [userId, selectedMonth]);

  // Refresh all widgets
  const refreshAll = useCallback(() => {
    loadAccounts();
    loadTransactions();
    loadBudgets();
    loadRecurring();
    loadAnalytics();
  }, [loadAccounts, loadTransactions, loadBudgets, loadRecurring, loadAnalytics]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle Mark Paid action on upcoming recurring bill
  const handleMarkPaid = async (bill) => {
    setPayingBillId(bill.id);
    try {
      await recurringApi.pay(bill.id);
      toast.success(`Marked bill "${bill.name}" as paid. Ledger & balance updated.`);
      refreshAll();
    } catch (err) {
      toast.error(`Failed to record bill payment: ${err.message}`);
    } finally {
      setPayingBillId(null);
    }
  };

  // --- Computed Metrics ---
  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isArchived), [accounts]);

  // Total Net worth = sum of active balances
  const netWorth = useMemo(() => {
    if (overview?.netWorth !== undefined) return Number(overview.netWorth);
    return activeAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  }, [overview, activeAccounts]);

  // Month-filtered transactions (excluding transfers and opening balances)
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.isTransfer || t.category === 'Opening Balance') return false;
      return t.transactionDate && t.transactionDate.startsWith(selectedMonth);
    });
  }, [transactions, selectedMonth]);

  // Prior month calculation for delta comparisons
  const priorMonthStr = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let py = y;
    let pm = m - 1;
    if (pm < 1) {
      pm = 12;
      py -= 1;
    }
    return `${py}-${String(pm).padStart(2, '0')}`;
  }, [selectedMonth]);

  const priorMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.isTransfer || t.category === 'Opening Balance') return false;
      return t.transactionDate && t.transactionDate.startsWith(priorMonthStr);
    });
  }, [transactions, priorMonthStr]);

  // Income for selected month & delta vs prior
  const monthIncome = useMemo(() => {
    if (overview?.income !== undefined) return Number(overview.income);
    return monthTransactions
      .filter((t) => t.transactionType === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [overview, monthTransactions]);

  const priorIncome = useMemo(() => {
    if (overview?.previousIncome !== undefined) return Number(overview.previousIncome);
    return priorMonthTransactions
      .filter((t) => t.transactionType === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [overview, priorMonthTransactions]);

  const incomeDelta = useMemo(() => {
    if (priorIncome <= 0) return null;
    const pct = Math.round(((monthIncome - priorIncome) / priorIncome) * 100);
    return pct >= 0 ? `+${pct}% vs last mo` : `${pct}% vs last mo`;
  }, [monthIncome, priorIncome]);

  // Expenses for selected month & delta vs prior
  const monthExpenses = useMemo(() => {
    if (overview?.expenses !== undefined) return Number(overview.expenses);
    return monthTransactions
      .filter((t) => t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [overview, monthTransactions]);

  const priorExpenses = useMemo(() => {
    if (overview?.previousExpenses !== undefined) return Number(overview.previousExpenses);
    return priorMonthTransactions
      .filter((t) => t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [overview, priorMonthTransactions]);

  const expenseDelta = useMemo(() => {
    if (priorExpenses <= 0) return null;
    const pct = Math.round(((monthExpenses - priorExpenses) / priorExpenses) * 100);
    return pct >= 0 ? `+${pct}% vs last mo` : `${pct}% vs last mo`;
  }, [monthExpenses, priorExpenses]);

  // Savings rate
  const savingsRate = useMemo(() => {
    if (overview?.savingsRate !== undefined) return Math.round(overview.savingsRate);
    if (monthIncome <= 0) return 0;
    const rate = Math.round(((monthIncome - monthExpenses) / monthIncome) * 100);
    return Math.max(-100, Math.min(100, rate));
  }, [overview, monthIncome, monthExpenses]);

  // Recent 8 transactions for Table
  const recentTransactions = useMemo(() => {
    const list = [...transactions].filter((t) => !t.isTransfer && t.category !== 'Opening Balance');
    list.sort((a, b) => (b.transactionDate || '').localeCompare(a.transactionDate || ''));
    return list.slice(0, 8);
  }, [transactions]);

  // Top 3 Budgets at Risk (sorted by percentUsed descending)
  const budgetsAtRisk = useMemo(() => {
    const list = [...budgets].map((b) => {
      const spent = Number(b.spent || 0);
      const limit = Number(b.monthlyLimit || 0);
      const pct = b.percentUsed !== undefined ? Math.round(b.percentUsed) : limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return { ...b, spent, limit, pct };
    });
    list.sort((a, b) => b.pct - a.pct);
    return list.slice(0, 3);
  }, [budgets]);

  // Next 5 upcoming recurring bills due
  const upcomingBills = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const activeList = recurring.filter((r) => r.isActive && r.nextDueDate);
    activeList.sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''));

    return activeList.slice(0, 5).map((bill) => {
      const due = new Date(bill.nextDueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due - now) / (1000 * 60 * 60 * 24));

      let dueText = '';
      let badgeVariant = 'neutral';

      if (diffDays < 0) {
        dueText = `${Math.abs(diffDays)}d overdue`;
        badgeVariant = 'danger';
      } else if (diffDays === 0) {
        dueText = 'Due today';
        badgeVariant = 'warning';
      } else if (diffDays === 1) {
        dueText = 'Due tomorrow';
        badgeVariant = 'warning';
      } else {
        dueText = `Due in ${diffDays}d`;
        badgeVariant = 'info';
      }

      return { ...bill, diffDays, dueText, badgeVariant };
    });
  }, [recurring]);

  // Donut data for selected month
  const categoryChartData = useMemo(() => {
    if (categoryBreakdown.length > 0) {
      return categoryBreakdown.map((c) => ({
        name: c.category,
        amount: Number(c.totalAmount || c.amount || 0),
      }));
    }

    // Fallback compute directly from monthTransactions
    const catMap = {};
    monthTransactions
      .filter((t) => t.transactionType === 'EXPENSE')
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount || 0);
      });

    return Object.keys(catMap).map((k) => ({ name: k, amount: catMap[k] }));
  }, [categoryBreakdown, monthTransactions]);

  // Empty state check for brand-new users with zero accounts
  if (!loadingAccounts && accounts.length === 0) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title={`${greeting}, ${user?.fullName || 'User'}`}
          subtitle="Get started by connecting your bank account, savings, or credit card."
        />
        <EmptyState
          icon="Accounts"
          title="No Financial Accounts Connected"
          description="FinPulse requires at least one active financial account to track your net worth, expenses, and cashflow."
          action={
            <Link to="/accounts">
              <Button variant="primary" icon={<Icon name="Plus" size={16} />}>
                Connect Your First Account
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader
        title={`${greeting}, ${user?.fullName || 'User'}`}
        subtitle={`Real-time financial status and cashflow velocity for ${selectedMonth}.`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            <Button
              variant="outline"
              icon={<Icon name="Refresh" size={15} />}
              onClick={() => setIsTransferOpen(true)}
            >
              Transfer
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="Plus" size={16} />}
              onClick={() => setIsAddTxOpen(true)}
            >
              Add Transaction
            </Button>
          </div>
        }
      />

      {/* Insights Strip (from /api/analytics/overview) */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        {analyticsOffline ? (
          <div
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--font-xs)',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="AlertCircle" size={14} />
              <span>Analytics microservice currently offline. Account ledgers and budgets are running normally.</span>
            </div>
            <Button variant="ghost" size="sm" onClick={loadAnalytics}>
              Retry Analytics
            </Button>
          </div>
        ) : overview ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {/* Insight 1: Spending Spikes */}
            <Link
              to="/reports?section=spending-spikes"
              style={{ textDecoration: 'none' }}
              title="View spending spike analysis in Reports"
            >
              <div
                className="card"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    color: overview.topSpikes?.length > 0 ? 'var(--color-expense)' : 'var(--color-income)',
                    backgroundColor: overview.topSpikes?.length > 0 ? 'var(--color-expense-subtle)' : 'var(--color-income-subtle)',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                  }}
                >
                  <Icon name="trendUp" size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Spending Spike Analysis
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {overview.topSpikes?.length > 0
                      ? `${overview.topSpikes[0].category} spend spiked +${Math.round(overview.topSpikes[0].changePercent)}% vs average`
                      : 'All categories within normal 3-month trailing bounds'}
                  </div>
                </div>
                <Icon name="chevronRight" size={14} />
              </div>
            </Link>

            {/* Insight 2: Unused Budgets */}
            <Link
              to="/reports?section=unused-budgets"
              style={{ textDecoration: 'none' }}
              title="View unused budgets in Reports"
            >
              <div
                className="card"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    color: 'var(--color-income)',
                    backgroundColor: 'var(--color-income-subtle)',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                  }}
                >
                  <Icon name="check" size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Zero-Burn Budgets
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {overview.unusedBudgetsCount > 0
                      ? `${overview.unusedBudgetsCount} budgeted categories have recorded ₹0 expense`
                      : 'All active budgets have recorded spending activity'}
                  </div>
                </div>
                <Icon name="chevronRight" size={14} />
              </div>
            </Link>

            {/* Insight 3: Recurring Merchants */}
            <Link
              to="/reports?section=recurring-merchants"
              style={{ textDecoration: 'none' }}
              title="View recurring merchants in Reports"
            >
              <div
                className="card"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    color: 'var(--color-info)',
                    backgroundColor: 'var(--color-info-subtle)',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                  }}
                >
                  <Icon name="repeat" size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Repeat Vendors
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {overview.recurringMerchantsCount > 0
                      ? `${overview.recurringMerchantsCount} repeat merchants charged across consecutive months`
                      : 'No repeat merchants identified this cycle'}
                  </div>
                </div>
                <Icon name="chevronRight" size={14} />
              </div>
            </Link>
          </div>
        ) : null}
      </div>

      {/* Row 1: 4 StatCards */}
      <div className="dashboard-grid">
        <div className="col-3">
          {loadingAccounts ? (
            <SkeletonCard />
          ) : (
            <StatCard
              label="Total Net Worth"
              value={formatAmount(netWorth)}
              trend={netWorth >= 0 ? 'positive' : 'negative'}
              subtitle={`${activeAccounts.length} active non-archived accounts`}
              icon="Accounts"
            />
          )}
        </div>

        <div className="col-3">
          {loadingTransactions ? (
            <SkeletonCard />
          ) : (
            <StatCard
              label="Monthly Income"
              value={formatAmount(monthIncome)}
              delta={incomeDelta}
              trend={monthIncome >= priorIncome ? 'positive' : 'neutral'}
              subtitle={`${selectedMonth} total earnings`}
              icon="TrendingUp"
            />
          )}
        </div>

        <div className="col-3">
          {loadingTransactions ? (
            <SkeletonCard />
          ) : (
            <StatCard
              label="Monthly Expenses"
              value={formatAmount(monthExpenses)}
              delta={expenseDelta}
              trend={monthExpenses > priorExpenses ? 'negative' : 'positive'}
              subtitle={`${selectedMonth} living spend`}
              icon="TrendingDown"
            />
          )}
        </div>

        <div className="col-3">
          {loadingTransactions ? (
            <SkeletonCard />
          ) : (
            <StatCard
              label="Savings Rate"
              value={`${savingsRate}%`}
              trend={savingsRate >= 20 ? 'positive' : savingsRate >= 0 ? 'neutral' : 'negative'}
              subtitle={savingsRate >= 0 ? 'Net positive cash retention' : 'Expenses exceed income'}
              icon="Wallet"
            />
          )}
        </div>
      </div>

      {/* Row 2: Cashflow BarChart (span 8) + Category DonutChart (span 4) */}
      <div className="dashboard-grid">
        <div className="col-8">
          <Card style={{ height: '100%' }}>
            <CardHeader>
              <div>
                <CardTitle>Cashflow Trajectory</CardTitle>
                <CardSubtitle>6-Month Income vs Expenses with Net Marker (Pure Canvas 2D)</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody>
              {loadingAnalytics ? (
                <SkeletonCard style={{ height: '240px' }} />
              ) : (
                <BarChart
                  data={cashflow}
                  height={240}
                  emptyMessage="No cashflow history available yet."
                />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="col-4">
          <Card style={{ height: '100%' }}>
            <CardHeader>
              <div>
                <CardTitle>Category Spend</CardTitle>
                <CardSubtitle>{selectedMonth} Expenditure Breakdown</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody>
              {loadingAnalytics ? (
                <SkeletonCard style={{ height: '240px' }} />
              ) : (
                <DonutChart
                  data={categoryChartData}
                  height={240}
                  emptyMessage={`No expenses recorded for ${selectedMonth}`}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Row 3: Recent Transactions (span 7) + Stacked Column (span 5) */}
      <div className="dashboard-grid">
        {/* Recent Transactions (span 7) */}
        <div className="col-7">
          <Card style={{ height: '100%' }}>
            <CardHeader>
              <div>
                <CardTitle>Recent Ledger Transactions</CardTitle>
                <CardSubtitle>Last 8 posted debits and credits</CardSubtitle>
              </div>
              <Link to="/transactions">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>

            <div style={{ flex: 1, overflowX: 'auto' }}>
              {loadingTransactions ? (
                <div style={{ padding: 'var(--space-4)' }}>
                  <SkeletonTable rows={5} cols={4} />
                </div>
              ) : recentTransactions.length === 0 ? (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No transactions recorded yet.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Date</th>
                      <th>Payee / Description</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => {
                      const isIncome = tx.transactionType === 'INCOME';
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            {tx.transactionDate}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                              {tx.merchant || tx.description || 'Transaction'}
                            </div>
                            {tx.accountName && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {tx.accountName}
                              </div>
                            )}
                          </td>
                          <td>
                            <Badge variant="neutral">{tx.category}</Badge>
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                              color: isIncome ? 'var(--color-income-text)' : 'var(--text-primary)',
                            }}
                          >
                            {isIncome ? `+${formatAmount(tx.amount)}` : `-${formatAmount(tx.amount)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Stacked Column (span 5): Budgets at Risk + Upcoming Bills */}
        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Budgets at Risk Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Budgets at Risk</CardTitle>
                <CardSubtitle>Top utilized categories for {selectedMonth}</CardSubtitle>
              </div>
              <Link to="/budgets">
                <Button variant="ghost" size="sm">
                  Budgets
                </Button>
              </Link>
            </CardHeader>

            <CardBody>
              {loadingBudgets ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SkeletonCard style={{ height: '48px' }} />
                  <SkeletonCard style={{ height: '48px' }} />
                </div>
              ) : budgetsAtRisk.length === 0 ? (
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No active budgets defined for {selectedMonth}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {budgetsAtRisk.map((b) => (
                    <div key={b.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: 'var(--font-xs)' }}>
                        <span style={{ fontWeight: 600 }}>{b.category}</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', color: b.pct > 100 ? 'var(--color-expense)' : 'var(--text-secondary)' }}>
                          {formatAmount(b.spent)} of {formatAmount(b.limit)} ({b.pct}%)
                        </span>
                      </div>
                      <ProgressBar value={b.spent} max={b.limit} variant="auto" />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Upcoming Bills Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Upcoming Bills</CardTitle>
                <CardSubtitle>Next scheduled recurring obligations</CardSubtitle>
              </div>
              <Link to="/recurring">
                <Button variant="ghost" size="sm">
                  Recurring
                </Button>
              </Link>
            </CardHeader>

            <CardBody>
              {loadingRecurring ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SkeletonCard style={{ height: '48px' }} />
                  <SkeletonCard style={{ height: '48px' }} />
                </div>
              ) : upcomingBills.length === 0 ? (
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No upcoming recurring bills due.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {upcomingBills.map((bill) => (
                    <div
                      key={bill.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-hover)',
                        gap: '8px',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-xs)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {bill.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{bill.nextDueDate}</span>
                          <Badge variant={bill.badgeVariant} style={{ fontSize: '10px', padding: '1px 5px' }}>
                            {bill.dueText}
                          </Badge>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-xs)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatAmount(bill.amount)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(bill)}
                          loading={payingBillId === bill.id}
                          style={{ padding: '2px 8px', height: '26px', fontSize: '11px' }}
                        >
                          Mark Paid
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddTxOpen && (
        <TransactionFormModal
          isOpen={isAddTxOpen}
          onClose={() => setIsAddTxOpen(false)}
          onSuccess={refreshAll}
          accounts={accounts}
        />
      )}

      {/* Transfer Funds Modal */}
      {isTransferOpen && (
        <TransferModal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          onSuccess={refreshAll}
          accounts={accounts}
        />
      )}
    </div>
  );
}

export default Dashboard;
