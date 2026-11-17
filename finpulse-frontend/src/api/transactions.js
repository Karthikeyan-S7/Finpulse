import { coreClient } from './client.js';

export const transactionsApi = {
  list: (params = {}, options = {}) =>
    coreClient.get('/api/transactions', {
      ...options,
      query: {
        userId: params.userId || 1,
        from: params.from,
        to: params.to,
        accountId: params.accountId,
        type: params.type,
        category: params.category,
      },
    }),

  getAll: (params = {}, options = {}) =>
    transactionsApi.list(params, options),

  create: (data, options = {}) =>
    coreClient.post('/api/transactions', data, options),

  update: (id, data, options = {}) =>
    coreClient.put(`/api/transactions/${id}`, data, options),

  delete: (id, options = {}) =>
    coreClient.delete(`/api/transactions/${id}`, options),
};
