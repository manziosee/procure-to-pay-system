import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, Upload, Edit } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApprovalTimeline } from '@/components/ApprovalTimeline';
import { FileUpload } from '@/components/FileUpload';
import { ReceiptValidator } from '@/components/ReceiptValidator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRequestData = async () => {
      if (!id) return;
      try {
        const { purchaseRequests } = await import('@/services/api');
        const response = await purchaseRequests.getById(id);
        setRequest(response.data);
      } catch (error: any) {
        console.error('Error loading request:', error);
        console.log('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        if (error.response?.status === 404) {
          setError('Request not found');
        } else if (error.response?.status === 403) {
          setError('You do not have permission to view this request');
        } else {
          setError('Failed to load request data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRequestData();
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;
    try {
      const { purchaseRequests } = await import('@/services/api');
      const response = await purchaseRequests.getById(id);
      setRequest(response.data);
    } catch (error) {
      console.error('Error loading request:', error);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      const { purchaseRequests } = await import('@/services/api');
      await purchaseRequests.approve(id, comments);
      alert('Request approved successfully!');
      setApproveDialog(false);
      setComments('');
      // Reload request data to show updated approvals
      await loadRequest();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (reason: string) => {
    if (!id) return;
    try {
      const { purchaseRequests } = await import('@/services/api');
      await purchaseRequests.reject(id, reason);
      alert('Request rejected successfully!');
      setRejectDialog(false);
      setComments('');
      // Reload request data to show updated approvals
      await loadRequest();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleReceiptSubmit = async () => {
    if (!id || !receipt) return;
    
    setIsValidating(true);
    try {
      const { proforma } = await import('@/services/api');
      
      // First submit the receipt (which includes validation)
      const response = await proforma.upload(receipt);
      
      if (response.data.is_valid) {
        // If validation passes, update the request status
        const { purchaseRequests } = await import('@/services/api');
        await purchaseRequests.submitReceipt(id, receipt);
        
        alert('Receipt validated and submitted successfully!');
        setReceipt(null);
        setValidationResult(null);
        await loadRequest(); // Reload the request data
      } else {
        // Show validation errors
        const errors = response.data.errors || ['Unknown validation error'];
        setValidationResult({
          is_valid: false,
          errors: Array.isArray(errors) ? errors : [errors]
        });
        alert(`Receipt validation failed: ${errors.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Error processing receipt:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process receipt';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsValidating(false);
    }
  };



  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-black mb-2">
            {error === 'Request not found' ? 'Request Not Found' : 'Error Loading Request'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'Request not found' 
              ? 'The request you\'re looking for doesn\'t exist or may have been deleted.'
              : error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => navigate('/')} className="bg-black text-white hover:bg-gray-800">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-black mb-2">Request Not Found</h2>
          <p className="text-gray-600 mb-6">
            The request you're looking for doesn't exist or may have been deleted.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => navigate('/')} className="bg-black text-white hover:bg-gray-800">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Define Approval type for better type safety
  type Approval = {
    id: string;
    approved: boolean | null;
    approver?: {
      id: string;
      role: string;
    };
    approver_id?: string;
    approver_role?: string;
    comments?: string;
    created_at: string;
  };

  // Check approval workflow logic with proper typing
  const hasLevel1Approval = request.approvals?.some((a: Approval) => 
    (a.approver?.role === 'approver_level_1' || a.approver_role === 'approver_level_1') && a.approved === true
  );
  
  const hasLevel1Rejection = request.approvals?.some((a: Approval) => 
    (a.approver?.role === 'approver_level_1' || a.approver_role === 'approver_level_1') && a.approved === false
  );
  
  const hasLevel2Approval = request.approvals?.some((a: Approval) => 
    (a.approver?.role === 'approver_level_2' || a.approver_role === 'approver_level_2') && a.approved === true
  );
  
  // Check if current user has already acted on this request
  const userHasActed = request.approvals?.some((a: Approval) => 
    a.approver?.id === user?.id || a.approver_id === user?.id
  );
  
  const canApprove = (() => {
    if (request.status !== 'pending') return false;
    if (hasLevel1Rejection) return false; // If Level 1 rejected, no one can approve
    if (userHasActed) return false; // User has already acted
    
    if (user?.role === 'approver_level_1') {
      return true; // Level 1 can always approve pending requests (if they haven't acted)
    }
    
    if (user?.role === 'approver_level_2') {
      return hasLevel1Approval; // Level 2 can only approve after Level 1 approval
    }
    
    return false;
  })();
  
  // PO is generated automatically by backend when request is fully approved
  
  const canSubmitReceipt = user?.role === 'staff' && request.status === 'approved' && !request.receipt;

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{request.title}</h1>
            <p className="text-muted-foreground">Request #{request.id}</p>
          </div>
        </div>
        {getStatusBadge(request.status)}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1">{request.description}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold mt-1">{parseFloat(request.amount).toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="mt-1">{request.created_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="mt-1">{new Date(request.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Proforma Invoice</p>
              {request.proforma ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    // Create a temporary link to download the file with proper filename
                    const link = document.createElement('a');
                    link.href = request.proforma;
                    link.download = `proforma-${request.id}.${request.proforma.split('.').pop() || 'pdf'}`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Proforma
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No file uploaded</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Purchase Order</p>
              {request.purchase_order ? (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={request.purchase_order} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download PO
                  </a>
                </Button>
              ) : request.status === 'approved' ? (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded border">
                  🔄 Purchase Order is being generated automatically...
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not generated yet</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Receipt</p>
              {request.receipt ? (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={request.receipt} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download Receipt
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No receipt submitted</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval History</CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalTimeline approvals={request.approvals} currentStatus={request.status} />
        </CardContent>
      </Card>

      {/* Staff Actions */}
      {user?.role === 'staff' && request.status === 'pending' && request.created_by === user.id && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Staff Actions</CardTitle>
            <CardDescription className="text-gray-600">Edit your pending request</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-black text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105">
              <Link to={`/requests/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {canApprove && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Approval Actions</CardTitle>
            <CardDescription className="text-gray-600">Review and approve or reject this request</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => setApproveDialog(true)} className="flex-1 bg-green-600 text-white hover:bg-green-700 transition-all duration-300 hover:scale-105">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button onClick={() => setRejectDialog(true)} className="flex-1 bg-red-600 text-white hover:bg-red-700 border-2 border-red-600 hover:border-red-700 transition-all duration-300 hover:scale-105">
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Show finalized status message */}
      {user?.role?.includes('approver') && request.status !== 'pending' && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Request Status</CardTitle>
            <CardDescription className="text-gray-600">
              This request has been {request.status} and cannot be modified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg text-center ${
              request.status === 'approved' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {request.status === 'approved' ? (
                <CheckCircle className="mx-auto h-8 w-8 mb-2" />
              ) : (
                <XCircle className="mx-auto h-8 w-8 mb-2" />
              )}
              <p className="font-semibold">
                Request {request.status.toUpperCase()}
              </p>
              <p className="text-sm mt-1">
                No further approval actions are available
              </p>
            </div>
          </CardContent>
        </Card>
      )}



      {canSubmitReceipt && (
        <ReceiptValidator
          requestId={id!}
          purchaseOrder={request.purchase_order}
          onValidationComplete={(result) => setValidationResult(result)}
          onReceiptSubmitted={() => {
            alert('Receipt submitted successfully!');
            window.location.reload();
          }}
        />
      )}

      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this request?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-comments">Comments (Optional)</Label>
              <Textarea
                id="approve-comments"
                placeholder="Add any comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-comments">Comments *</Label>
              <Textarea
                id="reject-comments"
                placeholder="Explain why this request is being rejected..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReject(comments)}
              disabled={!comments.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}