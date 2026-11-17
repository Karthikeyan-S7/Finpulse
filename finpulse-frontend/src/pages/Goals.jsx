import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { goalsApi } from '../api/goals';

// UI Components
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { AmountInput } from '../components/ui/AmountInput';
import { DateInput } from '../components/ui/DateInput';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Icon } from '../components/ui/Icon';

export function Goals() {
  useDocumentTitle('Savings Goals');
  const { userId } = useAuth();
  const { formatAmount } = useCurrency();
  const toast = useToast();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create / Edit modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    savedAmount: '',
    targetDate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Contribute ("Add Money") modal
  const [contributeTarget, setContributeTarget] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeError, setContributeError] = useState(null);
  const [isContributing, setIsContributing] = useState(false);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await goalsApi.getAll(userId);
      setGoals(data || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setError(err.message || 'Unable to load savings goals');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Derived statistics
  const stats = useMemo(() => {
    let totalTarget = 0;
    let totalSaved = 0;
    let completedCount = 0;

    goals.forEach((g) => {
      const target = Number(g.targetAmount || 0);
      const saved = Number(g.savedAmount || 0);
      totalTarget += target;
      totalSaved += saved;
      if (saved >= target && target > 0) {
        completedCount += 1;
      }
    });

    const activeCount = goals.length - completedCount;
    const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    return {
      totalTarget,
      totalSaved,
      completedCount,
      activeCount,
      progressPercent,
      totalGoals: goals.length,
    };
  }, [goals]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      savedAmount: '0.00',
      targetDate: '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name || '',
      targetAmount: String(goal.targetAmount || ''),
      savedAmount: String(goal.savedAmount || '0.00'),
      targetDate: goal.targetDate || '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Goal name is required';
    }
    const numTarget = Number(formData.targetAmount);
    if (!formData.targetAmount || isNaN(numTarget) || numTarget <= 0) {
      errors.targetAmount = 'Target amount must be at least 1.00';
    }
    const numSaved = Number(formData.savedAmount || 0);
    if (isNaN(numSaved) || numSaved < 0) {
      errors.savedAmount = 'Saved amount cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission (create / update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      const payload = {
        userId,
        name: formData.name.trim(),
        targetAmount: Number(formData.targetAmount),
        savedAmount: formData.savedAmount ? Number(formData.savedAmount) : 0,
        targetDate: formData.targetDate ? formData.targetDate : null,
      };

      if (editingGoal) {
        await goalsApi.update(editingGoal.id, payload);
        toast.success(`Updated savings goal "${payload.name}"`);
      } else {
        await goalsApi.create(payload);
        toast.success(`Created savings goal "${payload.name}"`);
      }

      setIsFormModalOpen(false);
      await fetchGoals();
    } catch (err) {
      console.error('Failed to save savings goal:', err);
      toast.error(err.message || 'Failed to save savings goal');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle open contribute modal
  const handleOpenContribute = (goal) => {
    setContributeTarget(goal);
    setContributeAmount('');
    setContributeError(null);
  };

  // Submit contribution
  const handleSubmitContribute = async (e) => {
    e.preventDefault();
    const numAmount = Number(contributeAmount);
    if (!contributeAmount || isNaN(numAmount) || numAmount <= 0) {
      setContributeError('Please enter a contribution amount greater than 0');
      return;
    }

    setIsContributing(true);
    try {
      const updated = await goalsApi.contribute(contributeTarget.id, numAmount);
      const isNowCompleted = updated.percentComplete >= 100;
      if (isNowCompleted) {
        toast.success(`🎉 Congratulations! You reached your goal for "${updated.name}"!`);
      } else {
        toast.success(`Added ${formatAmount(numAmount)} to "${updated.name}"`);
      }
      setContributeTarget(null);
      await fetchGoals();
    } catch (err) {
      console.error('Failed to contribute to goal:', err);
      setContributeError(err.message || 'Failed to deposit contribution');
    } finally {
      setIsContributing(false);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await goalsApi.delete(deleteTarget.id);
      toast.success(`Removed goal "${deleteTarget.name}"`);
      setDeleteTarget(null);
      await fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
      toast.error(err.message || 'Failed to remove savings goal');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Savings Goals"
        subtitle="Track targeted savings funds, monitor completion deadlines, and deposit incremental allocations."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            <Icon name="plus" size={16} />
            Create Goal
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          label="Total Saved"
          value={formatAmount(stats.totalSaved)}
          subtext={`Across ${stats.totalGoals} active and achieved goals`}
          variant="success"
          icon="wallet"
        />
        <StatCard
          label="Aggregate Target"
          value={formatAmount(stats.totalTarget)}
          subtext={`Remaining: ${formatAmount(Math.max(0, stats.totalTarget - stats.totalSaved))}`}
          variant="default"
          icon="target"
        />
        <StatCard
          label="Overall Progress"
          value={`${stats.progressPercent}%`}
          subtext={`${stats.completedCount} of ${stats.totalGoals} goals achieved`}
          variant={stats.progressPercent >= 75 ? 'success' : stats.progressPercent >= 40 ? 'info' : 'default'}
          icon="chart"
        />
        <StatCard
          label="Active Funds"
          value={stats.activeCount}
          subtext={stats.completedCount > 0 ? `${stats.completedCount} goals 100% funded` : 'In progress'}
          variant="neutral"
          icon="trendUp"
        />
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load savings goals"
          message={error}
          onRetry={fetchGoals}
        />
      ) : goals.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="target"
              title="No savings goals created"
              description="Define financial milestones such as emergency reserves, travel adventures, home down payments, or equipment purchases."
              action={
                <Button variant="primary" onClick={handleOpenCreate}>
                  <Icon name="plus" size={16} />
                  Create First Goal
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid-3" style={{ gap: 'var(--space-4)' }}>
          {goals.map((goal) => {
            const target = Number(goal.targetAmount || 0);
            const saved = Number(goal.savedAmount || 0);
            const percent = goal.percentComplete != null ? goal.percentComplete : (target > 0 ? Math.round((saved / target) * 100) : 0);
            const isCompleted = percent >= 100;
            const remaining = Math.max(0, target - saved);
            const requiredMonthly = goal.requiredMonthly != null ? Number(goal.requiredMonthly) : 0;

            return (
              <Card
                key={goal.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: isCompleted ? '1px solid var(--color-success)' : undefined,
                  boxShadow: isCompleted ? '0 0 0 1px var(--color-success-subtle)' : undefined,
                }}
              >
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: 'var(--space-2)' }}>
                    <div>
                      <CardTitle>{goal.name}</CardTitle>
                      {goal.targetDate && (
                        <CardSubtitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                          <Icon name="calendar" size={12} />
                          Target: {goal.targetDate}
                        </CardSubtitle>
                      )}
                    </div>
                    {isCompleted ? (
                      <Badge variant="success">Completed</Badge>
                    ) : (
                      <Badge variant="info">{percent}%</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Amount Breakdown */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Saved</span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Target</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="font-tabular" style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--weight-semibold)', color: isCompleted ? 'var(--color-success)' : 'var(--text-primary)' }}>
                        {formatAmount(saved)}
                      </span>
                      <span className="font-tabular" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                        {formatAmount(target)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <ProgressBar
                      value={percent}
                      max={100}
                      variant={isCompleted ? 'success' : percent >= 70 ? 'info' : 'primary'}
                      height={8}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-1)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      <span>{percent.toFixed(1)}% funded</span>
                      <span>Remaining: {formatAmount(remaining)}</span>
                    </div>
                  </div>

                  {/* Monthly Pace Callout Banner */}
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isCompleted ? 'var(--color-success-subtle)' : 'var(--bg-surface-active)',
                      border: '1px solid',
                      borderColor: isCompleted ? 'var(--color-success)' : 'var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Icon
                      name={isCompleted ? 'checkCircle' : 'sparkles'}
                      size={16}
                      style={{ color: isCompleted ? 'var(--color-success)' : 'var(--accent)', flexShrink: 0 }}
                    />
                    <div style={{ fontSize: 'var(--font-xs)', lineHeight: 1.4 }}>
                      {isCompleted ? (
                        <strong style={{ color: 'var(--color-success)' }}>
                          Target fully funded! You have achieved this milestone.
                        </strong>
                      ) : requiredMonthly > 0 ? (
                        <span>
                          Save <strong className="font-tabular" style={{ color: 'var(--text-primary)' }}>{formatAmount(requiredMonthly)} / month</strong> to reach your target on schedule.
                        </span>
                      ) : (
                        <span>Open-ended savings fund. Allocate deposits whenever surplus cash allows.</span>
                      )}
                    </div>
                  </div>
                </CardBody>

                <CardFooter style={{ borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant={isCompleted ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleOpenContribute(goal)}
                  >
                    <Icon name="plus" size={14} />
                    Add Money
                  </Button>

                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(goal)}
                      title="Edit Goal"
                    >
                      <Icon name="pencil" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(goal)}
                      title="Delete Goal"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <Icon name="trash" size={14} />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => !formSubmitting && setIsFormModalOpen(false)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        description="Set a target fund, timeline deadline, and track ongoing savings progress."
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
              {formSubmitting ? 'Saving...' : editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Field label="Goal Name" error={formErrors.name} required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Emergency Rainy Day Fund, Japan Trip, Home Downpayment"
              autoFocus
            />
          </Field>

          <div className="grid-2">
            <Field label="Target Amount" error={formErrors.targetAmount} required>
              <AmountInput
                value={formData.targetAmount}
                onChange={(val) => setFormData({ ...formData, targetAmount: val })}
                placeholder="100000.00"
              />
            </Field>

            <Field label="Current Saved Amount" error={formErrors.savedAmount}>
              <AmountInput
                value={formData.savedAmount}
                onChange={(val) => setFormData({ ...formData, savedAmount: val })}
                placeholder="0.00"
              />
            </Field>
          </div>

          <Field label="Target Completion Date" error={formErrors.targetDate} hint="Optional. Helps calculate required monthly deposit rate.">
            <DateInput
              value={formData.targetDate}
              onChange={(val) => setFormData({ ...formData, targetDate: val })}
            />
          </Field>
        </form>
      </Modal>

      {/* Add Money / Contribute Modal */}
      <Modal
        isOpen={Boolean(contributeTarget)}
        onClose={() => !isContributing && setContributeTarget(null)}
        title={`Contribute to "${contributeTarget?.name}"`}
        description="Deposit cash allocation towards this goal to increase its funded percentage."
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              onClick={() => setContributeTarget(null)}
              disabled={isContributing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitContribute}
              disabled={isContributing}
            >
              {isContributing ? 'Depositing...' : 'Confirm Deposit'}
            </Button>
          </div>
        }
      >
        {contributeTarget && (
          <form onSubmit={handleSubmitContribute} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-active)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Currently Saved</span>
                <div className="font-tabular" style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                  {formatAmount(contributeTarget.savedAmount)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Target Goal</span>
                <div className="font-tabular" style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                  {formatAmount(contributeTarget.targetAmount)}
                </div>
              </div>
            </div>

            <Field label="Contribution Amount" error={contributeError} required>
              <AmountInput
                value={contributeAmount}
                onChange={(val) => {
                  setContributeAmount(val);
                  setContributeError(null);
                }}
                placeholder="5000.00"
                autoFocus
              />
            </Field>

            {/* Quick Presets */}
            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>
                Quick Presets
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {[1000, 2500, 5000, 10000, 25000].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setContributeAmount(String(preset));
                      setContributeError(null);
                    }}
                  >
                    +{formatAmount(preset)}
                  </Button>
                ))}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        message="Are you sure you want to delete this savings goal? Any saved funds tracking recorded for this goal will be removed."
        confirmText={isDeleting ? 'Deleting...' : 'Delete Goal'}
        variant="danger"
      />
    </div>
  );
}

export default Goals;
