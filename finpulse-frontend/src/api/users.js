import { coreClient } from './client.js';

export const usersApi = {
  getById: (id = 1, options = {}) =>
    coreClient.get(`/api/users/${id}`, options),

  update: (id, data, options = {}) =>
    coreClient.put(`/api/users/${id}`, data, options),
};
