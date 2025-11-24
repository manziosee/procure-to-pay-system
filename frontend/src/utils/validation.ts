// Input validation utilities for frontend security

export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateTitle = (title: string): string | null => {
  if (!title || title.trim().length < 3) {
    return 'Title must be at least 3 characters long';
  }
  if (title.length > 200) {
    return 'Title cannot exceed 200 characters';
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  if (dangerousPatterns.some(pattern => pattern.test(title))) {
    return 'Title contains invalid characters';
  }
  
  return null;
};

export const validateDescription = (description: string): string | null => {
  if (!description || description.trim().length < 10) {
    return 'Description must be at least 10 characters long';
  }
  if (description.length > 2000) {
    return 'Description cannot exceed 2000 characters';
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  if (dangerousPatterns.some(pattern => pattern.test(description))) {
    return 'Description contains invalid characters';
  }
  
  return null;
};

export const validateAmount = (amount: string | number): string | null => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return 'Amount must be a positive number';
  }
  if (numAmount > 1000000) {
    return 'Amount cannot exceed 1,000,000';
  }
  
  return null;
};

export const validateFile = (file: File): string | null => {
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return 'File size cannot exceed 10MB';
  }
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return 'Only PDF, JPG, and PNG files are allowed';
  }
  
  // Check filename for dangerous characters
  const dangerousChars = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*'];
  if (dangerousChars.some(char => file.name.includes(char))) {
    return 'Filename contains invalid characters';
  }
  
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  return null;
};

// XSS prevention for display
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// CSRF token handling
export const getCsrfToken = (): string | null => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return token || null;
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();