import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const cleanApiUrl = rawApiUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: cleanApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear invalid token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },
  register: async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    return res.data;
  },
};

export const billAPI = {
  uploadBill: async (file, title) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    const res = await api.post('/api/bill/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getBill: async (id) => {
    const res = await api.get(`/api/bill/${id}`);
    return res.data;
  },
  getMyBills: async () => {
    const res = await api.get('/api/bill/my-bills');
    return res.data;
  },
  deleteBill: async (id) => {
    const res = await api.delete(`/api/bill/${id}`);
    return res.data;
  },
};

export const claimAPI = {
  claimItem: async (billItemId, percentageClaimed) => {
    const res = await api.post('/api/claims', {
      billItemId,
      percentageClaimed,
    });
    return res.data;
  },
  unclaimItem: async (claimId) => {
    const res = await api.delete(`/api/claims/${claimId}`);
    return res.data;
  },
};

export default api;
