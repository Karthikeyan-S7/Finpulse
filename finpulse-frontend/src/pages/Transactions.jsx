import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDebounce } from '../hooks/useDebounce';
import { transactionsApi } from '../api/transactions';
import { accountsApi } from '../api/accounts';
import { categoriesApi } from '../api/categories';
import { analyticsApi } from '../api/analytics';

// UI Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';

// Modals
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { TransferModal } from '../components/transactions/TransferModal';

const PAGE_SIZE = 25;

export function Transactions() {
  useDocumentTitle('Transactions');
  const { userId } = useAuth();
  const { formatAmount } = useCurrency();
  const toast = useToast();

  // Data states
  const [rawTransactions, setRawTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE'
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('this-month'); // 'this-month' | 'last-month' | 'last-90' | 'custom' | 'all'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('transactionDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Compute date range query params from preset
  const dateRange = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    if (datePreset === 'this-month') {
      const from = `${curYear}-${String(curMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(curYear, curMonth, 0).getDate();
      const to = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { from, to };
    }

    if (datePreset === 'last-month') {
      let py = curYear;
      let pm = curMonth - 1;
      if (pm < 1) {
        pm = 12;
        py -= 1;
      }
      const from = `${py}-${String(pm).padStart(2, '0')}-01`;
      const lastDay = new Date(py, pm, 0).getDate();
      const to = `${py}-${String(pm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { from, to };
    }

    if (datePreset === 'last-90') {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const from = past.toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);
      return { from, to };
    }

    if (datePreset === 'custom') {
      return { from: customFrom || undefined, to: customTo || undefined };
    }

    return { from: undefined, to: undefined };
  }, [datePreset, customFrom, customTo]);

  // Load Accounts and Categories
  useEffect(() => {
    let active = true;
    Promise.all([
      accountsApi.getAll(userId).catch(() => []),
      categoriesApi.list().catch(() => []),
    ]).then(([accList, catList]) => {
      if (!active) return;
      setAccounts(Array.isArray(accList) ? accList : []);
      if (Array.isArray(catList)) {
        const names = catList.map((c) => c.name);
        setCategories(names);
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Fetch transactions from server with date range and accountId
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        userId,
        from: dateRange.from,
        to: dateRange.to,
        accountId: accountFilter !== 'ALL' ? Number(accountFilter) : undefined,
      };

      const data = await transactionsApi.getAll(params);
      setRawTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load transactions:', err.message);
      setRawTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId, dateRange, accountFilter]);

  useEffect(() => {
    fetchTransactions();
    setPage(1);
  }, [fetchTransactions]);

  // Consolidate paired transfer transactions into single transfer rows
  const consolidatedTransactions = useMemo(() => {
    const list = [];
    const transferGroupMap = new Map();

    for (const tx of rawTransactions) {
      if (tx.isTransfer && tx.transferGroupId) {
        if (!transferGroupMap.has(tx.transferGroupId)) {
          transferGroupMap.set(tx.transferGroupId, []);
        }
        transferGroupMap.get(tx.transferGroupId).push(tx);
      } else {
        list.push(tx);
      }
    }

    // Process grouped transfers
    transferGroupMap.forEach((legs, gid) => {
      if (legs.length === 2) {
        const expenseLeg = legs.find((l) => l.transactionType === 'EXPENSE') || legs[0];
        const incomeLeg = legs.find((l) => l.transactionType === 'INCOME') || legs[1];

        list.push({
          ...expenseLeg,
          id: expenseLeg.id,
          transferGroupId: gid,
          isTransfer: true,
          category: 'Transfer',
          merchant: `Transfer: ${expenseLeg.accountName || 'Account'} → ${incomeLeg.accountName || 'Account'}`,
          description: expenseLeg.description || incomeLeg.description || null,
          fromAccountName: expenseLeg.accountName,
          toAccountName: incomeLeg.accountName,
          amount: expenseLeg.amount,
        });
      } else {
        // Single leg transfer
        legs.forEach((l) => list.push(l));
      }
    });

    return list;
  }, [rawTransactions]);

  // Client-side filtering & sorting with useMemo
  const filteredTransactions = useMemo(() => {
    let result = consolidatedTransactions.filter((tx) => {
      // 1. Text Search across merchant, description, category
      const term = debouncedSearch.toLowerCase().trim();
      if (term) {
        const matchesMerchant = tx.merchant && tx.merchant.toLowerCase().includes(term);
        const matchesDesc = tx.description && tx.description.toLowerCase().includes(term);
        const matchesCat = tx.category && tx.category.toLowerCase().includes(term);
        if (!matchesMerchant && !matchesDesc && !matchesCat) return false;
      }

      // 2. Type filter
      if (typeFilter !== 'ALL') {
        if (tx.isTransfer) return false; // Transfers excluded from income/expense specific tabs
        if (tx.transactionType !== typeFilter) return false;
      }

      // 3. Category filter
      if (categoryFilter !== 'ALL') {
        if (tx.category !== categoryFilter) return false;
      }

      return true;
    });

    // Client-side Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'amount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [consolidatedTransactions, debouncedSearch, typeFilter, categoryFilter, sortField, sortDirection]);

  // Client-side Filtered Summary Calculations
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expenses = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.isTransfer || tx.category === 'Opening Balance') return;
      if (tx.transactionType === 'INCOME') {
        income += Number(tx.amount || 0);
      } else if (tx.transactionType === 'EXPENSE') {
        expenses += Number(tx.amount || 0);
      }
    });

    const net = income - expenses;
    return { income, expenses, net };
  }, [filteredTransactions]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, page]);

  // Handle column header sort clicks
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Delete transaction action with ConfirmDialog
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await transactionsApi.delete(deleteCandidate.id);
      toast.success(
        `Deleted transaction "${deleteCandidate.merchant || deleteCandidate.description || 'Record'}". Account balance updated.`
      );
      setDeleteCandidate(null);
      fetchTransactions();
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV Browser Download
  const handleExportCsv = () => {
    const url = analyticsApi.getExportCsvUrl({
      userId,
      from: dateRange.from,
      to: dateRange.to,
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpulse-transactions-${datePreset}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.info('Downloading verified transactions CSV...');
  };

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <PageHeader
        title="Transactions Ledger"
        subtitle="Search, filter, and audit verified account debits, credits, and transfers."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              icon={<Icon name="Download" size={15} />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
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
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Transaction
            </Button>
          </div>
        }
      />

      {/* Main Table Card */}
      <Card>
        {/* Toolbar (Flexbox) */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {/* Top Row: Search, Type Toggle, and Result Count */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {/* Search Input */}
            <div style={{ flex: '1', minWidth: '260px' }}>
              <Input
                placeholder="Search merchant, description, or category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                prefix={<Icon name="Search" size={16} />}
              />
            </div>

            {/* Segmented Type Toggle */}
            <SegmentedControl
              options={[
                { value: 'ALL', label: 'All Activity' },
                { value: 'EXPENSE', label: 'Expenses' },
                { value: 'INCOME', label: 'Income' },
              ]}
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
            />

            {/* Showing Count */}
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Showing <strong>{filteredTransactions.length}</strong> matching entries
            </div>
          </div>

          {/* Bottom Row: Account Filter, Category Filter, and Date Range Presets */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Account Select */}
            <div style={{ minWidth: '180px' }}>
              <Select
                value={accountFilter}
                onChange={(e) => {
                  setAccountFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName}
                  </option>
                ))}
              </Select>
            </div>

            {/* Category Select */}
            <div style={{ minWidth: '180px' }}>
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            {/* Date Preset Selector */}
            <div style={{ minWidth: '160px' }}>
              <Select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setPage(1);
                }}
              >
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="last-90">Last 90 Days</option>
                <option value="custom">Custom Date Range</option>
                <option value="all">All Time</option>
              </Select>
            </div>

            {/* Custom Date Pickers (visible only when custom is active) */}
            {datePreset === 'custom' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={{ width: '140px' }}
                />
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>to</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{ width: '140px' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Desktop View Table (>=640px) */}
        <div className="table-desktop-view">
          {loading ? (
            <div style={{ padding: 'var(--space-6)' }}>
              <SkeletonTable rows={8} cols={6} />
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <EmptyState
              icon="Transactions"
              title="No transactions found"
              description="No entries matched your search query or filter selection."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('ALL');
                    setAccountFilter('ALL');
                    setCategoryFilter('ALL');
                    setDatePreset('all');
                  }}
                >
                  Clear All Filters
                </Button>
              }
            />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      className="sortable"
                      onClick={() => handleSort('transactionDate')}
                      style={{ width: '115px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Date</span>
                        {sortField === 'transactionDate' && (
                          <Icon name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={12} strokeWidth={2.5} />
                        )}
                      </div>
                    </th>

                    <th
                      className="sortable"
                      onClick={() => handleSort('merchant')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Merchant / Payee</span>
                        {sortField === 'merchant' && (
                          <Icon name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={12} strokeWidth={2.5} />
                        )}
                      </div>
                    </th>

                    <th
                      className="sortable"
                      onClick={() => handleSort('category')}
                      style={{ width: '180px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Category</span>
                        {sortField === 'category' && (
                          <Icon name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={12} strokeWidth={2.5} />
                        )}
                      </div>
                    </th>

                    <th
                      className="sortable"
                      onClick={() => handleSort('accountName')}
                      style={{ width: '170px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Account</span>
                        {sortField === 'accountName' && (
                          <Icon name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={12} strokeWidth={2.5} />
                        )}
                      </div>
                    </th>

                    <th
                      className="sortable"
                      onClick={() => handleSort('amount')}
                      style={{ textAlign: 'right', width: '140px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>Amount</span>
                        {sortField === 'amount' && (
                          <Icon name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={12} strokeWidth={2.5} />
                        )}
                      </div>
                    </th>

                    <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTransactions.map((tx) => {
                    const isIncome = tx.transactionType === 'INCOME';
                    const isTransfer = Boolean(tx.isTransfer);

                    return (
                      <tr key={tx.id || tx.transferGroupId}>
                        {/* Date */}
                        <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                          {tx.transactionDate}
                        </td>

                        {/* Merchant + Description */}
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {tx.merchant || tx.description || 'Transaction'}
                          </div>
                          {tx.description && tx.merchant && (
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                              {tx.description}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td>
                          <Badge variant={isTransfer ? 'info' : 'neutral'}>
                            {isTransfer ? 'Transfer' : tx.category}
                          </Badge>
                        </td>

                        {/* Account */}
                        <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                          {isTransfer ? (
                            <span>{tx.fromAccountName || 'Account'} → {tx.toAccountName || 'Account'}</span>
                          ) : (
                            <span>{tx.accountName || 'Primary Account'}</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                            color: isTransfer
                              ? 'var(--accent)'
                              : isIncome
                              ? 'var(--color-income-text)'
                              : 'var(--text-primary)',
                          }}
                        >
                          {isTransfer
                            ? formatAmount(tx.amount)
                            : isIncome
                            ? `+${formatAmount(tx.amount)}`
                            : `-${formatAmount(tx.amount)}`}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            {!isTransfer && (
                              <Button
                                variant="ghost"
                                size="sm"
                                iconOnly
                                onClick={() => setEditCandidate(tx)}
                                title="Edit Transaction"
                                aria-label="Edit Transaction"
                              >
                                <Icon name="Edit" size={13} />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              onClick={() => setDeleteCandidate(tx)}
                              title="Delete Transaction"
                              aria-label="Delete Transaction"
                            >
                              <Icon name="Trash" size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile Stacked Card View (<640px) */}
        <div className="table-mobile-card-list" style={{ padding: 'var(--space-4)' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonTable rows={4} cols={2} />
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-6)' }}>
              No matching transactions.
            </div>
          ) : (
            paginatedTransactions.map((tx) => {
              const isIncome = tx.transactionType === 'INCOME';
              const isTransfer = Boolean(tx.isTransfer);

              return (
                <div key={tx.id || tx.transferGroupId} className="transaction-card-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                        {tx.merchant || tx.description || 'Transaction'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {tx.transactionDate} • {isTransfer ? `${tx.fromAccountName} → ${tx.toAccountName}` : tx.accountName}
                      </div>
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 'var(--font-sm)',
                        color: isTransfer
                          ? 'var(--accent)'
                          : isIncome
                          ? 'var(--color-income-text)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {isTransfer
                        ? formatAmount(tx.amount)
                        : isIncome
                        ? `+${formatAmount(tx.amount)}`
                        : `-${formatAmount(tx.amount)}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <Badge variant={isTransfer ? 'info' : 'neutral'}>
                      {isTransfer ? 'Transfer' : tx.category}
                    </Badge>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {!isTransfer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() => setEditCandidate(tx)}
                          aria-label="Edit"
                        >
                          <Icon name="Edit" size={13} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => setDeleteCandidate(tx)}
                        aria-label="Delete"
                      >
                        <Icon name="Trash" size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary of the Filtered Set */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-5)',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            fontSize: 'var(--font-xs)',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>
              Filtered Income:{' '}
              <strong style={{ color: 'var(--color-income-text)', fontVariantNumeric: 'tabular-nums' }}>
                +{formatAmount(filteredSummary.income)}
              </strong>
            </span>
            <span>
              Filtered Expenses:{' '}
              <strong style={{ color: 'var(--color-expense-text)', fontVariantNumeric: 'tabular-nums' }}>
                -{formatAmount(filteredSummary.expenses)}
              </strong>
            </span>
            <span>
              Net Cashflow:{' '}
              <strong
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  color: filteredSummary.net >= 0 ? 'var(--color-income-text)' : 'var(--color-expense-text)',
                }}
              >
                {filteredSummary.net >= 0 ? `+${formatAmount(filteredSummary.net)}` : `-${formatAmount(Math.abs(filteredSummary.net))}`}
              </strong>
            </span>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredTransactions.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      </Card>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <TransactionFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchTransactions}
          accounts={accounts}
        />
      )}

      {/* Edit Transaction Modal */}
      {editCandidate && (
        <TransactionFormModal
          isOpen={Boolean(editCandidate)}
          onClose={() => setEditCandidate(null)}
          onSuccess={fetchTransactions}
          initialData={editCandidate}
          accounts={accounts}
        />
      )}

      {/* Inter-Account Transfer Modal */}
      {isTransferModalOpen && (
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={fetchTransactions}
          accounts={accounts}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${deleteCandidate?.merchant || deleteCandidate?.description || 'this record'}"? The corresponding account balance will be reversed.`}
        confirmText="Yes, Delete"
      />
    </div>
  );
}

export default Transactions;
