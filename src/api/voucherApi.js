const DEFAULT_BASE_URL = 'https://voucher-admin-service.onrender.com';
const RAW_BASE_URL = String(import.meta.env.VITE_API_URL || '').trim();

const BASE_URL = (RAW_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

function toErrorMessage(payload) {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (Array.isArray(payload)) return payload.join(', ');

  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    if (Array.isArray(payload.message)) return payload.message.join(', ');
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  }

  return 'Request failed';
}

function buildUrl(path, params) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${normalizedPath}`);

  if (!params || typeof params !== 'object') return url;

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.append(key, String(value));
  });

  return url;
}

async function request(method, path, { params, data } = {}) {
  const hasBody = data !== undefined;
  const response = await fetch(buildUrl(path, params), {
    method: String(method).toUpperCase(),
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(data) : undefined,
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') || '';
  const text = response.status === 204 ? '' : await response.text();
  const payload = contentType.includes('application/json') && text ? JSON.parse(text) : text || null;

  if (!response.ok) {
    throw new Error(toErrorMessage(payload));
  }

  return { data: payload, status: response.status };
}

function buildVoucherPayload(data) {
  if (!data || typeof data !== 'object') return data;

  const { buyerPhoneNumber, accountUserName, ...rest } = data;
  const normalizedPhone = String(buyerPhoneNumber || '').trim();
  const normalizedAccountUserName = String(accountUserName || '').trim();

  return {
    ...rest,
    // Keep both naming variants for compatibility across backend revisions.
    buyerPhoneNumber: normalizedPhone,
    buyerPhoneNo: normalizedPhone,
    accountUserName: normalizedAccountUserName,
    accountUsername: normalizedAccountUserName,
  };
}

export const getVouchers = (params) => request('GET', '/voucher', { params });
export const getVoucherById = (id) => request('GET', `/voucher/${id}`);

export const createVoucher = (data) => request('POST', '/voucher', { data: buildVoucherPayload(data) });

export const updateVoucher = (id, data) =>
  request('PATCH', `/voucher/${id}`, { data: buildVoucherPayload(data) });
export const deleteVoucher = (id) => request('DELETE', `/voucher/${id}`);