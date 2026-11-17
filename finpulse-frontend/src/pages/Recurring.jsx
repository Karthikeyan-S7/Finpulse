import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { recurringApi } from '../api/recurring';
import { accountsApi } from '../api/accounts';
import { categoriesApi } from '../api/categories';

// UI Components
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AmountInput } from '../components/ui/AmountInput';
import { DateInput } from '../components/ui/DateInput';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonTable } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Icon } from '../components/ui/Icon';

const FREQUENCY_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly (Every 7 days)' },
  { value: 'MONTHLY', label: 'Monthly (Every month)' },
  { value: 'YEARLY', label: 'Yearly (Annual)' },
];

const PRESET_CATEGORIES = [
  'Housing & Rent',
  'Utilities & Bills',
  'Groceries & Essentials',
  'Dining & Takeout',
  'Transportation & Commute',
  'Healthcare & Fitness',
  'Entertainment & Leisure',
  'Shopping',
  'Education & Learning',
  'Travel & Vacation',
  'Personal Care',
  'Gifts & Donations',
  'Financial Services',
  'Other Expense',
];

function calculateDueStatus(nextDueDate, isActive) {
  if (!isActive) {
    return { label: 'Paused', variant: 'neutral', isDue: false };
  }
  if (!nextDueDate) {
    return { label: 'Active', variant: 'success', isDue: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = nextDueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Overdue (${Math.abs(diffDays)}d)`, variant: 'danger', isDue: true, days: diffDays };
  }
  if (diffDays === 0) {
    return { label: 'Due Today', variant: 'warning', isDue: true, days: 0 };
  }
  if (diffDays === 1) {
    return { label: 'Due Tomorrow', variant: 'warning', isDue: true, days: 1 };
  }
  if (diffDays <= 7) {
    return { label: `Due in ${diffDays}d`, variant: 'info', isDue: true, days: diffDays };
  }
  return { label: `In ${diffDays}d`, variant: 'neutral', isDue: false, days: diffDays };
}

export function Recurring() {
  useDocumentTitle('Recurring Payments & Subscriptions');
  const { userId } = useAuth();
  const { formatAmount } = useCurrency();
  const toast = useToast();

  const [recurringList, setRecurringList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState(PRESET_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    merchant: '',
    category: 'Utilities & Bills',
    amount: '',
    frequency: 'MONTHLY',
    nextDueDate: new Date().toISOString().split('T')[0],
    accountId: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action busy states for individual items
  const [actionBusyId, setActionBusyId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recData, accData, catData] = await Promise.allSettled([
        recurringApi.getAll(userId),
        accountsApi.getAll(userId, { includeArchived: false }),
        categoriesApi.list(),
      ]);

      if (recData.status === 'fulfilled') {
        // Sort by nextDueDate ascending
        const sorted = (recData.value || []).slice().sort((a, b) => {
          if (!a.nextDueDate) return 1;
          if (!b.nextDueDate) return -1;
          return a.nextDueDate.localeCompare(b.nextDueDate);
        });
        setRecurringList(sorted);
      } else {
        throw recData.reason;
      }

      if (accData.status === 'fulfilled') {
        const nonArchived = (accData.value || []).filter((a) => !a.isArchived);
        setAccounts(nonArchived);
      }

      if (catData.status === 'fulfilled' && Array.isArray(catData.value) && catData.value.length > 0) {
        setCategories(catData.value.map((c) => c.name || c));
      }
    } catch (err) {
      console.error('Failed to load recurring data:', err);
      setError(err.message || 'Unable to load recurring payments from server');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived statistics
  const stats = useMemo(() => {
    let monthlyTotal = 0;
    let activeCount = 0;
    let upcoming7DaysCount = 0;
    let overdueCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    recurringList.forEach((item) => {
      if (!item.isActive) return;
      activeCount += 1;

      const amt = Number(item.amount || 0);
      if (item.frequency === 'WEEKLY') {
        monthlyTotal += (amt * 52) / 12;
      } else if (item.frequency === 'YEARLY') {
        monthlyTotal += amt / 12;
      } else {
        // MONTHLY or default
        monthlyTotal += amt;
      }

      if (item.nextDueDate) {
        const [y, m, d] = item.nextDueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) overdueCount += 1;
        else if (diffDays <= 7) upcoming7DaysCount += 1;
      }
    });

    const annualTotal = monthlyTotal * 12;

    return {
      monthlyTotal,
      annualTotal,
      activeCount,
      totalCount: recurringList.length,
      upcoming7DaysCount,
      overdueCount,
    };
  }, [recurringList]);

  // Handle Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      merchant: '',
      category: categories[0] || 'Utilities & Bills',
      amount: '',
      frequency: 'MONTHLY',
      nextDueDate: new Date().toISOString().split('T')[0],
      accountId: accounts[0]?.id ? String(accounts[0].id) : '',
      isActive: true,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      merchant: item.merchant || '',
      category: item.category || categories[0] || 'Utilities & Bills',
      amount: String(item.amount || ''),
      frequency: item.frequency || 'MONTHLY',
      nextDueDate: item.nextDueDate || new Date().toISOString().split('T')[0],
      accountId: item.accountId ? String(item.accountId) : (accounts[0]?.id ? String(accounts[0].id) : ''),
      isActive: item.isActive !== false,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Commitment name is required';
    }
    const numAmount = Number(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0';
    }
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    if (!formData.frequency) {
      errors.frequency = 'Frequency is required';
    }
    if (!formData.nextDueDate) {
      errors.nextDueDate = 'Next due date is required';
    }
    if (!formData.accountId) {
      errors.accountId = 'Please select an account for payment';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit create or edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      const payload = {
        userId,
        accountId: Number(formData.accountId),
        name: formData.name.trim(),
        merchant: formData.merchant?.trim() || null,
        category: formData.category,
        amount: Number(formData.amount),
        frequency: formData.frequency,
        nextDueDate: formData.nextDueDate,
        isActive: formData.isActive,
      };

      if (editingItem) {
        await recurringApi.update(editingItem.id, payload);
        toast.success(`Updated "${payload.name}" recurring commitment`);
      } else {
        await recurringApi.create(payload);
        toast.success(`Added "${payload.name}" to scheduled commitments`);
      }

      setIsFormModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to save recurring commitment:', err);
      toast.error(err.message || 'Failed to save recurring commitment');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle active / paused
  const handleToggleActive = async (item) => {
    setActionBusyId(item.id);
    try {
      const targetState = !item.isActive;
      await recurringApi.toggleActive(item.id, targetState);
      toast.info(targetState ? `Resumed "${item.name}"` : `Paused "${item.name}"`);
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      toast.error(err.message || 'Failed to update commitment status');
    } finally {
      setActionBusyId(null);
    }
  };

  // Mark Paid
  const handleMarkPaid = async (item) => {
    setActionBusyId(item.id);
    try {
      const res = await recurringApi.pay(item.id);
      toast.success(
        `Recorded payment of ${formatAmount(item.amount)} for "${item.name}". Next scheduled date: ${item.frequency === 'WEEKLY' ? 'in 7 days' : 'next cycle'}`
      );
      await fetchData();
    } catch (err) {
      console.error('Failed to mark recurring payment as paid:', err);
      toast.error(err.message || 'Failed to process payment');
    } finally {
      setActionBusyId(null);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await recurringApi.delete(deleteTarget.id);
      toast.success(`Removed "${deleteTarget.name}" from recurring schedule`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete recurring payment:', err);
      toast.error(err.message || 'Failed to remove recurring payment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Recurring Commitments"
        subtitle="Manage regular subscriptions, utility bills, rent, and recurring financial outflows."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            <Icon name="plus" size={16} />
            Add Recurring
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          label="Monthly Commitment"
          value={formatAmount(stats.monthlyTotal)}
          subtext={`Normalized across ${stats.activeCount} active subscriptions`}
          variant="default"
          icon="calendar"
        />
        <StatCard
          label="Annual Run Rate"
          value={formatAmount(stats.annualTotal)}
          subtext="Projected 12-month commitment"
          variant="info"
          icon="chart"
        />
        <StatCard
          label="Due in Next 7 Days"
          value={stats.upcoming7DaysCount}
          subtext={stats.overdueCount > 0 ? `${stats.overdueCount} bill(s) overdue` : 'All bills on track'}
          variant={stats.overdueCount > 0 ? 'danger' : stats.upcoming7DaysCount > 0 ? 'warning' : 'success'}
          icon="clock"
        />
        <StatCard
          label="Subscription Coverage"
          value={`${stats.activeCount} / ${stats.totalCount}`}
          subtext={`${stats.totalCount - stats.activeCount} currently paused`}
          variant="neutral"
          icon="creditCard"
        />
      </div>

      {/* Content Area */}
      {loading ? (
        <Card>
          <CardBody>
            <SkeletonTable rows={5} columns={7} />
          </CardBody>
        </Card>
      ) : error ? (
        <ErrorState
          title="Unable to load recurring payments"
          message={error}
          onRetry={fetchData}
        />
      ) : recurringList.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="calendar"
              title="No recurring payments scheduled"
              description="Keep track of recurring bills, streaming services, gym memberships, and rent to automate your cash flow projections."
              action={
                <Button variant="primary" onClick={handleOpenCreate}>
                  <Icon name="plus" size={16} />
                  Add First Commitment
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Payments ({recurringList.length})</CardTitle>
            <CardSubtitle>Ordered chronologically by upcoming due date</CardSubtitle>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {/* Desktop / Tablet Table View */}
            <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Commitment</th>
                    <th>Category</th>
                    <th>Account</th>
                    <th>Frequency</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Next Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: 'var(--space-3)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringList.map((item) => {
                    const dueStatus = calculateDueStatus(item.nextDueDate, item.isActive);
                    const isBusy = actionBusyId === item.id;
                    const accountObj = accounts.find((a) => a.id === item.accountId);
                    const accountName = item.accountName || accountObj?.name || 'Account';

                    return (
                      <tr key={item.id} style={{ opacity: item.isActive ? 1 : 0.65 }}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                              {item.name}
                            </span>
                            {item.merchant && (
                              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                                {item.merchant}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge variant="neutral">{item.category}</Badge>
                        </td>
                        <td>
                          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                            {accountName}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 'var(--font-xs)', textTransform: 'capitalize', fontWeight: 'var(--weight-medium)' }}>
                            {item.frequency?.toLowerCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className="font-tabular"
                            style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}
                          >
                            {formatAmount(item.amount)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="font-tabular" style={{ fontSize: 'var(--font-sm)' }}>
                              {item.nextDueDate || '—'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <Badge variant={dueStatus.variant}>{dueStatus.label}</Badge>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {item.isActive && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleMarkPaid(item)}
                                disabled={isBusy}
                                title="Record payment now and advance schedule"
                              >
                                <Icon name="check" size={13} />
                                Pay
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(item)}
                              disabled={isBusy}
                              title={item.isActive ? 'Pause recurring schedule' : 'Resume recurring schedule'}
                              style={{ padding: '0 6px' }}
                            >
                              <Icon name={item.isActive ? 'clock' : 'play'} size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              disabled={isBusy}
                              title="Edit commitment"
                              style={{ padding: '0 6px' }}
                            >
                              <Icon name="pencil" size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(item)}
                              disabled={isBusy}
                              title="Delete commitment"
                              style={{ color: 'var(--color-danger)', padding: '0 6px' }}
                            >
                              <Icon name="trash" size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Add / Edit Commitment Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => !formSubmitting && setIsFormModalOpen(false)}
        title={editingItem ? 'Edit Recurring Commitment' : 'Add Recurring Commitment'}
        description="Schedule automated expense tracking for subscriptions, bills, and regular obligations."
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitForm}
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Commitment'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Field label="Commitment Name" error={formErrors.name} required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Fiber Internet, Netflix Premium, Apartment Rent"
              autoFocus
            />
          </Field>

          <div className="grid-2">
            <Field label="Merchant / Biller" error={formErrors.merchant}>
              <Input
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                placeholder="e.g. Airtel, Netflix India, Landlord"
              />
            </Field>

            <Field label="Category" error={formErrors.category} required>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid-2">
            <Field label="Amount" error={formErrors.amount} required>
              <AmountInput
                value={formData.amount}
                onChange={(val) => setFormData({ ...formData, amount: val })}
                placeholder="0.00"
              />
            </Field>

            <Field label="Billing Frequency" error={formErrors.frequency} required>
              <Select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid-2">
            <Field label="Next Due Date" error={formErrors.nextDueDate} required>
              <DateInput
                value={formData.nextDueDate}
                onChange={(val) => setFormData({ ...formData, nextDueDate: val })}
              />
            </Field>

            <Field label="Paid From Account" error={formErrors.accountId} required>
              <Select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              >
                {accounts.length === 0 ? (
                  <option value="" disabled>No accounts available</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountType})
                    </option>
                  ))
                )}
              </Select>
            </Field>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This will stop tracking this recurring schedule. Any past transactions already recorded in your ledger will remain untouched."
        confirmText={isDeleting ? 'Deleting...' : 'Delete Commitment'}
        variant="danger"
      />
    </div>
  );
}

export default Recurring;
