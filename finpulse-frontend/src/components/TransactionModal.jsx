import React from 'react';
import { TransactionFormModal } from './transactions/TransactionFormModal';

export function TransactionModal({
  isOpen,
  onClose,
  onTransactionCreated,
  onTransactionAdded,
  accounts = [],
}) {
  return (
    <TransactionFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={() => {
        if (onTransactionCreated) onTransactionCreated();
        if (onTransactionAdded) onTransactionAdded();
      }}
      accounts={accounts}
    />
  );
}

export default TransactionModal;
