import { analyticsClient } from './client.js';

export const analyticsApi = {
  checkHealth: (options = {}) =>
    analyticsClient.get('/api/analytics/health', options),

  getCashflow: (params = {}, options = {}) =>
    analyticsClient.get('/api/analytics/cashflow', {
      ...options,
      query: {
        userId: params.userId || 1,
        months: params.months || 6,
      },
    }),

  getCategoryBreakdown: (params = {}, options = {}) =>
    analyticsClient.get('/api/analytics/category-breakdown', {
      ...options,
      query: {
        userId: params.userId || 1,
        month: params.month,
      },
    }),

  getSpendingSpikes: (params = {}, options = {}) =>
    analyticsClient.get('/api/analytics/spending-spikes', {
      ...options,
      query: {
        userId: params.userId || 1,
        month: params.month,
      },
    }),

  getTimeline: (params = {}, options = {}) =>
    analyticsClient.get('/api/analytics/timeline', {
      ...options,
      query: {
        userId: params.userId || 1,
        days: params.days || 30,
      },
    }),

  getRecurringMerchants: (params = {}, options = {}) =>
    analyticsClient.get('/api/analytics/recurring-merchants', {
      ...options,
      query: {
        userId: params.userId || 1,
        month: params.month,
      },
    }),

  getUnusedBudgets: (params = {}, options = {}) =>
    analyticsClient.get('/api/analytics/unused-budgets', {
      ...options,
      query: {
        userId: params.userId || 1,
        month: params.month,
      },
    }),

  getAccountBalances: (userId = 1, options = {}) =>
    analyticsClient.get('/api/analytics/account-balances', {
      ...options,
      query: { userId },
    }),

  getOverview: (params = {}, options = {}) =>
    analyticsClient.get('/api/analytics/overview', {
      ...options,
      query: {
        userId: params.userId || 1,
        month: params.month,
      },
    }),

  getExportCsvUrl: (params = {}) => {
    const search = new URLSearchParams();
    search.append('userId', params.userId || 1);
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    return `${analyticsClient.baseUrl}/api/analytics/export/transactions.csv?${search.toString()}`;
  },
};
