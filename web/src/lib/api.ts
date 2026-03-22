import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login if token expires
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const transactionsApi = {
  list: (params?: object) => api.get('/transactions', { params }),
  create: (data: object) => api.post('/transactions', data),
  update: (id: string, data: object) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (data: object) => api.post('/categories', data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const debtsApi = {
  list: () => api.get('/debts'),
  create: (data: object) => api.post('/debts', data),
  update: (id: string, data: object) => api.put(`/debts/${id}`, data),
  addPayment: (id: string, data: object) => api.post(`/debts/${id}/payments`, data),
  delete: (id: string) => api.delete(`/debts/${id}`),
};

export const savingsApi = {
  list: () => api.get('/savings'),
  create: (data: object) => api.post('/savings', data),
  update: (id: string, data: object) => api.put(`/savings/${id}`, data),
  contribute: (id: string, data: object) => api.post(`/savings/${id}/contribute`, data),
  delete: (id: string) => api.delete(`/savings/${id}`),
};

export const reportsApi = {
  monthly: (year: number, month: number) =>
    api.get('/reports/monthly', { params: { year, month } }),
  yearly: (year: number) =>
    api.get('/reports/yearly', { params: { year } }),
  export: (params?: object) =>
    api.get('/reports/export', { params, responseType: 'blob' }),
};

export const aiApi = {
  insights: () => api.get('/ai/insights'),
};
