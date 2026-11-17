import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { accountsApi } from '../api/accounts';
import { transactionsApi } from '../api/transactions';

// UI Components
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AmountInput } from '../components/ui/AmountInput';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';

// Chart Components (Chunk 6)
import { DonutChart } from '../components/charts/DonutChart';

// Modals
import { TransferModal } from '../components/transactions/TransferModal';

const ACCOUNT_TYPES = [
  { value: 'CHECKING', label: 'Checking / Current Account' },
  { value: 'SAVINGS', label: 'Savings Account' },
  { value: 'CREDIT_CARD', label: 'Credit Card (Debt Owed)' },
  { value: 'INVESTMENT', label: 'Investment & Mutual Funds' },
  { value: 'LOAN', label: 'Loan / Mortgage (Debt Owed)' },
  { value: 'CASH', label: 'Physical Cash Wallet' },
];

const TYPE_METADATA = {
  CHECKING: { label: 'Checking Accounts', badge: 'info', icon: 'Accounts' },
  SAVINGS: { label: 'Savings Accounts', badge: 'income', icon: 'Wallet' },
  INVESTMENT: { label: 'Investment Portfolios', badge: 'income', icon: 'TrendingUp' },
  CREDIT_CARD: { label: 'Credit Cards', badge: 'expense', icon: 'CreditCard' },
  LOAN: { label: 'Loans & Mortgages', badge: 'warning', icon: 'Receipt' },
  CASH: { label: 'Cash & Wallets', badge: 'neutral', icon: 'Wallet' },
};

export function Accounts() {
  useDocumentTitle('Accounts');
  const { userId } = useAuth();
  const { formatAmount } = useCurrency();
  const toast = useToast();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Investment Valuation Update Modal
  const [investmentToAdjust, setInvestmentToAdjust] = useState(null);
  const [newValuation, setNewValuation] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Account Form states
  const [formData, setFormData] = useState({
    accountName: '',
    accountType: 'CHECKING',
    openingBalance: '',
  });
  const [savingAccount, setSavingAccount] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountsApi.getAll({ userId, includeArchived: true });
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Unable to load accounts from core service:', err.message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Filter active vs archived
  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isArchived), [accounts]);
  const archivedAccounts = useMemo(() => accounts.filter((a) => a.isArchived), [accounts]);

  // Net worth calculation
  const totalAssets = useMemo(() => {
    return activeAccounts
      .filter((a) => Number(a.balance) > 0)
      .reduce((sum, a) => sum + Number(a.balance || 0), 0);
  }, [activeAccounts]);

  const totalLiabilities = useMemo(() => {
    return activeAccounts
      .filter((a) => Number(a.balance) < 0)
      .reduce((sum, a) => sum + Math.abs(Number(a.balance || 0)), 0);
  }, [activeAccounts]);

  const netWorth = totalAssets - totalLiabilities;

  // Assets by Account Type for DonutChart
  const assetsByTypeData = useMemo(() => {
    const typeMap = {};
    activeAccounts.forEach((acc) => {
      const bal = Number(acc.balance || 0);
      if (bal > 0) {
        const typeLabel = TYPE_METADATA[acc.accountType]?.label || acc.accountType;
        typeMap[typeLabel] = (typeMap[typeLabel] || 0) + bal;
      }
    });
    return Object.keys(typeMap).map((k) => ({ name: k, amount: typeMap[k] }));
  }, [activeAccounts]);

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const groups = {};
    activeAccounts.forEach((acc) => {
      if (!groups[acc.accountType]) {
        groups[acc.accountType] = [];
      }
      groups[acc.accountType].push(acc);
    });
    return groups;
  }, [activeAccounts]);

  // Filter active accounts by selected type for side-by-side display
  const filteredAccounts = useMemo(() => {
    if (selectedTypeFilter === 'ALL') return activeAccounts;
    return activeAccounts.filter((a) => a.accountType === selectedTypeFilter);
  }, [activeAccounts, selectedTypeFilter]);

  // Add / Edit Account submission
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!formData.accountName.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    setSavingAccount(true);
    try {
      if (editCandidate) {
        // Edit existing account
        await accountsApi.update(editCandidate.id, {
          accountName: formData.accountName.trim(),
        });
        toast.success(`Account renamed to "${formData.accountName.trim()}"`);
        setEditCandidate(null);
      } else {
        // Create new account
        let initialBal = parseFloat(formData.openingBalance || '0');
        // If CREDIT_CARD or LOAN, ensure balance is stored as negative owed amount
        if (formData.accountType === 'CREDIT_CARD' || formData.accountType === 'LOAN') {
          initialBal = -Math.abs(initialBal);
        }

        await accountsApi.create({
          userId,
          accountName: formData.accountName.trim(),
          accountType: formData.accountType,
          balance: initialBal,
        });

        toast.success(`Account "${formData.accountName.trim()}" successfully created!`);
        setIsAddModalOpen(false);
      }

      setFormData({ accountName: '', accountType: 'CHECKING', openingBalance: '' });
      loadAccounts();
    } catch (err) {
      toast.error(`Error saving account: ${err.message}`);
    } finally {
      setSavingAccount(false);
    }
  };

  // Archive / Delete confirm action
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const res = await accountsApi.delete(deleteCandidate.id);
      if (res.action === 'ARCHIVED') {
        toast.info(res.message || 'Account archived to preserve transaction ledger history.');
      } else {
        toast.success(res.message || 'Account permanently deleted.');
      }
      setDeleteCandidate(null);
      loadAccounts();
    } catch (err) {
      toast.error(`Failed to remove account: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Investment Portfolio Valuation Adjustment
  const handleAdjustValuation = async (e) => {
    e.preventDefault();
    if (!investmentToAdjust || !newValuation) return;

    const currentBal = Number(investmentToAdjust.balance || 0);
    const targetBal = parseFloat(newValuation);
    const diff = targetBal - currentBal;

    if (diff === 0) {
      toast.info('Valuation unchanged.');
      setInvestmentToAdjust(null);
      return;
    }

    setIsAdjusting(true);
    try {
      if (diff > 0) {
        // Record gain as INCOME
        await transactionsApi.create({
          userId,
          accountId: investmentToAdjust.id,
          amount: diff,
          transactionType: 'INCOME',
          category: 'Investment Income',
          merchant: 'Portfolio Valuation Gain',
          description: `Manual adjustment from ${formatAmount(currentBal)} to ${formatAmount(targetBal)}`,
          transactionDate: new Date().toISOString().slice(0, 10),
        });
        toast.success(`Valuation increased by +${formatAmount(diff)}`);
      } else {
        // Record loss as EXPENSE
        await transactionsApi.create({
          userId,
          accountId: investmentToAdjust.id,
          amount: Math.abs(diff),
          transactionType: 'EXPENSE',
          category: 'Other Expense',
          merchant: 'Portfolio Valuation Adjustment',
          description: `Manual adjustment from ${formatAmount(currentBal)} to ${formatAmount(targetBal)}`,
          transactionDate: new Date().toISOString().slice(0, 10),
        });
        toast.info(`Valuation adjusted by -${formatAmount(Math.abs(diff))}`);
      }

      setInvestmentToAdjust(null);
      setNewValuation('');
      loadAccounts();
    } catch (err) {
      toast.error(`Valuation adjustment failed: ${err.message}`);
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="accounts-page">
      {/* Page Header */}
      <PageHeader
        title="Connected Accounts"
        subtitle="Manage and reconcile checking, savings, credit cards, investments, and loan accounts."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              icon={<Icon name="Refresh" size={15} />}
              onClick={() => setIsTransferModalOpen(true)}
            >
              Transfer Funds
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="Plus" size={16} />}
              onClick={() => {
                setFormData({ accountName: '', accountType: 'CHECKING', openingBalance: '' });
                setIsAddModalOpen(true);
              }}
            >
              Connect Account
            </Button>
          </div>
        }
      />

      {/* Row 1: Net Worth Header & Assets by Type DonutChart */}
      <div className="dashboard-grid">
        {/* Left: 3 StatCards (Assets, Liabilities, Net) */}
        <div className="col-8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', height: '100%' }}>
            <StatCard
              label="Total Net Worth"
              value={formatAmount(netWorth)}
              trend={netWorth >= 0 ? 'positive' : 'negative'}
              subtitle="Sum of active accounts"
              icon="Accounts"
            />
            <StatCard
              label="Total Assets"
              value={formatAmount(totalAssets)}
              trend="positive"
              subtitle="Checking, savings & investments"
              icon="Wallet"
            />
            <StatCard
              label="Total Liabilities"
              value={formatAmount(totalLiabilities)}
              trend="negative"
              subtitle="Credit cards & outstanding debt"
              icon="CreditCard"
            />
          </div>
        </div>

        {/* Right: Assets by Account Type DonutChart */}
        <div className="col-4">
          <Card style={{ height: '100%' }}>
            <CardHeader>
              <div>
                <CardTitle>Asset Allocation</CardTitle>
                <CardSubtitle>Breakdown by Account Type</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <SkeletonCard style={{ height: '180px' }} />
              ) : assetsByTypeData.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-xs)', padding: 'var(--space-6)' }}>
                  No positive asset accounts registered.
                </div>
              ) : (
                <DonutChart
                  data={assetsByTypeData}
                  height={180}
                  emptyMessage="No assets registered."
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Active Accounts Grouped by Type */}
      {loading ? (
        <div className="dashboard-grid">
          <div className="col-4"><SkeletonCard /></div>
          <div className="col-4"><SkeletonCard /></div>
          <div className="col-4"><SkeletonCard /></div>
        </div>
      ) : activeAccounts.length === 0 ? (
        <EmptyState
          icon="Accounts"
          title="No Connected Accounts"
          description="Link checking, savings, or investment accounts to begin tracking your net worth."
          action={
            <Button variant="primary" icon={<Icon name="Plus" size={16} />} onClick={() => setIsAddModalOpen(true)}>
              Connect Account
            </Button>
          }
        />
      ) : (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          {/* Header & Filter Pills */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>Active Accounts</h3>
              <Badge variant="neutral">{activeAccounts.length}</Badge>
            </div>

            {/* Type Filter Pills */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                variant={selectedTypeFilter === 'ALL' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedTypeFilter('ALL')}
              >
                All ({activeAccounts.length})
              </Button>
              {Object.keys(groupedAccounts).map((type) => {
                const meta = TYPE_METADATA[type] || { label: type };
                const count = groupedAccounts[type].length;
                return (
                  <Button
                    key={type}
                    variant={selectedTypeFilter === type ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTypeFilter(type)}
                  >
                    {meta.label.replace(' Accounts', '').replace(' Portfolios', '')} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {filteredAccounts.length === 0 ? (
            <EmptyState
              icon="Accounts"
              title="No Accounts Found"
              description="No active accounts match the selected category filter."
            />
          ) : (
            <div className="dashboard-grid">
              {filteredAccounts.map((acc) => {
                const isOwed = Number(acc.balance) < 0;
                const isInvestment = acc.accountType === 'INVESTMENT';
                const meta = TYPE_METADATA[acc.accountType] || { label: acc.accountType, badge: 'neutral', icon: 'Accounts' };

                return (
                  <div key={acc.id} className="col-4">
                    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardHeader>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                          <Icon name={meta.icon} size={18} style={{ flexShrink: 0, color: 'var(--accent)' }} />
                          <div style={{ minWidth: 0 }}>
                            <CardTitle style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.accountName}
                            </CardTitle>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Account #{acc.id} {acc.accountNumber ? `· ${acc.accountNumber}` : ''}
                            </div>
                          </div>
                        </div>
                        <Badge variant={meta.badge}>
                          {acc.accountType.replace('_', ' ')}
                        </Badge>
                      </CardHeader>

                      <CardBody style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Current Balance
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--font-xl)',
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            color: isOwed ? 'var(--color-expense)' : 'var(--text-primary)',
                          }}
                        >
                          {formatAmount(acc.balance)}
                        </div>
                      </CardBody>

                      <CardFooter>
                        <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {isInvestment && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setInvestmentToAdjust(acc);
                                setNewValuation(String(acc.balance || ''));
                              }}
                              style={{ marginRight: 'auto' }}
                            >
                              Update Valuation
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditCandidate(acc);
                              setFormData({
                                accountName: acc.accountName,
                                accountType: acc.accountType,
                                openingBalance: '',
                              });
                            }}
                          >
                            Rename
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCandidate(acc)}
                            style={{ color: 'var(--color-expense)' }}
                          >
                            Archive
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Archived Accounts Toggle Section */}
      {archivedAccounts.length > 0 && (
        <div style={{ marginTop: 'var(--space-8)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>Archived Accounts</h3>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Preserved historical accounts excluded from active net worth calculations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived((prev) => !prev)}
            >
              {showArchived ? 'Hide Archived' : `Show Archived (${archivedAccounts.length})`}
            </Button>
          </div>

          {showArchived && (
            <div className="dashboard-grid">
              {archivedAccounts.map((acc) => (
                <div key={acc.id} className="col-4">
                  <Card style={{ opacity: 0.75 }}>
                    <CardHeader>
                      <CardTitle>{acc.accountName}</CardTitle>
                      <Badge variant="neutral">Archived</Badge>
                    </CardHeader>
                    <CardBody>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Archived Balance
                      </div>
                      <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatAmount(acc.balance)}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Account Modal */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editCandidate)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditCandidate(null);
        }}
        title={editCandidate ? 'Edit Account Name' : 'Connect Financial Account'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditCandidate(null);
              }}
              disabled={savingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAccount}
              loading={savingAccount}
            >
              {editCandidate ? 'Save Changes' : 'Connect Account'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAccount}>
          <Field label="Account Name" required>
            <Input
              placeholder="e.g. HDFC Salary Checking, Zerodha Equity"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            />
          </Field>

          {!editCandidate && (
            <>
              <Field label="Account Type" required>
                <Select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  options={ACCOUNT_TYPES}
                />
              </Field>

              <Field
                label="Opening Balance"
                hint={
                  formData.accountType === 'CREDIT_CARD' || formData.accountType === 'LOAN'
                    ? 'For credit cards and loans, positive amounts entered represent debt owed (stored negatively).'
                    : 'Initial account starting balance.'
                }
              >
                <AmountInput
                  placeholder="0.00"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                />
              </Field>
            </>
          )}
        </form>
      </Modal>

      {/* Investment Valuation Adjustment Modal */}
      {investmentToAdjust && (
        <Modal
          isOpen={Boolean(investmentToAdjust)}
          onClose={() => setInvestmentToAdjust(null)}
          title={`Update Portfolio Valuation: ${investmentToAdjust.accountName}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setInvestmentToAdjust(null)} disabled={isAdjusting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAdjustValuation} loading={isAdjusting}>
                Record Valuation Adjustment
              </Button>
            </>
          }
        >
          <form onSubmit={handleAdjustValuation}>
            <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Current Recorded Valuation:{' '}
              <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                {formatAmount(investmentToAdjust.balance)}
              </strong>
            </div>

            <Field label="New Total Valuation" required hint="The difference will be posted as an automated ledger adjustment transaction.">
              <AmountInput
                placeholder="0.00"
                value={newValuation}
                onChange={(e) => setNewValuation(e.target.value)}
              />
            </Field>
          </form>
        </Modal>
      )}

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Archive or Delete Account"
        message={`Are you sure you want to remove "${deleteCandidate?.accountName}"? If the account contains transactions, it will be safely archived to preserve financial records. If empty, it will be deleted.`}
        confirmText="Confirm Archive / Delete"
      />

      {/* Transfer Funds Modal */}
      {isTransferModalOpen && (
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={loadAccounts}
          accounts={activeAccounts}
        />
      )}
    </div>
  );
}

export default Accounts;
