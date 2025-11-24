// Test core APIs without file uploads
const axios = require('axios');

const API_URL = 'https://procure-to-pay-backend.fly.dev/api';

const testCoreAPIs = async () => {
  console.log('🚀 Testing Core API Endpoints...\n');
  
  let token = '';

  try {
    // 1. Test Login
    console.log('1. Testing Login (POST /api/auth/login/)...');
    const loginResponse = await axios.post(`${API_URL}/auth/login/`, {
      email: 'staff1@example.com',
      password: 'password123'
    });
    console.log('✅ Login:', loginResponse.status);
    token = loginResponse.data.access;

    // 2. Test Profile
    console.log('\n2. Testing Profile (GET /api/auth/profile/)...');
    const profileResponse = await axios.get(`${API_URL}/auth/profile/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Profile:', profileResponse.status, profileResponse.data.username);

    // 3. Test Refresh Token
    console.log('\n3. Testing Refresh Token (POST /api/auth/refresh/)...');
    const refreshResponse = await axios.post(`${API_URL}/auth/refresh/`, {
      refresh: loginResponse.data.refresh
    });
    console.log('✅ Refresh Token:', refreshResponse.status);

    // 4. Test List Requests
    console.log('\n4. Testing List Requests (GET /api/requests/)...');
    const listResponse = await axios.get(`${API_URL}/requests/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ List Requests:', listResponse.status, 'Count:', listResponse.data.results?.length || listResponse.data.length || 0);

    // 5. Test Approver Login
    console.log('\n5. Testing Approver Login...');
    const approverLogin = await axios.post(`${API_URL}/auth/login/`, {
      email: 'approver1@example.com',
      password: 'password123'
    });
    console.log('✅ Approver Login:', approverLogin.status);

    // 6. Test Finance Login
    console.log('\n6. Testing Finance Login...');
    const financeLogin = await axios.post(`${API_URL}/auth/login/`, {
      email: 'finance1@example.com',
      password: 'password123'
    });
    console.log('✅ Finance Login:', financeLogin.status);

    // 7. Test Level 2 Approver Login
    console.log('\n7. Testing Level 2 Approver Login...');
    const approver2Login = await axios.post(`${API_URL}/auth/login/`, {
      email: 'approver2@example.com',
      password: 'password123'
    });
    console.log('✅ Level 2 Approver Login:', approver2Login.status);

    console.log('\n🎉 ALL CORE API ENDPOINTS WORKING!');
    console.log('\n📋 Core API Status:');
    console.log('   ✅ Authentication - Working');
    console.log('   ✅ Profile Management - Working');
    console.log('   ✅ Token Refresh - Working');
    console.log('   ✅ Request Listing - Working');
    console.log('   ✅ All User Roles - Working');
    console.log('\n⚠️  File Upload APIs need backend fix for proforma processing');

    return true;

  } catch (error) {
    console.error('❌ API Test Failed:');
    console.error('   Endpoint:', error.config?.url);
    console.error('   Method:', error.config?.method?.toUpperCase());
    console.error('   Status:', error.response?.status);
    console.error('   Error:', error.response?.data || error.message);
    return false;
  }
};

testCoreAPIs().then(success => {
  process.exit(success ? 0 : 1);
});