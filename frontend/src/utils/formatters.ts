import type { RequestStatus, UserRole, ApprovalLevel } from '../types/enums';

export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
  }).format(num);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatStatus = (status: RequestStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const formatRole = (role: UserRole): string => {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export const formatApprovalLevel = (level: ApprovalLevel): string => {
  return level === 'level_1' ? 'Level 1 Approval' : 'Level 2 Approval';
};