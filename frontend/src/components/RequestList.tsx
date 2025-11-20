import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Box
} from '@mui/material';
import { Link } from 'react-router-dom';
import { PurchaseRequest } from '../types';

interface RequestListProps {
  requests?: PurchaseRequest[];
  loading: boolean;
}

const RequestList: React.FC<RequestListProps> = ({ requests, loading }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests?.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.title}</TableCell>
              <TableCell>${request.amount}</TableCell>
              <TableCell>
                <Chip 
                  label={request.status.toUpperCase()} 
                  color={getStatusColor(request.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>{request.created_by_name}</TableCell>
              <TableCell>
                {new Date(request.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  component={Link}
                  to={`/requests/${request.id}`}
                  size="small"
                  variant="outlined"
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RequestList;