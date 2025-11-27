import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseRequest } from '@/types';
import { formatDate, formatStatus } from '@/utils/formatters';
import { formatCurrency } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RequestListProps {
  requests?: PurchaseRequest[];
  loading: boolean;
  onDelete?: (id: number) => void;
}

export default function RequestList({ requests, loading, onDelete }: RequestListProps) {
  const { user } = useAuth();

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    try {
      const { purchaseRequests } = await import('@/services/api');
      await purchaseRequests.delete(id.toString());
      
      // Update global state immediately
      if (onDelete) onDelete(id);
      
      alert('Request deleted successfully!');
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };
  if (loading) {
    return (
      <Card className="p-8 border-gray-200">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="p-8 border-gray-200">
        <p className="text-center text-gray-600">No requests found</p>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold px-3 py-1">
            🕐 PENDING
          </Badge>
        );
      case 'approved': 
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-300 font-semibold px-3 py-1">
            ✅ APPROVED
          </Badge>
        );
      case 'rejected': 
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-300 font-semibold px-3 py-1">
            ❌ REJECTED
          </Badge>
        );
      default: 
        return (
          <Badge className="bg-gray-100 text-gray-800 border border-gray-300 font-semibold px-3 py-1">
            {status.toUpperCase()}
          </Badge>
        );
    }
  };

  return (
    <Card className="border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-black">Title</TableHead>
            <TableHead className="text-black">Amount</TableHead>
            <TableHead className="text-black">Status</TableHead>
            <TableHead className="text-black">Created By</TableHead>
            <TableHead className="text-black">Created At</TableHead>
            <TableHead className="text-right text-black">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
              <TableCell className="font-medium text-black">{request.title}</TableCell>
              <TableCell className="text-black">{formatCurrency(request.amount)}</TableCell>
              <TableCell>
                {getStatusBadge(request.status)}
              </TableCell>
              <TableCell className="text-black">{request.created_by_name}</TableCell>
              <TableCell className="text-black">{formatDate(request.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {user?.role === 'finance' ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hover:bg-gray-100"
                      onClick={() => {
                        const data = `Request: ${request.title}\nAmount: ${formatCurrency(request.amount)}\nStatus: ${request.status}\nCreated By: ${request.created_by_name}\nDate: ${formatDate(request.created_at)}`;
                        const blob = new Blob([data], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `request-${request.id}-export.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="sm" className="hover:bg-gray-100">
                      <Link to={`/requests/${request.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  )}
                  {user?.role === 'staff' && request.status === 'pending' && request.created_by === user.id && (
                    <>
                      <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                        <Link to={`/requests/${request.id}/edit`}>
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleDelete(request.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}