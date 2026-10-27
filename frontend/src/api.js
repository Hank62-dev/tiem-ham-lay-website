const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Có lỗi khi kết nối với tiệm.');
  return body;
}

export const fetchProducts = () => request('/products').then((result) => result.data);
export const createOrder = (payload, idempotencyKey) => request('/orders', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload) }).then((result) => result.data);
export const adminLogin = (email, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }).then((result) => result.data);
export const adminRequest = (path, options = {}) => request(path, { ...options, headers: { Authorization: `Bearer ${localStorage.getItem('hamlay-admin-token') || ''}`, ...(options.headers || {}) } });
export { API_URL };
