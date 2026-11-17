import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFinancialAnalytics } from '../hooks/useFinancialAnalytics';
import { budgetsApi } from '../api/budgets';
import { transactionsApi } from '../api/transactions';
import { categoriesApi } from '../api/categories';

// UI Components
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MonthPicker } from '../components/ui/MonthPicker';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Field } from '../components/ui/Field';
import { Select } from '../components/ui/Select';
import { AmountInput } from '../components/ui/AmountInput';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';

const PRESET_CATEGORIES = [
  'Housing & Rent',
  'Groceries & Essentials',
  'Dining & Takeout',
  'Transportation & Commute',
  'Utilities & Bills',
  'Healthcare & Fitness',
  'Entertainment & Leisure',
  'Shopping',
  'Education & Learning',
  'Travel & Vacation',
  'Personal Care',
  'Gifts & Donations',
  'Other Expense',
];

export function Budgets() {
  useDocumentTitle('Budgets');
  const { userId } = useAuth();
  const { formatAmount } = useCurrency();
  const toast = useToast();

  // Active month state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Data states
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(PRESET_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Form states
  const [formCategory, setFormCategory] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  // Custom hook evaluating 3-month trailing suggestions and category totals
  const analytics = useFinancialAnalytics(transactions, budgets);

  // Load Categories
  useEffect(() => {
    categoriesApi
      .list()
      .then((cats) => {
        if (Array.isArray(cats)) {
          const expenseCats = cats.filter((c) => c.type === 'EXPENSE').map((c) => c.name);
          if (expenseCats.length > 0) setAvailableCategories(expenseCats);
        }
      })
      .catch(() => {});
  }, []);

  // Load Budgets for selected month
  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await budgetsApi.getAll({ userId, month: selectedMonth });
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Unable to load budgets from core service:', err.message);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMonth]);

  // Load transactions for analytics trailing average
  const loadTransactions = useCallback(async () => {
    try {
      const data = await transactionsApi.getAll({ userId });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Unable to load transactions:', err.message);
      setTransactions([]);
    }
  }, [userId]);

  useEffect(() => {
    loadBudgets();
    loadTransactions();
  }, [loadBudgets, loadTransactions]);

  // Categories already budgeted in the current month
  const budgetedCategoryNames = useMemo(() => {
    return new Set(budgets.map((b) => b.category));
  }, [budgets]);

  // Unbudgeted categories that have incurred expense in this active month
  const unbudgetedSpending = useMemo(() => {
    const list = [];
    const catTotals = analytics.categoryTotals || {};

    for (const [cat, spent] of Object.entries(catTotals)) {
      if (spent > 0 && !budgetedCategoryNames.has(cat)) {
        list.push({ category: cat, spent });
      }
    }

    list.sort((a, b) => b.spent - a.spent);
    return list;
  }, [analytics.categoryTotals, budgetedCategoryNames]);

  // Summary figures
  const totalBudgeted = useMemo(() => {
    return budgets.reduce((sum, b) => sum + Number(b.monthlyLimit || 0), 0);
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return budgets.reduce((sum, b) => sum + Number(b.spent || 0), 0);
  }, [budgets]);

  const remainingBudget = totalBudgeted - totalSpent;
  const overallUsedPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  // Open Add modal with auto-selected unbudgeted category
  const openAddModal = (initialCat = null) => {
    const unbudgeted = availableCategories.filter((c) => !budgetedCategoryNames.has(c));
    const catToSet = initialCat || unbudgeted[0] || availableCategories[0];
    setFormCategory(catToSet);

    // One-click 3-month suggestion if available
    const suggested = analytics.suggestedLimits?.[catToSet];
    setFormLimit(suggested ? String(suggested) : '');
    setIsAddModalOpen(true);
  };

  // Open Edit modal
  const openEditModal = (budget) => {
    setEditCandidate(budget);
    setFormCategory(budget.category);
    setFormLimit(String(budget.monthlyLimit || ''));
  };

  // Handle Save Budget
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const limitNum = parseFloat(formLimit);
    if (!limitNum || limitNum <= 0) {
      toast.error('Please enter a positive monthly spending limit');
      return;
    }

    setSavingBudget(true);
    try {
      if (editCandidate) {
        await budgetsApi.update(editCandidate.id, {
          userId,
          category: formCategory,
          monthlyLimit: limitNum,
          monthYear: selectedMonth,
        });
        toast.success(`Updated budget for ${formCategory}`);
        setEditCandidate(null);
      } else {
        await budgetsApi.setBudget({
          userId,
          category: formCategory,
          monthlyLimit: limitNum,
          monthYear: selectedMonth,
        });
        toast.success(`Created budget for ${formCategory} (${formatAmount(limitNum)})`);
        setIsAddModalOpen(false);
      }

      setFormLimit('');
      loadBudgets();
    } catch (err) {
      toast.error(`Failed to save budget: ${err.message}`);
    } finally {
      setSavingBudget(false);
    }
  };

  // Handle Delete Budget
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await budgetsApi.delete(deleteCandidate.id);
      toast.success(`Deleted budget for ${deleteCandidate.category}`);
      setDeleteCandidate(null);
      loadBudgets();
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle "Copy from last month"
  const handleCopyFromLastMonth = async () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let py = y;
    let pm = m - 1;
    if (pm < 1) {
      pm = 12;
      py -= 1;
    }
    const fromMonth = `${py}-${String(pm).padStart(2, '0')}`;

    setIsCopying(true);
    try {
      const res = await budgetsApi.copy(fromMonth, selectedMonth, userId);
      const count = Array.isArray(res) ? res.length : 0;
      if (count > 0) {
        toast.success(`Copied ${count} category budget(s) from ${fromMonth} into ${selectedMonth}`);
      } else {
        toast.info(`No un-budgeted categories found to copy from ${fromMonth}`);
      }
      loadBudgets();
    } catch (err) {
      toast.error(`Copy failed: ${err.message}`);
    } finally {
      setIsCopying(false);
    }
  };

  // Status badge with explicit text (never color alone)
  const renderStatusBadge = (status, pct) => {
    if (status === 'OVER' || pct > 100) {
      return <Badge variant="expense">Over Limit ({pct}%)</Badge>;
    }
    if (status === 'WARNING' || pct >= 80) {
      return <Badge variant="warning">Warning ({pct}%)</Badge>;
    }
    return <Badge variant="income">On Track ({pct}%)</Badge>;
  };

  return (
    <div className="budgets-page">
      {/* Page Header */}
      <PageHeader
        title="Monthly Budgets"
        subtitle={`Set spending thresholds, track live category burn, and prevent budget overruns for ${selectedMonth}.`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            <Button
              variant="outline"
              icon={<Icon name="Copy" size={15} />}
              onClick={handleCopyFromLastMonth}
              loading={isCopying}
            >
              Copy Previous Month
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="Plus" size={16} />}
              onClick={() => openAddModal()}
            >
              Set Budget
            </Button>
          </div>
        }
      />

      {/* Summary Bar: Total Budgeted vs Spent vs Remaining */}
      <div className="dashboard-grid">
        <div className="col-4">
          <StatCard
            label="Total Monthly Budget"
            value={formatAmount(totalBudgeted)}
            subtitle={`Allocated across ${budgets.length} categories`}
            icon="Budgets"
          />
        </div>
        <div className="col-4">
          <StatCard
            label="Actual Month-to-Date Spend"
            value={formatAmount(totalSpent)}
            delta={`${overallUsedPct}% utilized`}
            trend={overallUsedPct > 100 ? 'negative' : overallUsedPct >= 80 ? 'neutral' : 'positive'}
            subtitle="Excluded transfers and adjustments"
            icon="Receipt"
          />
        </div>
        <div className="col-4">
          <StatCard
            label="Remaining Budget Room"
            value={formatAmount(Math.max(0, remainingBudget))}
            trend={remainingBudget < 0 ? 'negative' : 'positive'}
            subtitle={remainingBudget < 0 ? 'Total budget overrun' : 'Available for remaining days'}
            icon="Wallet"
          />
        </div>
      </div>

      {/* Unbudgeted Spending Alert Strip */}
      {unbudgetedSpending.length > 0 && (
        <div
          className="card"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-6)',
            backgroundColor: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="AlertCircle" size={16} style={{ color: 'var(--color-warning)' }} />
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                Unbudgeted Categories with Spending:
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                {unbudgetedSpending.map((u) => `${u.category} (${formatAmount(u.spent)})`).join(' • ')}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddModal(unbudgetedSpending[0].category)}
            >
              + Budget for {unbudgetedSpending[0].category}
            </Button>
          </div>
        </div>
      )}

      {/* Budget Cards List */}
      {loading ? (
        <div className="dashboard-grid">
          <div className="col-4"><SkeletonCard /></div>
          <div className="col-4"><SkeletonCard /></div>
          <div className="col-4"><SkeletonCard /></div>
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon="Budgets"
          title={`No Budgets Set for ${selectedMonth}`}
          description="Establish monthly spending thresholds to track expenses, or copy limits from the previous month."
          action={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" onClick={handleCopyFromLastMonth} loading={isCopying}>
                Copy From Previous Month
              </Button>
              <Button variant="primary" icon={<Icon name="Plus" size={16} />} onClick={() => openAddModal()}>
                Set First Category Budget
              </Button>
            </div>
          }
        />
      ) : (
        <div className="dashboard-grid">
          {budgets.map((b) => {
            const spent = Number(b.spent || 0);
            const limit = Number(b.monthlyLimit || 0);
            const remaining = limit - spent;
            const pct = b.percentUsed !== undefined ? Math.round(b.percentUsed) : limit > 0 ? Math.round((spent / limit) * 100) : 0;

            return (
              <div key={b.id || b.category} className="col-4">
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle>{b.category}</CardTitle>
                    </div>
                    {renderStatusBadge(b.status, pct)}
                  </CardHeader>

                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--font-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Spent to date:</span>
                      <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatAmount(spent)}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: 'var(--font-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Monthly Limit:</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                        {formatAmount(limit)}
                      </span>
                    </div>

                    {/* Progress bar whose width animates via CSS transition */}
                    <ProgressBar value={spent} max={limit} variant="auto" />
                  </CardBody>

                  <CardFooter>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      Remaining:{' '}
                      <strong style={{ color: remaining < 0 ? 'var(--color-expense)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatAmount(remaining)}
                      </strong>
                    </span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(b)}
                      >
                        Edit Limit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => setDeleteCandidate(b)}
                        title="Delete Budget"
                        aria-label="Delete Budget"
                      >
                        <Icon name="Trash" size={13} />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editCandidate)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditCandidate(null);
        }}
        title={editCandidate ? `Edit Budget: ${editCandidate.category}` : 'Set Monthly Category Budget'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditCandidate(null);
              }}
              disabled={savingBudget}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveBudget}
              loading={savingBudget}
            >
              {editCandidate ? 'Update Limit' : 'Save Budget'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBudget}>
          {/* Category Selector (categories already budgeted are disabled in Add mode) */}
          <Field label="Category" required>
            {editCandidate ? (
              <Input value={editCandidate.category} disabled />
            ) : (
              <Select
                value={formCategory}
                onChange={(e) => {
                  const cat = e.target.value;
                  setFormCategory(cat);
                  const suggested = analytics.suggestedLimits?.[cat];
                  if (suggested) setFormLimit(String(suggested));
                }}
              >
                {availableCategories.map((cat) => {
                  const isAlreadyBudgeted = budgetedCategoryNames.has(cat);
                  return (
                    <option key={cat} value={cat} disabled={isAlreadyBudgeted}>
                      {cat} {isAlreadyBudgeted ? '(Already Budgeted)' : ''}
                    </option>
                  );
                })}
              </Select>
            )}
          </Field>

          {/* Monthly Spending Limit Input */}
          <Field label="Monthly Spending Limit" required>
            <AmountInput
              placeholder="0.00"
              value={formLimit}
              onChange={(e) => setFormLimit(e.target.value)}
            />
          </Field>

          {/* One-click 3-Month Trailing Average Suggestion */}
          {analytics.suggestedLimits?.[formCategory] && (
            <div
              style={{
                marginTop: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--bg-surface-hover)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--font-xs)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                3-Month Avg Spend:{' '}
                <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatAmount(analytics.suggestedLimits[formCategory])}
                </strong>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormLimit(String(analytics.suggestedLimits[formCategory]))}
              >
                Apply Suggestion
              </Button>
            </div>
          )}

          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
            Applies to month: <strong>{selectedMonth}</strong>. Status alerts will flag at 80% and 100% utilization.
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Remove Category Budget"
        message={`Are you sure you want to delete the ${deleteCandidate?.category} budget for ${selectedMonth}? Your actual transaction history will not be affected.`}
        confirmText="Delete Budget"
      />
    </div>
  );
}

export default Budgets;
