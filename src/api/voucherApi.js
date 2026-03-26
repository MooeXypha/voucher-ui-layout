const RAW_BASE_URL = String(import.meta.env.VITE_API_URL || '').trim();
const RAW_FALLBACK_URL = String(import.meta.env.VITE_API_FALLBACK_URL || '').trim();
const DEFAULT_PRODUCTION_BASE_URL = 'https://voucher-admin-service.onrender.com';
const DEPRECATED_BASE_URLS = new Set(['https://voucher-service-w60f.onrender.com']);

function normalizeBaseUrl(value) {
  if (!value) return '';

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/\/+$/, '');
  }

  if (value.startsWith('//')) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    return `${protocol}${value}`.replace(/\/+$/, '');
  }

  return `https://${value}`.replace(/\/+$/, '');
}

function resolveBaseUrl(value) {
  const normalizedValue = normalizeBaseUrl(value);

  if (!normalizedValue) return '';
  if (DEPRECATED_BASE_URLS.has(normalizedValue)) return DEFAULT_PRODUCTION_BASE_URL;

  return normalizedValue;
}

const BASE_URL =
  resolveBaseUrl(RAW_BASE_URL) ||
  (import.meta.env.DEV ? 'http://localhost:3000' : DEFAULT_PRODUCTION_BASE_URL);

const FALLBACK_BASE_URL = resolveBaseUrl(RAW_FALLBACK_URL);

function extractErrorMessage(responseData) {
  if (typeof responseData === 'string' && responseData.trim()) return responseData;
  if (Array.isArray(responseData)) return responseData.join(', ');

  if (responseData && typeof responseData === 'object') {
    if (typeof responseData.message === 'string' && responseData.message.trim()) {
      return responseData.message;
    }
    if (Array.isArray(responseData.message)) {
      return responseData.message.join(', ');
    }
    if (typeof responseData.error === 'string' && responseData.error.trim()) {
      return responseData.error;
    }
  }

  return 'Request failed';
}

function looksLikeHtmlResponse(responseText, contentType) {
  const normalizedType = String(contentType || '').toLowerCase();
  if (normalizedType.includes('text/html')) return true;

  const normalizedText = String(responseText || '').trim().toLowerCase();
  return normalizedText.startsWith('<!doctype html') || normalizedText.startsWith('<html');
}

async function request(method, path, { params, data } = {}) {
  if (!BASE_URL) {
    throw new Error('VITE_API_URL is missing');
  }

  const normalizedMethod = String(method).toUpperCase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const requestUrl = new URL(`${BASE_URL}${normalizedPath}`);

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      requestUrl.searchParams.append(key, String(value));
    });
  }

  const hasBody = data !== undefined;

  const requestInit = {
    method: normalizedMethod,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(hasBody ? { body: JSON.stringify(data) } : {}),
    cache: 'no-store',
  };

  let response;

  try {
    response = await fetch(requestUrl.toString(), requestInit);
  } catch (primaryError) {
    const fallbackUrl = buildFallbackUrl(path, params);

    if (fallbackUrl) {
      try {
        response = await fetch(fallbackUrl, requestInit);
      } catch (fallbackError) {
        throw buildNetworkError(requestUrl.toString(), primaryError, fallbackUrl, fallbackError);
      }
    } else {
      throw buildNetworkError(requestUrl.toString(), primaryError);
    }
  }

  const contentType = response.headers.get('content-type') || '';
  const responseText = response.status === 204 ? '' : await response.text();

  if (response.ok && looksLikeHtmlResponse(responseText, contentType)) {
    throw new Error('API endpoint resolved to HTML. Check VITE_API_URL.');
  }

  let responseData;
  if (contentType.includes('application/json')) {
    responseData = responseText ? JSON.parse(responseText) : null;
  } else {
    responseData = responseText;
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(responseData));
  }

  return {
    data: responseData,
    status: response.status,
  };
}

function buildFallbackUrl(path, params) {
  if (!FALLBACK_BASE_URL || FALLBACK_BASE_URL === BASE_URL) return null;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fallbackUrl = new URL(`${FALLBACK_BASE_URL}${normalizedPath}`);

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      fallbackUrl.searchParams.append(key, String(value));
    });
  }

  return fallbackUrl.toString();
}

function buildNetworkError(primaryUrl, primaryError, fallbackUrl, fallbackError) {
  const primaryReason =
    primaryError instanceof Error && primaryError.message ? primaryError.message : 'Unknown network error';

  if (!fallbackUrl) {
    return new Error(`Network request failed for ${primaryUrl}. ${primaryReason}`);
  }

  const fallbackReason =
    fallbackError instanceof Error && fallbackError.message ? fallbackError.message : 'Unknown network error';

  return new Error(
    `Network request failed for ${primaryUrl} (${primaryReason}) and fallback ${fallbackUrl} (${fallbackReason}).`
  );
}

function buildVoucherPayload(data) {
  if (!data || typeof data !== 'object') return data;

  const { buyerPhoneNumber, ...rest } = data;
  const normalizedPhone = String(buyerPhoneNumber || '').trim();

  return {
    ...rest,
    buyerPhoneNumber: normalizedPhone,
  };
}

export const getVouchers = (params) => request('GET', '/vouchers', { params });
export const getVoucherById = (id) => request('GET', `/vouchers/${id}`);

export const createVoucher = (data) => request('POST', '/vouchers', { data: buildVoucherPayload(data) });

export const updateVoucher = (id, data) =>
  request('PUT', `/vouchers/${id}`, { data: buildVoucherPayload(data) });
export const deleteVoucher = (id) => request('DELETE', `/vouchers/${id}`);