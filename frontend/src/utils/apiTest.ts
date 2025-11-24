import { auth, purchaseRequests, documents, getApiRoot } from '@/services/api';

// Test credentials (from your demo users)
const testCredentials = {
  staff: { username: 'staff1', password: 'password123' },
  approver1: { username: 'approver1', password: 'password123' },
  approver2: { username: 'approver2', password: 'password123' },
  finance: { username: 'finance1', password: 'password123' },
};

export const testApiIntegration = async () => {
  console.log('🚀 Starting API Integration Test...');
  
  try {
    // Test 1: API Root
    console.log('\n1. Testing API Root...');
    const rootResponse = await getApiRoot();
    console.log('✅ API Root:', rootResponse.data);

    // Test 2: Authentication
    console.log('\n2. Testing Authentication...');
    const loginResponse = await auth.login(testCredentials.staff);
    console.log('✅ Login successful:', loginResponse);

    // Test 3: Get Profile
    console.log('\n3. Testing Profile...');
    const profileResponse = await auth.getProfile();
    console.log('✅ Profile:', profileResponse.data);

    // Test 4: Get Purchase Requests
    console.log('\n4. Testing Purchase Requests List...');
    const requestsResponse = await purchaseRequests.getAll();
    console.log('✅ Requests:', requestsResponse.data);

    // Test 5: Create Purchase Request (with mock data)
    console.log('\n5. Testing Create Purchase Request...');
    const formData = new FormData();
    formData.append('title', 'Test Request from Frontend');
    formData.append('description', 'Testing API integration');
    formData.append('amount', '100.00');
    formData.append('justification', 'API integration test');
    
    // Create a mock file for testing
    const mockFile = new File(['test content'], 'test-proforma.txt', { type: 'text/plain' });
    formData.append('proforma', mockFile);

    const createResponse = await purchaseRequests.create(formData);
    console.log('✅ Created Request:', createResponse.data);

    // Test 6: Get Single Request
    const requestId = createResponse.data.id;
    console.log(`\n6. Testing Get Single Request (ID: ${requestId})...`);
    const singleRequestResponse = await purchaseRequests.getById(requestId.toString());
    console.log('✅ Single Request:', singleRequestResponse.data);

    console.log('\n🎉 All API tests passed successfully!');
    return true;

  } catch (error: any) {
    console.error('❌ API Test Failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return false;
  }
};

export const testAuthFlow = async () => {
  console.log('🔐 Testing Authentication Flow...');
  
  try {
    // Test login with each user type
    for (const [role, credentials] of Object.entries(testCredentials)) {
      console.log(`\nTesting ${role} login...`);
      
      const loginResponse = await auth.login(credentials);
      console.log(`✅ ${role} login successful`);
      
      const profileResponse = await auth.getProfile();
      console.log(`✅ ${role} profile:`, profileResponse.data);
      
      // Test requests access for this role
      const requestsResponse = await purchaseRequests.getAll();
      console.log(`✅ ${role} can access ${requestsResponse.data.results?.length || requestsResponse.data.length || 0} requests`);
    }
    
    console.log('\n🎉 Authentication flow test completed!');
    return true;
    
  } catch (error: any) {
    console.error('❌ Auth Flow Test Failed:', error);
    return false;
  }
};

export const testApprovalFlow = async () => {
  console.log('✅ Testing Approval Flow...');
  
  try {
    // Login as staff and create request
    console.log('\n1. Staff creating request...');
    await auth.login(testCredentials.staff);
    
    const formData = new FormData();
    formData.append('title', 'Approval Flow Test Request');
    formData.append('description', 'Testing the approval workflow');
    formData.append('amount', '500.00');
    formData.append('justification', 'Testing approval flow');
    
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    formData.append('proforma', mockFile);
    
    const createResponse = await purchaseRequests.create(formData);
    const requestId = createResponse.data.id.toString();
    console.log('✅ Request created:', requestId);
    
    // Login as approver level 1 and approve
    console.log('\n2. Level 1 Approver reviewing...');
    await auth.login(testCredentials.approver1);
    
    const approveResponse = await purchaseRequests.approve(requestId);
    console.log('✅ Level 1 approval:', approveResponse.data.status);
    
    // Login as approver level 2 and approve
    console.log('\n3. Level 2 Approver reviewing...');
    await auth.login(testCredentials.approver2);
    
    const finalApproveResponse = await purchaseRequests.approve(requestId);
    console.log('✅ Final approval:', finalApproveResponse.data.status);
    
    console.log('\n🎉 Approval flow test completed!');
    return true;
    
  } catch (error: any) {
    console.error('❌ Approval Flow Test Failed:', error);
    return false;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🧪 Running Complete API Integration Tests...\n');
  
  const results = {
    apiIntegration: await testApiIntegration(),
    authFlow: await testAuthFlow(),
    approvalFlow: await testApprovalFlow(),
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('API Integration:', results.apiIntegration ? '✅ PASS' : '❌ FAIL');
  console.log('Auth Flow:', results.authFlow ? '✅ PASS' : '❌ FAIL');
  console.log('Approval Flow:', results.approvalFlow ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\nOverall Result:', allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED');
  
  return results;
};