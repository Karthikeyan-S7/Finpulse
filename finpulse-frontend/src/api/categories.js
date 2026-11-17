import { coreClient } from './client.js';

export const categoriesApi = {
  list: (options = {}) =>
    coreClient.get('/api/categories', options),
};
