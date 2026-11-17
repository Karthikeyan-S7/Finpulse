import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { transactionsApi } from '../../api/transactions';
import { categoriesApi } from '../../api/categories';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AmountInput } from '../ui/AmountInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';

const FALLBACK_CATEGORIES = {
  EXPENSE: [
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
  ],
  INCOME: [
    'Salary',
    'Freelance & Consulting',
    'Investment Income',
    'Gifts & Grants',
    'Other Income',
  ],
};

export function TransactionFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  accounts = [],
}) {
  const { userId } = useAuth();
  const toast = useToast();
  const amountInputRef = useRef(null);

  const isEditing = Boolean(initialData?.id);

  // Form states
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));

  // Category list loaded from core registry
  const [availableCategories, setAvailableCategories] = useState(FALLBACK_CATEGORIES);

  // Status & error states
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Fetch registered categories from core service
  useEffect(() => {
    let active = true;
    categoriesApi
      .list()
      .then((cats) => {
        if (!active || !Array.isArray(cats)) return;
        const expenses = cats.filter((c) => c.type === 'EXPENSE').map((c) => c.name);
        const incomes = cats.filter((c) => c.type === 'INCOME').map((c) => c.name);
        setAvailableCategories({
          EXPENSE: expenses.length > 0 ? expenses : FALLBACK_CATEGORIES.EXPENSE,
          INCOME: incomes.length > 0 ? incomes : FALLBACK_CATEGORIES.INCOME,
        });
      })
      .catch(() => {
        // Fallback to presets if categories endpoint not reachable
      });
    return () => {
      active = false;
    };
  }, []);

  // Initialize form when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    setFieldErrors({});
    setGeneralError('');

    if (initialData) {
      setType(initialData.transactionType || 'EXPENSE');
      setAmount(initialData.amount !== undefined ? String(initialData.amount) : '');
      setAccountId(String(initialData.accountId || accounts[0]?.id || ''));
      setCategory(initialData.category || '');
      setMerchant(initialData.merchant || '');
      setDescription(initialData.description || '');
      setTransactionDate(initialData.transactionDate || new Date().toISOString().slice(0, 10));
    } else {
      setType('EXPENSE');
      setAmount('');
      setAccountId(accounts[0]?.id ? String(accounts[0].id) : '');
      setCategory(availableCategories.EXPENSE[0] || 'Groceries & Essentials');
      setMerchant('');
      setDescription('');
      setTransactionDate(new Date().toISOString().slice(0, 10));
    }

    // Autofocus amount input using useRef
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 50);
  }, [isOpen, initialData, accounts, availableCategories]);

  // Adjust default category when type toggles
  const handleTypeChange = (newType) => {
    setType(newType);
    const catList = availableCategories[newType] || [];
    if (!catList.includes(category)) {
      setCategory(catList[0] || '');
    }
  };

  const validateLocal = () => {
    const errs = {};
    if (!amount || Number(amount) <= 0) {
      errs.amount = 'Please enter a positive amount';
    }
    if (!merchant.trim()) {
      errs.merchant = 'Merchant or payee name is required';
    }
    if (!accountId) {
      errs.accountId = 'Please select an account';
    }
    if (!category) {
      errs.category = 'Please select a category';
    }
    if (!transactionDate) {
      errs.transactionDate = 'Please select a transaction date';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const executeSave = async (keepOpen = false) => {
    if (!validateLocal()) return;

    setLoading(true);
    setGeneralError('');
    setFieldErrors({});

    const payload = {
      userId,
      accountId: Number(accountId),
      category,
      amount: parseFloat(amount),
      transactionType: type,
      merchant: merchant.trim(),
      description: description.trim() || null,
      transactionDate,
    };

    try {
      if (isEditing) {
        await transactionsApi.update(initialData.id, payload);
        toast.success(`Transaction updated (${merchant})`);
      } else {
        await transactionsApi.create(payload);
        toast.success(`Transaction recorded (${merchant})`);
      }

      if (onSuccess) onSuccess();

      if (keepOpen) {
        // Reset amount, merchant, description for rapid successive entry
        setAmount('');
        setMerchant('');
        setDescription('');
        setTimeout(() => {
          amountInputRef.current?.focus();
        }, 50);
      } else {
        onClose();
      }
    } catch (err) {
      console.warn('Transaction submission failed:', err);

      // Handle backend structured field errors
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }

      // Handle Overdraft / Conflict error (HTTP 409)
      if (err.status === 409 || err.message?.toLowerCase().includes('insufficient funds')) {
        setGeneralError(err.message || 'Insufficient funds in the selected account to complete this expense.');
      } else {
        setGeneralError(err.message || 'Failed to save transaction.');
      }
    } finally {
      setLoading(false);
    }
  };

  const categoriesForType = availableCategories[type] || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Transaction' : 'Record Transaction'}
      maxWidth="540px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => executeSave(true)}
              loading={loading}
            >
              Save & Add Another
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => executeSave(false)}
            loading={loading}
          >
            {isEditing ? 'Update Transaction' : 'Save Transaction'}
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); executeSave(false); }}>
        {/* General / Overdraft Error Banner */}
        {generalError && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-expense-subtle)',
              border: '1px solid var(--color-expense-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-expense-text)',
              fontSize: 'var(--font-xs)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            role="alert"
          >
            <span style={{ fontWeight: 700 }}>Notice:</span>
            <span>{generalError}</span>
          </div>
        )}

        {/* Transaction Type Segmented Toggle */}
        {!isEditing && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div className="field-label" style={{ marginBottom: '6px' }}>Transaction Type</div>
            <SegmentedControl
              options={[
                { value: 'EXPENSE', label: 'Expense (Debit)' },
                { value: 'INCOME', label: 'Income (Credit)' },
              ]}
              value={type}
              onChange={handleTypeChange}
            />
          </div>
        )}

        {/* Amount Input with Autofocus */}
        <Field label="Amount" required error={fieldErrors.amount}>
          <AmountInput
            ref={amountInputRef}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={Boolean(fieldErrors.amount)}
          />
        </Field>

        {/* Account and Date in 2-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Account" required error={fieldErrors.accountId}>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              error={Boolean(fieldErrors.accountId)}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName}
                </option>
              ))}
              {accounts.length === 0 && <option value="1">Primary Checking</option>}
            </Select>
          </Field>

          <Field label="Date" required error={fieldErrors.transactionDate}>
            <Input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              error={Boolean(fieldErrors.transactionDate)}
            />
          </Field>
        </div>

        {/* Category dynamically filtered by type */}
        <Field label="Category" required error={fieldErrors.category}>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            error={Boolean(fieldErrors.category)}
          >
            {categoriesForType.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        {/* Merchant / Payee */}
        <Field label="Merchant / Payee" required error={fieldErrors.merchant}>
          <Input
            placeholder="e.g. Swiggy, Amazon India, Tata Power, Employer Payroll"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            error={Boolean(fieldErrors.merchant)}
          />
        </Field>

        {/* Optional Description / Memo */}
        <Field label="Description / Memo (Optional)">
          <Input
            placeholder="e.g. Bi-weekly grocery restocking, family dinner"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}

export default TransactionFormModal;
