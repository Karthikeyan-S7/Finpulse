import { coreClient } from './client.js';

export const accountsApi = {
  list: (userId = 1, includeArchived = false, options = {}) => {
    let actualUserId = 1;
    let actualInc = false;

    if (typeof userId === 'object' && userId !== null) {
      actualUserId = userId.userId || 1;
      actualInc = Boolean(userId.includeArchived);
    } else {
      actualUserId = userId;
      actualInc = Boolean(includeArchived);
    }

    return coreClient.get('/api/accounts', {
      ...options,
      query: { userId: actualUserId, includeArchived: actualInc },
    });
  },

  getAll: (userId = 1, includeArchived = false, options = {}) =>
    accountsApi.list(userId, includeArchived, options),

  getById: (id, options = {}) =>
    coreClient.get(`/api/accounts/${id}`, options),

  create: (data, options = {}) =>
    coreClient.post('/api/accounts', data, options),

  update: (id, data, options = {}) =>
    coreClient.put(`/api/accounts/${id}`, data, options),

  delete: (id, options = {}) =>
    coreClient.delete(`/api/accounts/${id}`, options),
};
