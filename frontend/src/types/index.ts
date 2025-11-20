export type UserRole = 'staff' | 'approver_level_1' | 'approver_level_2' | 'finance';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string;
}

export interface PurchaseRequest {
  id: number;
  title: string;
  description: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  proforma?: string;
  purchase_order?: string;
  receipt?: string;
  approvals: Approval[];
}

export interface Approval {
  id: number;
  approver: number;
  approver_name: string;
  approved: boolean | null;
  comments: string;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ValidationResult {
  itemsMatch: boolean;
  pricesMatch: boolean;
  vendorMatch: boolean;
  discrepancies: string[];
}

export interface RequestFilters {
  status?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}