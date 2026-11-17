import { coreClient } from './client.js';

export const budgetsApi = {
  list: (userId = 1, month, options = {}) => {
    const actualUserId = typeof userId === 'object' ? userId.userId || 1 : userId;
    const actualMonth = typeof userId === 'object' ? userId.month : month;
    return coreClient.get('/api/budgets', {
      ...options,
      query: { userId: actualUserId, month: actualMonth },
    });
  },

  getAll: (params = 1, month, options = {}) =>
    budgetsApi.list(params, month, options),

  setBudget: (data, options = {}) =>
    budgetsApi.create(data, options),

  create: (data, options = {}) =>
    coreClient.post('/api/budgets', data, options),

  update: (id, data, options = {}) =>
    coreClient.put(`/api/budgets/${id}`, data, options),

  delete: (id, options = {}) =>
    coreClient.delete(`/api/budgets/${id}`, options),

  copy: (fromMonth, toMonth, userId = 1, options = {}) =>
    coreClient.post('/api/budgets/copy', { fromMonth, toMonth, userId }, options),
};
