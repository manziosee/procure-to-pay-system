import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://procure-to-pay-backend.fly.dev/api';

// The access token lives in memory only (never localStorage) so an XSS bug can't read it
// off disk. The refresh token never reaches JS at all - the backend sets it as an
// httpOnly cookie and /auth/refresh/ reads it server-side.
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const clearSession = () => {
  setAccessToken(null);
  localStorage.removeItem('currentUser');
  localStorage.removeItem('loginTime');
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh/') {
      originalRequest._retry = true;

      try {
        // Refresh token travels as an httpOnly cookie, so no body is needed here.
        const response = await api.post('/auth/refresh/');
        setAccessToken(response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
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
        setAccessToken(res.data.access);
      }
      return res.data;
    }),

  register: (userData: { email: string; password: string; password_confirm: string; first_name: string; last_name: string; role: string; username: string }) =>
    api.post('/auth/register/', userData),

  // Refresh token is sent as an httpOnly cookie, not a request body.
  refreshToken: () => api.post('/auth/refresh/').then((res) => {
    if (res.data.access) {
      setAccessToken(res.data.access);
    }
    return res.data;
  }),

  getProfile: () => api.get('/auth/profile/'),

  logout: () => {
    const logoutPromise = api.post('/auth/logout/');
    clearSession();
    return logoutPromise;
  },

  // Second step of login when the account has 2FA enabled
  verifyTwoFactor: (challenge: string, code: string) =>
    api.post('/auth/2fa/verify/', { challenge, code }).then((res) => {
      if (res.data.access) {
        setAccessToken(res.data.access);
      }
      return res.data;
    }),

  setupTwoFactor: () => api.post('/auth/2fa/setup/'),
  enableTwoFactor: (code: string) => api.post('/auth/2fa/enable/', { code }),
  disableTwoFactor: (password: string) => api.post('/auth/2fa/disable/', { password }),
};

// Purchase Requests API
export const purchaseRequests = {
  // Create a new purchase request (JSON body, or FormData when a file is attached)
  create: (data: FormData | Record<string, unknown>) => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return api.post('/requests/', data, { headers });
  },

  // Get all purchase requests with optional query params
  getAll: (params = {}) => api.get('/requests/', { params }),

  // Get a single purchase request by ID
  getById: (id: string) => api.get(`/requests/${id}/`),

  // Update a purchase request
  update: (id: string, data: any) => api.put(`/requests/${id}/`, data),

  // Partially update a purchase request
  partialUpdate: (id: string, data: FormData | any) => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return api.patch(`/requests/${id}/`, data, { headers });
  },

  // Delete a purchase request
  delete: (id: string) => api.delete(`/requests/${id}/`),

  // Approve a purchase request
  approve: (id: string, comments?: string) => api.patch(`/requests/${id}/approve/`, { comments: comments || '' }),

  // Reject a purchase request with a reason
  reject: (id: string, reason: string) => api.patch(`/requests/${id}/reject/`, { comments: reason }),

  // Submit receipt (includes AI validation)
  submitReceipt: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post(`/requests/${id}/submit-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Download document (Finance only)
  downloadDocument: (id: string, docType: 'proforma' | 'purchase_order' | 'receipt') => 
    api.get(`/requests/${id}/download/${docType}/`, {
      responseType: 'blob'
    })
};

// Documents API
export const documents = {
  // Process a document
  process: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'proforma');
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
    formData.append('file', file);
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
    formData.append('file', file);
    return api.post(`/proforma/po/${poId}/validate-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// Finance API
export const finance = {
  uploadDocument: (data: FormData) => api.post('/finance/documents/', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  exportReport: () => api.get('/finance/documents/export_financial_report/', {
    responseType: 'blob'
  }),

  generateAlerts: () => api.post('/finance/alerts/generate_alerts/'),

  // Budget management (finance only)
  getBudgets: () => api.get('/finance/budgets/'),
  createBudget: (data: { department: string; monthly_limit: number }) => api.post('/finance/budgets/', data),
  updateBudget: (id: number, data: { department?: string; monthly_limit?: number }) => api.patch(`/finance/budgets/${id}/`, data),
  deleteBudget: (id: number) => api.delete(`/finance/budgets/${id}/`),
  getBudgetStatus: () => api.get('/finance/budgets/status_report/'),
};

// Vendor directory (read-only)
export const vendors = {
  getAll: () => api.get('/vendors/'),
};

// API Root
export const getApiRoot = () => api.get('/');

// Export all API services
export default {
  auth,
  purchaseRequests,
  documents,
  proforma,
  finance,
  getApiRoot
};