import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseRequest } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for approvals
const mockRequests: PurchaseRequest[] = [
  {
    id: 1,
    title: 'Office Supplies',
    description: 'Pens, papers, and other office supplies',
    amount: '250.00',
    status: 'pending',
    created_by: 1,
    created_by_name: 'John Staff',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    approvals: []
  },
  {
    id: 2,
    title: 'Laptop Computer',
    description: 'Dell Laptop for new employee',
    amount: '1200.00',
    status: 'pending',
    created_by: 1,
    created_by_name: 'John Staff',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-12T14:00:00Z',
    approvals: []
  },
  {
    id: 3,
    title: 'Software License',
    description: 'Adobe Creative Suite license',
    amount: '600.00',
    status: 'approved',
    created_by: 1,
    created_by_name: 'John Staff',
    created_at: '2024-01-08T11:00:00Z',
    updated_at: '2024-01-09T16:00:00Z',
    approvals: []
  },
  {
    id: 4,
    title: 'Marketing Materials',
    description: 'Brochures and business cards',
    amount: '150.00',
    status: 'rejected',
    created_by: 1,
    created_by_name: 'John Staff',
    created_at: '2024-01-05T14:00:00Z',
    updated_at: '2024-01-06T10:00:00Z',
    approvals: []
  }
];

export default function Approvals() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setRequests(mockRequests);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Check if user is an approver
  if (!user?.role?.includes('approver')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Access denied. Approver role required.</p>
        <Button asChild className="bg-black text-white hover:bg-gray-800">
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const reviewedRequests = requests.filter(req => req.status !== 'pending');

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const handleApprove = async (request: PurchaseRequest) => {
    try {
      console.log('Approving request:', request.id);
      // Here you would call the API
      // await purchaseRequests.approve(request.id);
      alert('Request approved successfully!');
      setApproveDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (request: PurchaseRequest) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      console.log('Rejecting request:', request.id, 'Reason:', rejectReason);
      // Here you would call the API
      // await purchaseRequests.reject(request.id, rejectReason);
      alert('Request rejected successfully!');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const RequestTable = ({ requests, showActions = false }: { requests: PurchaseRequest[], showActions?: boolean }) => (
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
                <Badge variant={getStatusVariant(request.status)} className="text-xs">
                  {request.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-black">{request.created_by_name}</TableCell>
              <TableCell className="text-black">{formatDate(request.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="sm" className="hover:bg-gray-100">
                    <Link to={`/requests/${request.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  {showActions && request.status === 'pending' && (
                    <>
                      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-green-600 text-white hover:bg-green-700 transition-all duration-300 hover:scale-105"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border border-gray-300 shadow-xl">
                          <DialogHeader>
                            <DialogTitle className="text-black">Approve Request</DialogTitle>
                            <DialogDescription className="text-gray-600">
                              Are you sure you want to approve "{selectedRequest?.title}"?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() => selectedRequest && handleApprove(selectedRequest)}
                            >
                              Approve
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            style={{ backgroundColor: '#dc2626', color: 'white', border: '2px solid #dc2626' }}
                            className="hover:bg-red-700 shadow-lg font-bold px-4 py-2 rounded transition-all duration-300 hover:scale-105"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border border-gray-300 shadow-xl">
                          <DialogHeader>
                            <DialogTitle className="text-black">Reject Request</DialogTitle>
                            <DialogDescription className="text-gray-600">
                              Please provide a reason for rejecting "{selectedRequest?.title}".
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Label htmlFor="reason" className="text-black">Reason for rejection</Label>
                            <Textarea
                              id="reason"
                              placeholder="Enter reason for rejection..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="border-gray-300 focus:border-black focus:ring-black"
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setRejectDialogOpen(false);
                              setRejectReason('');
                            }}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => selectedRequest && handleReject(selectedRequest)}
                            >
                              Reject
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Approvals</h1>
          <p className="text-gray-600">
            Manage purchase request approvals - {user.role.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="text-sm text-gray-600">
            {pendingRequests.length} pending approval
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-gray-200 hover:border-black transition-all duration-300 hover:scale-105 transform hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-black">Pending Approval</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{pendingRequests.length}</div>
            <p className="text-xs text-gray-600">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:border-black transition-all duration-300 hover:scale-105 transform hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-black">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {reviewedRequests.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-xs text-gray-600">Successfully approved</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:border-black transition-all duration-300 hover:scale-105 transform hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-black">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {reviewedRequests.filter(r => r.status === 'rejected').length}
            </div>
            <p className="text-xs text-gray-600">Declined requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="pending" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Reviewed ({reviewedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="p-8 border-gray-200">
              <p className="text-center text-gray-600">No pending requests for approval</p>
            </Card>
          ) : (
            <RequestTable requests={pendingRequests} showActions={true} />
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedRequests.length === 0 ? (
            <Card className="p-8 border-gray-200">
              <p className="text-center text-gray-600">No reviewed requests</p>
            </Card>
          ) : (
            <RequestTable requests={reviewedRequests} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}