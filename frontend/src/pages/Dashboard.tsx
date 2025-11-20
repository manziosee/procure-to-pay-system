import React from 'react';
import { 
  Typography, 
  Button, 
  Box,
  Grid,
  Card,
  CardContent 
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { requestService } from '../services/api';
import RequestList from '../components/RequestList';
import { PurchaseRequest } from '../types';

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: requests, isLoading } = useQuery<PurchaseRequest[]>('requests', requestService.getRequests);

  const getStats = (): Stats => {
    if (!requests) return { pending: 0, approved: 0, rejected: 0 };
    
    return requests.reduce((acc: Stats, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });
  };

  const stats = getStats();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Dashboard - {user?.role?.replace('_', ' ').toUpperCase()}
        </Typography>
        {user?.role === 'staff' && (
          <Button
            component={Link}
            to="/requests/new"
            variant="contained"
            startIcon={<Add />}
          >
            New Request
          </Button>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Pending</Typography>
              <Typography variant="h3" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Approved</Typography>
              <Typography variant="h3" color="success.main">
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Rejected</Typography>
              <Typography variant="h3" color="error.main">
                {stats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <RequestList requests={requests} loading={isLoading} />
    </Box>
  );
};

export default Dashboard;