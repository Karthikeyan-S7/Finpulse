import { coreClient } from './client.js';

export const transfersApi = {
  create: (data, options = {}) =>
    coreClient.post('/api/transfers', data, options),
};
