// Backward-compatibility wrapper delegating to modern src/api modules
import {
  accountsApi,
  transactionsApi,
  transfersApi,
  budgetsApi,
  recurringApi,
  goalsApi,
  categoriesApi,
  summaryApi,
  usersApi,
  analyticsApi,
} from '../api';

export const api = {
  // Accounts
  getAccounts: (userId = 1) => accountsApi.getAll(userId),
  getAccountSummaries: (userId = 1) => accountsApi.getSummary(userId),
  getNetWorth: async (userId = 1) => {
    const res = await accountsApi.getNetWorth(userId);
    return res;
  },

  // Transactions
  getTransactions: (userId = 1) => transactionsApi.getAll({ userId }),
  getFinancialOverview: (userId = 1) => summaryApi.getOverview(userId),
  createTransaction: (data) => transactionsApi.create(data),
  deleteTransaction: (id) => transactionsApi.delete(id),

  // Budgets
  getBudgets: (userId = 1, month) => budgetsApi.getAll({ userId, month }),
  getBudgetHealth: (userId = 1, month = '2026-11') => budgetsApi.getAll({ userId, month }),
  setBudget: (data) => budgetsApi.setBudget(data),

  // Analytics (Pure JDBC Service)
  getCategoryBreakdown: (userId = 1, month = '2026-11') => analyticsApi.getCategoryBreakdown({ userId, month }),
  getSpendingSpikes: (userId = 1, month = '2026-11') => analyticsApi.getSpendingSpikes({ userId, month }),
  getTimeline: (userId = 1, days = 30) => analyticsApi.getTimeline({ userId, days }),
  getRecurringMerchants: (userId = 1, month = '2026-11') => analyticsApi.getRecurringMerchants({ userId, month }),
  getUnusedBudgets: (userId = 1, month = '2026-11') => analyticsApi.getUnusedBudgets({ userId, month }),
  getCashflow: (userId = 1, months = 6) => analyticsApi.getCashflow({ userId, months }),
  exportCsvUrl: (userId = 1, month = '2026-11') => analyticsApi.getCsvUrl({ userId, month }),
};

export default api;
