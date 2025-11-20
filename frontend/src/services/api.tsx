import axios, { AxiosResponse } from 'axios';
import { User, PurchaseRequest, LoginCredentials, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<{ access: string; refresh: string }> = await api.post('/auth/login/', credentials);
    const profile: AxiosResponse<User> = await api.get('/auth/profile/', {
      headers: { Authorization: `Bearer ${response.data.access}` }
    });
    return { ...response.data, user: profile.data };
  },
  
  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/auth/profile/');
    return response.data;
  }
};

export const requestService = {
  getRequests: async (): Promise<PurchaseRequest[]> => {
    const response: AxiosResponse<PurchaseRequest[]> = await api.get('/requests/');
    return response.data;
  },
  
  createRequest: async (data: FormData): Promise<PurchaseRequest> => {
    const response: AxiosResponse<PurchaseRequest> = await api.post('/requests/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  getRequest: async (id: number): Promise<PurchaseRequest> => {
    const response: AxiosResponse<PurchaseRequest> = await api.get(`/requests/${id}/`);
    return response.data;
  },
  
  approveRequest: async (id: number, comments: string): Promise<PurchaseRequest> => {
    const response: AxiosResponse<PurchaseRequest> = await api.patch(`/requests/${id}/approve/`, { comments });
    return response.data;
  },
  
  rejectRequest: async (id: number, comments: string): Promise<PurchaseRequest> => {
    const response: AxiosResponse<PurchaseRequest> = await api.patch(`/requests/${id}/reject/`, { comments });
    return response.data;
  },
  
  submitReceipt: async (id: number, receipt: File): Promise<PurchaseRequest> => {
    const formData = new FormData();
    formData.append('receipt', receipt);
    const response: AxiosResponse<PurchaseRequest> = await api.post(`/requests/${id}/submit_receipt/`, formData);
    return response.data;
  }
};

export default api;