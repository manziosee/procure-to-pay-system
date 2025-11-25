import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://procure-to-pay-system-xnwp.onrender.com/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh/', { refresh: refreshToken });
          const newToken = response.data.access;
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login/', credentials).then((res) => {
      if (res.data.access) {
        localStorage.setItem('token', res.data.access);
        if (res.data.refresh) {
          localStorage.setItem('refreshToken', res.data.refresh);
        }
      }
      return res.data;
    }),

  register: (userData: { email: string; password: string; password_confirm: string; first_name: string; last_name: string; role: string; username: string }) => 
    api.post('/auth/register/', userData),

  refreshToken: (refresh: string) => 
    api.post('/auth/refresh/', { refresh }),

  getProfile: () => api.get('/auth/profile/'),

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const logoutPromise = refreshToken 
      ? api.post('/auth/logout/', { refresh: refreshToken })
      : Promise.resolve();
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return logoutPromise;
  }
};

// Purchase Requests API
export const purchaseRequests = {
  // Create a new purchase request with file upload support
  create: (data: FormData) => api.post('/requests/', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Get all purchase requests with optional query params
  getAll: (params = {}) => api.get('/requests/', { params }),

  // Get a single purchase request by ID
  getById: (id: string) => api.get(`/requests/${id}/`),

  // Update a purchase request
  update: (id: string, data: any) => api.put(`/requests/${id}/`, data),

  // Partially update a purchase request
  partialUpdate: (id: string, data: any) => api.patch(`/requests/${id}/`, data),

  // Delete a purchase request
  delete: (id: string) => api.delete(`/requests/${id}/`),

  // Approve a purchase request
  approve: (id: string) => api.patch(`/requests/${id}/approve/`),

  // Reject a purchase request with a reason
  reject: (id: string, reason: string) => api.patch(`/requests/${id}/reject/`, { reason }),

  // Submit a receipt for a purchase request
  submitReceipt: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post(`/requests/${id}/submit-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// Documents API
export const documents = {
  // Process a document
  process: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/process/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// Proforma Workflow API
export const proforma = {
  // Upload proforma
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('proforma', file);
    return api.post('/proforma/proforma/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Generate PO from proforma
  generatePO: (proformaId: string) => 
    api.post(`/proforma/proforma/${proformaId}/generate-po/`),

  // Validate receipt against PO
  validateReceipt: (poId: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post(`/proforma/po/${poId}/validate-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// API Root
export const getApiRoot = () => api.get('/');

// Export all API services
export default {
  auth,
  purchaseRequests,
  documents,
  proforma,
  getApiRoot
};