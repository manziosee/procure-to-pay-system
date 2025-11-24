// Simple test script to verify API integration
import axios from 'axios';

const API_URL = 'https://procure-to-pay-backend.fly.dev/api';

const testAPI = async () => {
  console.log('🚀 Testing API Integration with Production Backend...\n');

  try {
    // Test 1: API Root
    console.log('1. Testing API Root...');
    const rootResponse = await axios.get(`${API_URL}/`);
    console.log('✅ API Root Response:', rootResponse.status, rootResponse.data);

    // Test 2: Login
    console.log('\n2. Testing Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login/`, {
      username: 'staff1',
      password: 'password123'
    });
    console.log('✅ Login Response:', loginResponse.status);
    console.log('Token received:', !!loginResponse.data.access);

    const token = loginResponse.data.access;

    // Test 3: Get Profile
    console.log('\n3. Testing Profile...');
    const profileResponse = await axios.get(`${API_URL}/auth/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile Response:', profileResponse.status);
    console.log('User:', profileResponse.data);

    // Test 4: Get Requests
    console.log('\n4. Testing Get Requests...');
    const requestsResponse = await axios.get(`${API_URL}/requests/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Requests Response:', requestsResponse.status);
    console.log('Requests count:', requestsResponse.data.results?.length || requestsResponse.data.length || 0);

    // Test 5: Create Request
    console.log('\n5. Testing Create Request...');
    const formData = new FormData();
    formData.append('title', 'Frontend Integration Test');
    formData.append('description', 'Testing frontend integration with backend API');
    formData.append('amount', '250.00');
    formData.append('justification', 'API integration testing');
    
    // Create a simple text file for testing
    const testFile = new File(['Test proforma content'], 'test-proforma.txt', { type: 'text/plain' });
    formData.append('proforma', testFile);

    const createResponse = await axios.post(`${API_URL}/requests/`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('✅ Create Request Response:', createResponse.status);
    console.log('Created Request ID:', createResponse.data.id);

    console.log('\n🎉 All API integration tests passed!');
    console.log('✅ Axios is working correctly');
    console.log('✅ Authentication is working');
    console.log('✅ File uploads are working');
    console.log('✅ All endpoints are accessible');

    return true;

  } catch (error: any) {
    console.error('❌ API Integration Test Failed:');
    console.error('Error:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    return false;
  }
};

// Export for use in browser console
(window as any).testAPI = testAPI;

export default testAPI;