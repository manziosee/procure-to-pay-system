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
import { useRequestsSync } from '@/hooks/useRequestsSync';
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
  const { requests: allRequests, isLoading, loadRequests } = useRequestsSync();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    // Show all requests for approvers to see their complete history
    setRequests(allRequests);
  }, [allRequests]);

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

  // Filter requests based on approver's individual actions
  const pendingRequests = requests.filter(req => {
    const userApproval = req.approvals?.find(approval => 
      approval.approver === user?.id || approval.approver_id === user?.id
    );
    return !userApproval && req.status === 'pending';
  });
  
  const reviewedRequests = requests.filter(req => {
    const userApproval = req.approvals?.find(approval => 
      approval.approver === user?.id || approval.approver_id === user?.id
    );
    return userApproval !== undefined;
  });
  
  const approvedByUser = reviewedRequests.filter(req => {
    const userApproval = req.approvals?.find(approval => 
      approval.approver === user?.id || approval.approver_id === user?.id
    );
    return userApproval?.approved === true;
  });
  
  const rejectedByUser = reviewedRequests.filter(req => {
    const userApproval = req.approvals?.find(approval => 
      approval.approver === user?.id || approval.approver_id === user?.id
    );
    return userApproval?.approved === false;
  });

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

  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const handleApprove = async (request: PurchaseRequest) => {
    try {
      const { purchaseRequests } = await import('@/services/api');
      await purchaseRequests.approve(request.id.toString());
      alert('Request approved successfully!');
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      // Reload requests
      window.location.reload();
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
      const { purchaseRequests } = await import('@/services/api');
      await purchaseRequests.reject(request.id.toString(), rejectReason);
      alert('Request rejected successfully!');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      // Reload requests
      window.location.reload();
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
                {getStatusBadge(request.status)}
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
                        <DialogContent className="bg-white border border-gray-300 shadow-xl max-w-md mx-auto">
                          <div className="bg-white p-6 rounded-lg">
                            <DialogHeader>
                              <DialogTitle className="text-black text-xl font-semibold">Approve Request</DialogTitle>
                              <DialogDescription className="text-gray-600 mt-2">
                                Are you sure you want to approve "{selectedRequest?.title}"?
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-6 flex gap-3">
                              <Button variant="outline" onClick={() => setApproveDialogOpen(false)} className="border-gray-300">
                                Cancel
                              </Button>
                              <Button 
                                className="bg-green-600 text-white hover:bg-green-700"
                                onClick={() => selectedRequest && handleApprove(selectedRequest)}
                              >
                                Approve
                              </Button>
                            </DialogFooter>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-red-600 text-white hover:bg-red-700 border-2 border-red-600 hover:border-red-700 shadow-lg font-bold px-4 py-2 rounded transition-all duration-300 hover:scale-105"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border border-gray-300 shadow-xl max-w-md mx-auto">
                          <div className="bg-white p-6 rounded-lg">
                            <DialogHeader>
                              <DialogTitle className="text-black text-xl font-semibold">Reject Request</DialogTitle>
                              <DialogDescription className="text-gray-600 mt-2">
                                Please provide a reason for rejecting "{selectedRequest?.title}".
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 mt-4">
                              <Label htmlFor="reason" className="text-black font-medium">Reason for rejection</Label>
                              <Textarea
                                id="reason"
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="border-gray-300 focus:border-black focus:ring-black bg-white min-h-[100px]"
                              />
                            </div>
                            <DialogFooter className="mt-6 flex gap-3">
                              <Button variant="outline" onClick={() => {
                                setRejectDialogOpen(false);
                                setRejectReason('');
                              }} className="border-gray-300">
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => selectedRequest && handleReject(selectedRequest)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reject
                              </Button>
                            </DialogFooter>
                          </div>
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
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:border-yellow-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending Approval</CardTitle>
            <div className="h-8 w-8 bg-yellow-200 rounded-full flex items-center justify-center">
              🕐
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{pendingRequests.length}</div>
            <p className="text-xs text-yellow-700 font-medium">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:border-green-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Approved</CardTitle>
            <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
              ✅
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {approvedByUser.length}
            </div>
            <p className="text-xs text-green-700 font-medium">Successfully approved</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 hover:border-red-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Rejected</CardTitle>
            <div className="h-8 w-8 bg-red-200 rounded-full flex items-center justify-center">
              ❌
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">
              {rejectedByUser.length}
            </div>
            <p className="text-xs text-red-700 font-medium">Declined requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-semibold">
            🕐 Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="data-[state=active]:bg-black data-[state=active]:text-white font-semibold">
            📄 Reviewed ({reviewedRequests.length})
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