import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ Change this to your Railway backend URL after deploying
const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      await SecureStore.deleteItemAsync('token');
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const transactionsApi = {
  list: (params?: object) => api.get('/transactions', { params }),
  create: (data: object) => api.post('/transactions', data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
};

export const debtsApi = {
  list: () => api.get('/debts'),
  create: (data: object) => api.post('/debts', data),
  addPayment: (id: string, data: object) => api.post(`/debts/${id}/payments`, data),
};

export const savingsApi = {
  list: () => api.get('/savings'),
  create: (data: object) => api.post('/savings', data),
  contribute: (id: string, data: object) => api.post(`/savings/${id}/contribute`, data),
};

export const reportsApi = {
  monthly: (year: number, month: number) =>
    api.get('/reports/monthly', { params: { year, month } }),
};

export const aiApi = {
  insights: () => api.get('/ai/insights'),
};
