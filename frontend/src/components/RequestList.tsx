import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Download, FileText, Calendar, User, DollarSign } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RequestListProps {
  requests?: PurchaseRequest[];
  loading: boolean;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export default function RequestList({ requests, loading, onDelete, showActions = true }: RequestListProps) {
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
      <Card className="card-premium border-2 border-gray-200 animate-pulse">
        <CardContent className="p-12">
          <div className="flex justify-center items-center space-x-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
            <span className="text-lg font-medium text-gray-600">Loading requests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="card-premium border-2 border-gray-200">
        <CardContent className="p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-600">There are no purchase requests to display at this time.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return (
          <Badge className="status-pending font-bold px-4 py-2 text-sm rounded-full shadow-sm hover:shadow-md transition-all duration-300">
            🕐 PENDING
          </Badge>
        );
      case 'approved': 
        return (
          <Badge className="status-approved font-bold px-4 py-2 text-sm rounded-full shadow-sm hover:shadow-md transition-all duration-300">
            ✅ APPROVED
          </Badge>
        );
      case 'rejected': 
        return (
          <Badge className="status-rejected font-bold px-4 py-2 text-sm rounded-full shadow-sm hover:shadow-md transition-all duration-300">
            ❌ REJECTED
          </Badge>
        );
      default: 
        return (
          <Badge className="bg-gray-100 text-gray-800 border border-gray-300 font-bold px-4 py-2 text-sm rounded-full">
            {status.toUpperCase()}
          </Badge>
        );
    }
  };

  return (
    <Card className="card-premium border-2 border-gray-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 pb-4">
        <CardTitle className="text-2xl font-bold text-black flex items-center">
          <FileText className="mr-3 h-7 w-7" />
          Purchase Requests
          <span className="ml-3 text-lg font-medium text-gray-600">({requests.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50">
                <TableHead className="text-black font-bold text-base py-4 px-6">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Title
                  </div>
                </TableHead>
                <TableHead className="text-black font-bold text-base py-4 px-6">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Amount
                  </div>
                </TableHead>
                <TableHead className="text-black font-bold text-base py-4 px-6">Status</TableHead>
                <TableHead className="text-black font-bold text-base py-4 px-6">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Created By
                  </div>
                </TableHead>
                <TableHead className="text-black font-bold text-base py-4 px-6">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Created At
                  </div>
                </TableHead>
                {showActions && (
                  <TableHead className="text-right text-black font-bold text-base py-4 px-6">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request, index) => (
                <TableRow 
                  key={request.id} 
                  className={cn(
                    "interactive-hover border-b border-gray-100 transition-all duration-300",
                    "hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-sm",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  <TableCell className="font-semibold text-black py-6 px-6">
                    <div className="flex flex-col">
                      <span className="text-lg">{request.title}</span>
                      {request.description && (
                        <span className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {request.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-black py-6 px-6">
                    <span className="text-lg font-bold">{formatCurrency(request.amount)}</span>
                  </TableCell>
                  <TableCell className="py-6 px-6">
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell className="text-black py-6 px-6">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="font-medium">{request.created_by_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-black py-6 px-6">
                    <span className="font-medium">{formatDate(request.created_at)}</span>
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right py-6 px-6">
                      <div className="flex justify-end gap-2">
                        {user?.role === 'finance' ? (
                          <div className="flex gap-2">
                            {request.proforma && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 font-semibold"
                                onClick={async () => {
                                  try {
                                    const { purchaseRequests } = await import('@/services/api');
                                    const response = await purchaseRequests.downloadDocument(request.id.toString(), 'proforma');
                                    const blob = new Blob([response.data]);
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `proforma-${request.id}.pdf`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error('Download failed:', error);
                                    alert('Failed to download proforma');
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Proforma
                              </Button>
                            )}
                            {request.purchase_order && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-300 font-semibold"
                                onClick={async () => {
                                  try {
                                    const { purchaseRequests } = await import('@/services/api');
                                    const response = await purchaseRequests.downloadDocument(request.id.toString(), 'purchase_order');
                                    const blob = new Blob([response.data]);
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `purchase-order-${request.id}.pdf`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error('Download failed:', error);
                                    alert('Failed to download purchase order');
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                PO
                              </Button>
                            )}
                            {request.receipt && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 font-semibold"
                                onClick={async () => {
                                  try {
                                    const { purchaseRequests } = await import('@/services/api');
                                    const response = await purchaseRequests.downloadDocument(request.id.toString(), 'receipt');
                                    const blob = new Blob([response.data]);
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `receipt-${request.id}.pdf`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error('Download failed:', error);
                                    alert('Failed to download receipt');
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Receipt
                              </Button>
                            )}
                            {!request.proforma && !request.purchase_order && !request.receipt && (
                              <span className="text-sm text-gray-500 px-3 py-2 bg-gray-100 rounded-lg font-medium">
                                No documents
                              </span>
                            )}
                          </div>
                        ) : user?.role !== 'staff' ? (
                          <Button 
                            asChild 
                            variant="outline" 
                            size="sm" 
                            className="border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-semibold"
                          >
                            <Link to={`/requests/${request.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </Button>
                        ) : null}
                        {user?.role === 'staff' && request.created_by === user.id && (
                          <>
                            <Button 
                              asChild 
                              variant="outline" 
                              size="sm" 
                              className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 font-semibold"
                            >
                              <Link to={`/requests/${request.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </Button>
                            <Button 
                              asChild 
                              size="sm" 
                              className="bg-green-600 text-white hover:bg-green-700 transition-all duration-300 hover:scale-105 font-semibold shadow-md"
                            >
                              <Link to={`/requests/${request.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-red-600 text-white hover:bg-red-700 transition-all duration-300 hover:scale-105 font-semibold shadow-md"
                              onClick={() => handleDelete(request.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}