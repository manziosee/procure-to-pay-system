import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import { CheckCircle, Error, Api } from '@mui/icons-material';
import { testApiIntegration } from '../utils/apiTest';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  message: string;
}

const ApiTestPanel: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      const testResults = await testApiIntegration();
      setResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const totalCount = results.length;

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Api color="primary" />
          <Typography variant="h5">API Integration Test</Typography>
          <Button
            variant="contained"
            onClick={runTests}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : <Api />}
          >
            {testing ? 'Testing...' : 'Run Tests'}
          </Button>
        </Box>

        {results.length > 0 && (
          <Box mb={3}>
            <Chip
              label={`${successCount}/${totalCount} Passed`}
              color={successCount === totalCount ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
        )}

        <List>
          {results.map((result, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {result.status === 'success' ? (
                  <CheckCircle color="success" />
                ) : (
                  <Error color="error" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={result.endpoint}
                secondary={result.message}
                primaryTypographyProps={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              />
            </ListItem>
          ))}
        </List>

        {results.length === 0 && !testing && (
          <Typography color="textSecondary" textAlign="center">
            Click "Run Tests" to verify API integration
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiTestPanel;