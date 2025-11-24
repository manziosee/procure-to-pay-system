// Test all APIs with existing demo users
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'https://procure-to-pay-backend.fly.dev/api';

const testExistingAPIs = async () => {
  console.log('🚀 Testing ALL API Endpoints with Demo Users...\n');
  
  let token = '';
  let requestId = '';

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
    console.log('✅ List Requests:', listResponse.status, 'Count:', listResponse.data.results?.length || listResponse.data.length);

    // 5. Test Create Request
    console.log('\n5. Testing Create Request (POST /api/requests/)...');
    fs.writeFileSync('/tmp/test-proforma.txt', 'Test proforma content for API testing');
    
    const formData = new FormData();
    formData.append('title', 'API Integration Test Request');
    formData.append('description', 'Testing all API endpoints');
    formData.append('amount', '150.00');
    formData.append('justification', 'API integration testing');
    formData.append('proforma', fs.createReadStream('/tmp/test-proforma.txt'));

    const createResponse = await axios.post(`${API_URL}/requests/`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    console.log('✅ Create Request:', createResponse.status, 'ID:', createResponse.data.id);
    requestId = createResponse.data.id;

    // 6. Test Get Single Request
    console.log('\n6. Testing Get Request (GET /api/requests/{id}/)...');
    const getResponse = await axios.get(`${API_URL}/requests/${requestId}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Get Request:', getResponse.status, 'Title:', getResponse.data.title);

    // 7. Test Update Request (PUT)
    console.log('\n7. Testing Update Request (PUT /api/requests/{id}/)...');
    const updateResponse = await axios.put(`${API_URL}/requests/${requestId}/`, {
      title: 'Updated API Test Request',
      description: 'Updated description via PUT',
      amount: '200.00',
      justification: 'Updated justification'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Update Request (PUT):', updateResponse.status);

    // 8. Test Partial Update Request (PATCH)
    console.log('\n8. Testing Partial Update (PATCH /api/requests/{id}/)...');
    const patchResponse = await axios.patch(`${API_URL}/requests/${requestId}/`, {
      title: 'Partially Updated Title'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Partial Update (PATCH):', patchResponse.status);

    // 9. Test Approve Request (need approver token)
    console.log('\n9. Testing Approve Request (PATCH /api/requests/{id}/approve/)...');
    const approverLogin = await axios.post(`${API_URL}/auth/login/`, {
      email: 'approver1@example.com',
      password: 'password123'
    });
    const approverToken = approverLogin.data.access;

    const approveResponse = await axios.patch(`${API_URL}/requests/${requestId}/approve/`, {
      comment: 'Approved via API test'
    }, {
      headers: { 'Authorization': `Bearer ${approverToken}` }
    });
    console.log('✅ Approve Request:', approveResponse.status);

    // 10. Test Reject Request (create new request first)
    console.log('\n10. Testing Reject Request (PATCH /api/requests/{id}/reject/)...');
    const formData2 = new FormData();
    formData2.append('title', 'Request to Reject');
    formData2.append('description', 'This will be rejected');
    formData2.append('amount', '100.00');
    formData2.append('justification', 'Testing rejection');
    formData2.append('proforma', fs.createReadStream('/tmp/test-proforma.txt'));

    const createResponse2 = await axios.post(`${API_URL}/requests/`, formData2, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData2.getHeaders()
      }
    });
    const rejectRequestId = createResponse2.data.id;

    const rejectResponse = await axios.patch(`${API_URL}/requests/${rejectRequestId}/reject/`, {
      reason: 'Rejected via API test'
    }, {
      headers: { 'Authorization': `Bearer ${approverToken}` }
    });
    console.log('✅ Reject Request:', rejectResponse.status);

    // 11. Test Submit Receipt
    console.log('\n11. Testing Submit Receipt (POST /api/requests/{id}/submit-receipt/)...');
    fs.writeFileSync('/tmp/test-receipt.txt', 'Test receipt content');
    
    const receiptFormData = new FormData();
    receiptFormData.append('receipt', fs.createReadStream('/tmp/test-receipt.txt'));

    const receiptResponse = await axios.post(`${API_URL}/requests/${requestId}/submit-receipt/`, receiptFormData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...receiptFormData.getHeaders()
      }
    });
    console.log('✅ Submit Receipt:', receiptResponse.status);

    // 12. Test Document Processing
    console.log('\n12. Testing Document Processing (POST /api/documents/process/)...');
    const docFormData = new FormData();
    docFormData.append('file', fs.createReadStream('/tmp/test-proforma.txt'));

    const docResponse = await axios.post(`${API_URL}/documents/process/`, docFormData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...docFormData.getHeaders()
      }
    });
    console.log('✅ Document Processing:', docResponse.status);

    // 13. Test Delete Request
    console.log('\n13. Testing Delete Request (DELETE /api/requests/{id}/)...');
    const deleteResponse = await axios.delete(`${API_URL}/requests/${rejectRequestId}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Delete Request:', deleteResponse.status);

    // Cleanup
    fs.unlinkSync('/tmp/test-proforma.txt');
    fs.unlinkSync('/tmp/test-receipt.txt');

    console.log('\n🎉 ALL API ENDPOINTS TESTED SUCCESSFULLY!');
    console.log('\n📋 API Integration Status:');
    console.log('   ✅ Authentication APIs - All Working');
    console.log('   ✅ Purchase Request CRUD - All Working');
    console.log('   ✅ Approval Workflow - Working');
    console.log('   ✅ File Upload - Working');
    console.log('   ✅ Document Processing - Working');

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

testExistingAPIs().then(success => {
  process.exit(success ? 0 : 1);
});