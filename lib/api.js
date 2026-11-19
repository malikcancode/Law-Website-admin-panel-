export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'leads_admin_token';
const ADMIN_KEY = 'leads_admin_user';

export const auth = {
  getToken: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  getAdmin: () => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(ADMIN_KEY));
    } catch {
      return null;
    }
  },
  save: (token, admin) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body, raw = false } = {}) {
  const headers = {};
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Make sure the API is running.', 0);
  }

  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth/login')) {
    auth.clear();
    window.location.href = '/login';
    throw new ApiError('Session expired', 401);
  }

  if (raw) {
    if (!res.ok) throw new ApiError('Download failed', res.status);
    return res;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || 'Something went wrong', res.status, data);
  return data;
}

export const toQuery = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};
