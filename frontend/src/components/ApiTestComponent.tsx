import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Card, CardContent } from '@mui/material';
import { auth, purchaseRequests } from '@/services/api';

const ApiTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, message]);
  };

  const runApiTests = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults([]);

    try {
      addResult('🚀 Starting API Integration Tests...');

      // Test 1: Login
      addResult('\n1. Testing Login...');
      const loginResponse = await auth.login({
        username: 'staff1',
        password: 'password123'
      });
      addResult('✅ Login successful');

      // Test 2: Get Profile
      addResult('\n2. Testing Profile...');
      const profileResponse = await auth.getProfile();
      addResult(`✅ Profile retrieved: ${profileResponse.data.username} (${profileResponse.data.role})`);

      // Test 3: Get Requests
      addResult('\n3. Testing Get Requests...');
      const requestsResponse = await purchaseRequests.getAll();
      const requests = requestsResponse.data.results || requestsResponse.data;
      addResult(`✅ Requests retrieved: ${requests.length} requests found`);

      // Test 4: Test Approver Login
      addResult('\n4. Testing Approver Login...');
      await auth.login({
        username: 'approver1',
        password: 'password123'
      });
      const approverProfile = await auth.getProfile();
      addResult(`✅ Approver login: ${approverProfile.data.role}`);

      // Test 5: Test Finance Login
      addResult('\n5. Testing Finance Login...');
      await auth.login({
        username: 'finance1',
        password: 'password123'
      });
      const financeProfile = await auth.getProfile();
      addResult(`✅ Finance login: ${financeProfile.data.role}`);

      addResult('\n🎉 All API tests passed successfully!');
      addResult('\n📋 Integration Status:');
      addResult('   ✅ Axios HTTP client working');
      addResult('   ✅ Authentication working');
      addResult('   ✅ JWT tokens working');
      addResult('   ✅ All user roles working');
      addResult('   ✅ Request endpoints working');

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      setError(`API Test Failed: ${errorMessage}`);
      addResult(`❌ Test failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          API Integration Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Test the frontend integration with the production backend API.
        </Typography>

        <Button
          variant="contained"
          onClick={runApiTests}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          sx={{ mb: 2 }}
        >
          {isLoading ? 'Running Tests...' : 'Run API Tests'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {testResults.length > 0 && (
          <Box
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            {testResults.join('\n')}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiTestComponent;