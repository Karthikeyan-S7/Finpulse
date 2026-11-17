import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { transfersApi } from '../../api/transfers';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';

export function TransferModal({
  isOpen,
  onClose,
  onSuccess,
  accounts = [],
}) {
  const { userId } = useAuth();
  const toast = useToast();

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().slice(0, 10));

    if (accounts.length >= 2) {
      setFromAccountId(String(accounts[0].id));
      setToAccountId(String(accounts[1].id));
    } else if (accounts.length === 1) {
      setFromAccountId(String(accounts[0].id));
      setToAccountId('');
    }
  }, [isOpen, accounts]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');

    if (!fromAccountId || !toAccountId) {
      setError('Please select both source and destination accounts.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Source and destination accounts must be different.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please specify a positive transfer amount.');
      return;
    }

    setLoading(true);
    try {
      await transfersApi.create({
        userId,
        fromAccountId: Number(fromAccountId),
        toAccountId: Number(toAccountId),
        amount: numericAmount,
        date,
        note: note.trim() || 'Account transfer',
      });

      const fromAcc = accounts.find((a) => String(a.id) === String(fromAccountId));
      const toAcc = accounts.find((a) => String(a.id) === String(toAccountId));

      toast.success(
        `Transferred funds successfully: ${fromAcc?.accountName || 'Account'} → ${toAcc?.accountName || 'Account'}`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.warn('Transfer error:', err);
      if (err.status === 409 || err.message?.toLowerCase().includes('insufficient funds')) {
        setError(err.message || 'Insufficient funds in the source account.');
      } else {
        setError(err.message || 'Transfer failed. Please check account details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Funds Between Accounts"
      maxWidth="480px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTransfer} loading={loading}>
            Execute Transfer
          </Button>
        </>
      }
    >
      <form onSubmit={handleTransfer}>
        {error && (
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
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="From Account (Debit)" required>
            <Select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="To Account (Credit)" required>
            <Select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Field label="Transfer Amount" required>
            <AmountInput
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          <Field label="Date" required>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Transfer Note / Memo (Optional)">
          <Input
            placeholder="e.g. Monthly savings contribution, credit card payment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <div
          style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: 'var(--bg-surface-hover)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          Transfers create two synchronized double-entry records (`Transfer` category) and adjust both account balances atomically.
        </div>
      </form>
    </Modal>
  );
}

export default TransferModal;
