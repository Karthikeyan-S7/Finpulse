import { coreClient } from './client.js';

export const recurringApi = {
  list: (userId = 1, options = {}) =>
    coreClient.get('/api/recurring', {
      ...options,
      query: { userId: typeof userId === 'object' ? userId.userId || 1 : userId },
    }),

  getAll: (userId = 1, options = {}) =>
    recurringApi.list(userId, options),

  create: (data, options = {}) =>
    coreClient.post('/api/recurring', data, options),

  update: (id, data, options = {}) =>
    coreClient.put(`/api/recurring/${id}`, data, options),

  delete: (id, options = {}) =>
    coreClient.delete(`/api/recurring/${id}`, options),

  toggleActive: (id, isActive, options = {}) =>
    coreClient.patch(`/api/recurring/${id}/active`, { isActive }, options),

  pay: (id, options = {}) =>
    coreClient.post(`/api/recurring/${id}/pay`, {}, options),
};
