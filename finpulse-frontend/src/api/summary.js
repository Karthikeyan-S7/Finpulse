import { coreClient } from './client.js';

export const summaryApi = {
  get: (userId = 1, month, options = {}) =>
    coreClient.get('/api/summary', {
      ...options,
      query: { userId, month },
    }),
};
