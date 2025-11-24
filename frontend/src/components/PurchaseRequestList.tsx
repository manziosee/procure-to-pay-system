import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { MoreVert, CheckCircle, Cancel, Receipt } from '@mui/icons-material';
import { usePurchaseRequests, useApprovePurchaseRequest, useRejectPurchaseRequest } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';

interface PurchaseRequest {
  id: number;
  title: string;
  description: string;
  amount: string;
  status: 'pending' | 'approved_level_1' | 'approved_level_2' | 'rejected';
  created_at: string;
  created_by: {
    username: string;
    first_name: string;
    last_name: string;
  };
}

const PurchaseRequestList: React.FC = () => {
  const { user } = useAuth();
  const { data: requestsResponse, isLoading, error } = usePurchaseRequests();
  const approveMutation = useApprovePurchaseRequest();
  const rejectMutation = useRejectPurchaseRequest();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRequest, setSelectedRequest] = React.useState<number | null>(null);

  const requests = requestsResponse?.data?.results || requestsResponse?.data || [];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, requestId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(requestId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequest(null);
  };

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync(id.toString());
      handleMenuClose();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await rejectMutation.mutateAsync({ id: id.toString(), reason });
        handleMenuClose();
      } catch (error) {
        console.error('Failed to reject request:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved_level_1':
        return 'info';
      case 'approved_level_2':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved_level_1':
        return 'Approved Level 1';
      case 'approved_level_2':
        return 'Fully Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const canApprove = (request: PurchaseRequest) => {
    if (!user) return false;
    
    if (user.role === 'approver_level_1' && request.status === 'pending') {
      return true;
    }
    
    if (user.role === 'approver_level_2' && request.status === 'approved_level_1') {
      return true;
    }
    
    return false;
  };

  const canReject = (request: PurchaseRequest) => {
    if (!user) return false;
    
    return (user.role === 'approver_level_1' || user.role === 'approver_level_2') &&
           (request.status === 'pending' || request.status === 'approved_level_1');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load purchase requests: {error.message}
      </Alert>
    );
  }

  if (!requests.length) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="text.secondary">
          No purchase requests found
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Purchase Requests
      </Typography>

      <Grid container spacing={2}>
        {requests.map((request: PurchaseRequest) => (
          <Grid item xs={12} md={6} lg={4} key={request.id}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h3">
                    {request.title}
                  </Typography>
                  
                  {(canApprove(request) || canReject(request)) && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, request.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {request.description}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color="primary">
                    ${parseFloat(request.amount).toLocaleString()}
                  </Typography>
                  
                  <Chip
                    label={getStatusLabel(request.status)}
                    color={getStatusColor(request.status) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Created by: {request.created_by.first_name} {request.created_by.last_name}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Date: {new Date(request.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedRequest && requests.find((r: PurchaseRequest) => r.id === selectedRequest) && (
          <>
            {canApprove(requests.find((r: PurchaseRequest) => r.id === selectedRequest)!) && (
              <MenuItem
                onClick={() => handleApprove(selectedRequest)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle sx={{ mr: 1 }} />
                Approve
              </MenuItem>
            )}
            
            {canReject(requests.find((r: PurchaseRequest) => r.id === selectedRequest)!) && (
              <MenuItem
                onClick={() => handleReject(selectedRequest)}
                disabled={rejectMutation.isPending}
              >
                <Cancel sx={{ mr: 1 }} />
                Reject
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </Box>
  );
};

export default PurchaseRequestList;