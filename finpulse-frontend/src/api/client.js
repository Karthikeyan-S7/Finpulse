/**
 * FinPulse API Client Wrapper (Fetch-based, no Axios)
 * Handles base URLs from environment, JSON serialization, query strings,
 * AbortController signals, and normalized error responses.
 */

const CORE_URL = import.meta.env.VITE_CORE_URL || 'http://localhost:8081';
const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:8082';

export class ApiError extends Error {
  constructor(message, status = 500, fieldErrors = null, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors || {};
    this.data = data;
  }
}

function buildQuery(params) {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function request(baseUrl, endpoint, options = {}) {
  const { query, body, signal, headers = {}, ...rest } = options;
  const url = `${baseUrl}${endpoint}${buildQuery(query)}`;

  const config = {
    ...rest,
    signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(
      `Network connection failed to ${baseUrl}. Please ensure the service is running.`,
      0
    );
  }

  // Handle empty or 204 No Content
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = data?.message || response.statusText || 'Request failed';
    const fieldErrors = data?.fieldErrors || null;
    throw new ApiError(message, response.status, fieldErrors, data);
  }

  return data;
}

export const coreClient = {
  get: (endpoint, options) => request(CORE_URL, endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(CORE_URL, endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(CORE_URL, endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(CORE_URL, endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(CORE_URL, endpoint, { ...options, method: 'DELETE' }),
  baseUrl: CORE_URL,
};

export const analyticsClient = {
  get: (endpoint, options) => request(ANALYTICS_URL, endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(ANALYTICS_URL, endpoint, { ...options, method: 'POST', body }),
  delete: (endpoint, options) => request(ANALYTICS_URL, endpoint, { ...options, method: 'DELETE' }),
  baseUrl: ANALYTICS_URL,
};
