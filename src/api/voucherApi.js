const RAW_BASE_URL = String(import.meta.env.VITE_API_URL || '').trim();

function normalizeBaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `http://${value}`;
}

function getDevFallbackBaseUrl() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return '';
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

const BASE_URL = normalizeBaseUrl(RAW_BASE_URL) || getDevFallbackBaseUrl();

function resolveRequestUrl(path) {
  if (!BASE_URL) return path;
  return new URL(path, BASE_URL).toString();
}

function extractErrorMessage(responseData) {
  if (typeof responseData === 'string' && responseData.trim()) return responseData;
  if (Array.isArray(responseData)) return responseData.join(', ');

  if (responseData && typeof responseData === 'object') {
    const payload = responseData;

    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    if (Array.isArray(payload.message)) return payload.message.join(', ');
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  }

  return '';
}

function resolveCandidatePaths(path) {
  if (path.startsWith('/api/')) return [path];
  return [path, `/api${path}`];
}

async function request(method, path, { params, data } = {}) {
  const candidatePaths = resolveCandidatePaths(path);
  let lastError;

  for (const candidatePath of candidatePaths) {
    const requestUrl = new URL(resolveRequestUrl(candidatePath), window.location.origin);

    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        requestUrl.searchParams.append(key, String(value));
      });
    }

    try {
      const response = await fetch(requestUrl.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });

      const contentType = response.headers.get('content-type') || '';
      const responseData = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const parsedMessage = extractErrorMessage(responseData);
        const statusMessage = `${response.status} ${response.statusText}`.trim();
        const errorMessage = parsedMessage || statusMessage || 'Request failed';

        // If route likely needs /api prefix, retry with the next candidate.
        if (response.status === 404 && candidatePath === path && candidatePaths.length > 1) {
          lastError = new Error(errorMessage);
          continue;
        }

        throw new Error(errorMessage);
      }

      return {
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Request failed. Check API URL and backend availability.');
}

export const getVouchers = (params) => request('GET', '/vouchers', { params });
export const getVoucherById = (id) => request('GET', `/vouchers/${id}`);
export const createVoucher = (data) => request('POST', '/vouchers', { data });
export const updateVoucher = (id, data) => request('PUT', `/vouchers/${id}`, { data });
export const deleteVoucher = (id) => request('DELETE', `/vouchers/${id}`);