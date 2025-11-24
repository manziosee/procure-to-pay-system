// Simple test without file upload to verify basic API integration
const axios = require('axios');

const API_URL = 'https://procure-to-pay-backend.fly.dev/api';

const testSimpleAPI = async () => {
  console.log('🚀 Testing Simple API Integration (no file upload)...\n');

  try {
    // Test 1: Login
    console.log('1. Testing Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login/`, {
      username: 'staff1',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.status);
    const token = loginResponse.data.access;

    // Test 2: Get Profile
    console.log('\n2. Testing Profile...');
    const profileResponse = await axios.get(`${API_URL}/auth/profile/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Profile:', profileResponse.data);

    // Test 3: Get Requests
    console.log('\n3. Testing Get Requests...');
    const requestsResponse = await axios.get(`${API_URL}/requests/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Requests count:', requestsResponse.data.results?.length || requestsResponse.data.length);

    // Test 4: Test different user roles
    console.log('\n4. Testing Approver Login...');
    const approverLogin = await axios.post(`${API_URL}/auth/login/`, {
      username: 'approver1',
      password: 'password123'
    });
    console.log('✅ Approver login successful');

    const approverProfile = await axios.get(`${API_URL}/auth/profile/`, {
      headers: { 'Authorization': `Bearer ${approverLogin.data.access}` }
    });
    console.log('✅ Approver profile:', approverProfile.data.role);

    // Test 5: Finance user
    console.log('\n5. Testing Finance Login...');
    const financeLogin = await axios.post(`${API_URL}/auth/login/`, {
      username: 'finance1',
      password: 'password123'
    });
    console.log('✅ Finance login successful');

    const financeProfile = await axios.get(`${API_URL}/auth/profile/`, {
      headers: { 'Authorization': `Bearer ${financeLogin.data.access}` }
    });
    console.log('✅ Finance profile:', financeProfile.data.role);

    console.log('\n🎉 BASIC API INTEGRATION WORKING!');
    console.log('\n📋 Verified:');
    console.log('   ✅ Axios HTTP client working');
    console.log('   ✅ Authentication endpoints working');
    console.log('   ✅ JWT tokens working');
    console.log('   ✅ Profile endpoints working');
    console.log('   ✅ Request listing working');
    console.log('   ✅ All user roles working');
    console.log('\n⚠️  File upload needs backend fix for proforma processing');

    return true;

  } catch (error) {
    console.error('❌ API Test Failed:');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    return false;
  }
};

testSimpleAPI();