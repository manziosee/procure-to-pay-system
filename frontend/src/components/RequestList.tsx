import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Download, FileText, Calendar, User, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseRequest } from '@/types';
import { formatDate } from '@/utils/formatters';
import { formatCurrency } from '@/utils/currency';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center space-x-3 py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
        <span className="text-sm font-medium text-gray-600">Loading requests...</span>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1">No requests found</h3>
        <p className="text-sm text-gray-500">There are no purchase requests to display at this time.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Title
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Amount
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Created By
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Created At
              </div>
            </TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-black">{request.title}</span>
                  {request.description && (
                    <span className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {request.description}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-black">{formatCurrency(request.amount)}</TableCell>
              <TableCell>
                <StatusBadge status={request.status as 'pending' | 'approved' | 'rejected'} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-gray-600" />
                  </div>
                  <span>{request.created_by_name}</span>
                </div>
              </TableCell>
              <TableCell>{formatDate(request.created_at)}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {user?.role === 'finance' ? (
                      <div className="flex gap-2">
                        {request.proforma && (
                          <Button
                            variant="outline"
                            size="sm"
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
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Proforma
                          </Button>
                        )}
                        {request.purchase_order && (
                          <Button
                            variant="outline"
                            size="sm"
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
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            PO
                          </Button>
                        )}
                        {request.receipt && (
                          <Button
                            variant="outline"
                            size="sm"
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
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Receipt
                          </Button>
                        )}
                        {!request.proforma && !request.purchase_order && !request.receipt && (
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-md">
                            No documents
                          </span>
                        )}
                      </div>
                    ) : user?.role !== 'staff' ? (
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/requests/${request.id}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Details
                        </Link>
                      </Button>
                    ) : null}
                    {user?.role === 'staff' && request.created_by === user.id && (
                      <>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/requests/${request.id}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link to={`/requests/${request.id}/edit`}>
                            <Edit className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(request.id)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
  );
}
