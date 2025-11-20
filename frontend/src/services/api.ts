import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  register: (userData: any) => api.post('/auth/register/', userData),
  getMe: () => api.get('/auth/me/'),
};

export const purchaseRequests = {
  create: (data: FormData) => api.post('/requests/', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getAll: (params = {}) => api.get('/requests/', { params }),
  getById: (id: string) => api.get(`/requests/${id}/`),
  update: (id: string, data: any) => api.put(`/requests/${id}/`, data),
  approve: (id: string) => api.patch(`/requests/${id}/approve/`),
  reject: (id: string, reason: string) => api.patch(`/requests/${id}/reject/`, { reason }),
  submitReceipt: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post(`/requests/${id}/submit-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const users = {
  getAll: () => api.get('/users/'),
  getApprovers: () => api.get('/users/?role__in=approver-level-1,approver-level-2'),
};

export default api;
