const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACCESS_KEY = 'hamlay-admin-token';
const REFRESH_KEY = 'hamlay-admin-refresh';
export const ADMIN_LOGOUT_EVENT = 'hamlay-admin-logout';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(body.message || 'Có lỗi khi kết nối với tiệm.'); error.status = response.status; error.code = body.code; throw error; }
  return body;
}

export const fetchProducts = () => request('/products').then((result) => result.data);
export const createOrder = (payload, idempotencyKey) => request('/orders', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload) }).then((result) => result.data);

const read = (key) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
const saveSession = ({ token, refreshToken }) => { try { localStorage.setItem(ACCESS_KEY, token); if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken); else localStorage.removeItem(REFRESH_KEY); } catch { /* storage unavailable */ } };
const clearSession = () => { try { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); } catch { /* storage unavailable */ } };
const endSession = () => { clearSession(); window.dispatchEvent(new Event(ADMIN_LOGOUT_EVENT)); };

export const adminLogin = (email, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }).then((result) => { saveSession(result.data); return result.data; });

// Seconds left on the access token (JWT `exp`), or 0 when it cannot be read.
const secondsLeft = (token) => { try { const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return payload.exp - Date.now() / 1000; } catch { return 0; } };

// One refresh at a time per tab. If another tab already rotated the token, reuse what it stored instead of replaying the old refresh token.
let refreshing = null;
function refreshSession() {
  if (refreshing) return refreshing;
  const sent = read(REFRESH_KEY);
  refreshing = (async () => {
    if (!sent) throw Object.assign(new Error('Phiên đăng nhập đã hết hạn.'), { status: 401 });
    try {
      const result = await request('/admin/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: sent }) });
      saveSession(result.data);
      return result.data.token;
    } catch (error) {
      const latest = read(REFRESH_KEY);
      if (error.status === 401 && latest && latest !== sent) return read(ACCESS_KEY);
      if (error.status === 401) endSession();
      throw error;
    }
  })().finally(() => { refreshing = null; });
  return refreshing;
}

export async function adminRequest(path, options = {}) {
  const send = (token) => request(path, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  let token = read(ACCESS_KEY);
  if (!token && !read(REFRESH_KEY)) { endSession(); throw Object.assign(new Error('Vui lòng đăng nhập quản trị.'), { status: 401 }); }
  if (read(REFRESH_KEY) && secondsLeft(token) < 30) token = await refreshSession();
  try { return await send(token); } catch (error) {
    if (error.status !== 401 || !read(REFRESH_KEY)) { if (error.status === 401) endSession(); throw error; }
    return send(await refreshSession());
  }
}

export async function adminLogout() {
  const refreshToken = read(REFRESH_KEY);
  clearSession();
  if (refreshToken) await request('/admin/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {});
}

export { API_URL };
