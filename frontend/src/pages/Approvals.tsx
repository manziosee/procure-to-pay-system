import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Filter, Clock, FileCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseRequest } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatusBadge } from '@/components/StatusBadge';
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

  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveComments, setApproveComments] = useState('');

  // Check if user is an approver
  if (!user?.role?.includes('approver')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Access denied. Approver role required.</p>
        <Button asChild>
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

  const handleApprove = async (request: PurchaseRequest) => {
    try {
      const { purchaseRequests } = await import('@/services/api');
      await purchaseRequests.approve(request.id.toString(), approveComments);
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setApproveComments('');
      await loadRequests();
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
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      await loadRequests();
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
            <TableHead>Title</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium text-black">{request.title}</TableCell>
              <TableCell className="text-black">{formatCurrency(request.amount)}</TableCell>
              <TableCell>
                <StatusBadge status={request.status as 'pending' | 'approved' | 'rejected'} />
              </TableCell>
              <TableCell>{request.created_by_name}</TableCell>
              <TableCell>{formatDate(request.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="sm">
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
                            onClick={() => setSelectedRequest(request)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-gray-200 max-w-md mx-auto">
                          <DialogHeader>
                            <DialogTitle className="text-black text-xl font-semibold">Approve Request</DialogTitle>
                            <DialogDescription className="text-gray-600 mt-2">
                              Approve "{selectedRequest?.title}" and provide comments for the team.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 mt-4">
                            <Label htmlFor="approve-comments">Approval Comments (Optional)</Label>
                            <Textarea
                              id="approve-comments"
                              placeholder="Add comments about why this request is approved..."
                              value={approveComments}
                              onChange={(e) => setApproveComments(e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                          <DialogFooter className="mt-6 flex gap-3">
                            <Button variant="outline" onClick={() => {
                              setApproveDialogOpen(false);
                              setApproveComments('');
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={() => selectedRequest && handleApprove(selectedRequest)}>
                              Approve
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-gray-200 max-w-md mx-auto">
                          <DialogHeader>
                            <DialogTitle className="text-black text-xl font-semibold">Reject Request</DialogTitle>
                            <DialogDescription className="text-gray-600 mt-2">
                              Please provide a reason for rejecting "{selectedRequest?.title}".
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 mt-4">
                            <Label htmlFor="reason">Reason for rejection</Label>
                            <Textarea
                              id="reason"
                              placeholder="Enter reason for rejection..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="min-h-[100px]"
                            />
                          </div>
                          <DialogFooter className="mt-6 flex gap-3">
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
          <h1 className="font-display text-3xl font-bold text-black">Approvals</h1>
          <p className="text-gray-600">
            Manage purchase request approvals — {user.role.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {pendingRequests.length} pending approval
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Approval</CardTitle>
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingRequests.length}</div>
            <p className="text-xs text-gray-500">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approved</CardTitle>
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-gray-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approvedByUser.length}</div>
            <p className="text-xs text-gray-500">Successfully approved</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejected</CardTitle>
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <XCircle className="h-4 w-4 text-gray-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{rejectedByUser.length}</div>
            <p className="text-xs text-gray-500">Declined requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            <FileCheck className="mr-1.5 h-3.5 w-3.5" />
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
