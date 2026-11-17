import { coreClient } from './client.js';

export const goalsApi = {
  list: (userId = 1, options = {}) => {
    const actualUserId = typeof userId === 'object' && userId !== null ? userId.userId || 1 : userId;
    return coreClient.get('/api/goals', {
      ...options,
      query: { userId: actualUserId },
    });
  },

  getAll: (userId = 1, options = {}) =>
    goalsApi.list(userId, options),

  create: (data, options = {}) =>
    coreClient.post('/api/goals', data, options),

  update: (id, data, options = {}) =>
    coreClient.put(`/api/goals/${id}`, data, options),

  delete: (id, options = {}) =>
    coreClient.delete(`/api/goals/${id}`, options),

  contribute: (id, amount, options = {}) =>
    coreClient.post(`/api/goals/${id}/contribute`, { amount }, options),
};
