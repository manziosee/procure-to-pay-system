import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ApiTestComponent from '@/components/ApiTestComponent';

const TestPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          API Integration Testing
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          Test the frontend integration with the production backend API at{' '}
          <code>https://procure-to-pay-backend.fly.dev</code>
        </Typography>

        <ApiTestComponent />
      </Box>
    </Container>
  );
};

export default TestPage;