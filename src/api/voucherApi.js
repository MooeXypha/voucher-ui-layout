const RAW_BASE_URL = String(import.meta.env.VITE_API_URL || '').trim();

function normalizeBaseUrl(value) {
  if (!value) return '';

  // Respect explicit scheme when provided.
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  // Support protocol-relative values like //api.example.com.
  if (value.startsWith('//')) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    return `${protocol}${value}`;
  }

  // When no scheme is provided, prefer current page protocol in browser
  // to avoid mixed-content errors on https deployments.
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${value}`;
  }

  return `https://${value}`;
}

function getDevFallbackBaseUrl() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return '';
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

const BASE_URL = normalizeBaseUrl(RAW_BASE_URL) || getDevFallbackBaseUrl();

function resolveCandidateBaseUrls() {
  const baseUrls = [];

  if (BASE_URL) {
    baseUrls.push(BASE_URL);
  }

  // Always try same-origin as a fallback. This prevents hard failures when
  // VITE_API_URL points to an unreachable host/port in production.
  baseUrls.push('');

  return Array.from(new Set(baseUrls));
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
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const isApiPath = normalizedPath.startsWith('/api/');
  const pathWithoutApi = isApiPath ? normalizedPath.replace(/^\/api/, '') : normalizedPath;

  const resourceVariants = new Set([pathWithoutApi]);

  if (/^\/vouchers(\/|$)/.test(pathWithoutApi)) {
    resourceVariants.add(pathWithoutApi.replace(/^\/vouchers(\/|$)/, '/voucher$1'));
  }

  if (/^\/voucher(\/|$)/.test(pathWithoutApi)) {
    resourceVariants.add(pathWithoutApi.replace(/^\/voucher(\/|$)/, '/vouchers$1'));
  }

  const commonApiPrefixes = ['', '/api', '/api/v1', '/v1'];
  const candidates = [normalizedPath];

  for (const variant of resourceVariants) {
    for (const prefix of commonApiPrefixes) {
      const joined = `${prefix}${variant}`.replace(/\/+/g, '/');
      candidates.push(joined.startsWith('/') ? joined : `/${joined}`);
    }
  }

  // Keep explicit path variant early for faster success in already-correct setups.
  if (!isApiPath) {
    candidates.unshift(`/api${pathWithoutApi}`);
  }

  return Array.from(new Set(candidates));
}

async function request(method, path, { params, data } = {}) {
  const candidatePaths = resolveCandidatePaths(path);
  const candidateBaseUrls = resolveCandidateBaseUrls();
  const attemptedUrls = [];
  let lastError;

  for (const candidateBaseUrl of candidateBaseUrls) {
    for (const candidatePath of candidatePaths) {
      const absolutePath = candidateBaseUrl
        ? new URL(candidatePath, candidateBaseUrl).toString()
        : candidatePath;

      const requestUrl = new URL(absolutePath, window.location.origin);
      attemptedUrls.push(requestUrl.toString());

      if (params && typeof params === 'object') {
        Object.entries(params).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          requestUrl.searchParams.append(key, String(value));
        });
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        let response;
        try {
          response = await fetch(requestUrl.toString(), {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            ...(data ? { body: JSON.stringify(data) } : {}),
          });
        } finally {
          clearTimeout(timeout);
        }

        const contentType = response.headers.get('content-type') || '';
        const responseData = contentType.includes('application/json')
          ? await response.json()
          : await response.text();

        if (!response.ok) {
          const parsedMessage = extractErrorMessage(responseData);
          const statusMessage = `${response.status} ${response.statusText}`.trim();
          const errorMessage = parsedMessage || statusMessage || 'Request failed';

          // If route likely needs /api prefix, retry with the next candidate path.
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
  }

  if (lastError instanceof Error) {
    const details = attemptedUrls.length
      ? ` Tried: ${attemptedUrls.slice(0, 6).join(' | ')}${attemptedUrls.length > 6 ? ' | ...' : ''}`
      : '';

    if (lastError.message) {
      throw new Error(`${lastError.message}.${details}`.trim());
    }

    throw lastError;
  }

  throw new Error('Request failed. Check API URL and backend availability.');
}

export const getVouchers = (params) => request('GET', '/vouchers', { params });
export const getVoucherById = (id) => request('GET', `/vouchers/${id}`);
export const createVoucher = (data) => request('POST', '/vouchers', { data });
export const updateVoucher = (id, data) => request('PUT', `/vouchers/${id}`, { data });
export const deleteVoucher = (id) => request('DELETE', `/vouchers/${id}`);