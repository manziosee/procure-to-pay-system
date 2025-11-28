import api, { auth, purchaseRequests, documents, proforma } from '../services/api';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  message: string;
}

export const testApiIntegration = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // Test API Root
  try {
    await api.getApiRoot();
    results.push({
      endpoint: 'GET /api/',
      status: 'success',
      message: 'API root accessible'
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /api/',
      status: 'error',
      message: error.message
    });
  }

  // Test Authentication
  try {
    const loginResponse = await auth.login({
      email: 'staff1@example.com',
      password: 'password123'
    });
    
    results.push({
      endpoint: 'POST /api/auth/login/',
      status: 'success',
      message: 'Login successful'
    });

    // Test Profile
    try {
      await auth.getProfile();
      results.push({
        endpoint: 'GET /api/auth/profile/',
        status: 'success',
        message: 'Profile retrieved'
      });
    } catch (error: any) {
      results.push({
        endpoint: 'GET /api/auth/profile/',
        status: 'error',
        message: error.message
      });
    }

    // Test Purchase Requests
    try {
      await purchaseRequests.getAll();
      results.push({
        endpoint: 'GET /api/requests/',
        status: 'success',
        message: 'Requests retrieved'
      });
    } catch (error: any) {
      results.push({
        endpoint: 'GET /api/requests/',
        status: 'error',
        message: error.message
      });
    }

    // Test Logout
    try {
      await auth.logout();
      results.push({
        endpoint: 'POST /api/auth/logout/',
        status: 'success',
        message: 'Logout successful'
      });
    } catch (error: any) {
      results.push({
        endpoint: 'POST /api/auth/logout/',
        status: 'error',
        message: error.message
      });
    }

  } catch (error: any) {
    results.push({
      endpoint: 'POST /api/auth/login/',
      status: 'error',
      message: error.message
    });
  }

  return results;
};