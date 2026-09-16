/**
 * Resilient HTTP Client
 * 
 * Provides robust fetch capabilities with:
 * - Automatic timeout handling (AbortController)
 * - HTML error response protection (avoids JSON parse crash on Vercel 404/500 pages)
 * - Standardized envelope return format: { success, data, error, status }
 */

const DEFAULT_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Execute a resilient HTTP request
 * @param {string} url - Target URL or path
 * @param {RequestInit & { timeoutMs?: number }} [options]
 * @returns {Promise<{ success: boolean, data: any, error: string | null, status: number }>}
 */
export async function request(url, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {}, ...customOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const defaultHeaders = {
      'Accept': 'application/json',
      ...headers,
    };

    // If body is an object and not FormData, stringify and set Content-Type
    if (customOptions.body && typeof customOptions.body === 'object' && !(customOptions.body instanceof FormData)) {
      customOptions.body = JSON.stringify(customOptions.body);
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...customOptions,
      headers: defaultHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let parsedData = null;

    if (contentType.includes('application/json')) {
      try {
        parsedData = await response.json();
      } catch (jsonErr) {
        parsedData = null;
      }
    } else {
      // Fallback for text/html (Vercel SPA rewrite fallback or server error)
      const text = await response.text();
      parsedData = { rawText: text.substring(0, 300) };
    }

    if (!response.ok) {
      const errorMessage =
        (parsedData && typeof parsedData === 'object' && (parsedData.error || parsedData.message)) ||
        `Request gagal dengan status ${response.status} (${response.statusText || 'Error'})`;

      return {
        success: false,
        data: parsedData,
        error: errorMessage,
        status: response.status,
      };
    }

    return {
      success: true,
      data: parsedData,
      error: null,
      status: response.status,
    };

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return {
        success: false,
        data: null,
        error: 'Koneksi ke server timeout (melebihi batas waktu). Silakan periksa koneksi internet Anda.',
        status: 408,
      };
    }

    return {
      success: false,
      data: null,
      error: err.message || 'Terjadi kesalahan jaringan.',
      status: 0,
    };
  }
}

export const apiClient = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => request(url, { ...options, method: 'PUT', body }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
};

export default apiClient;
