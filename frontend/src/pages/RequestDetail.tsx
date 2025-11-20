import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  // Mock request data
  const mockRequest = {
    id: Number(id),
    title: 'Sample Purchase Request',
    description: 'This is a sample request for demonstration purposes',
    amount: '1500.00',
    status: 'pending' as const,
    created_by: 1,
    created_by_name: 'John Staff',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    approvals: [],
    proforma: undefined,
    purchase_order: undefined,
    receipt: undefined
  };

  const request = mockRequest;
  const isLoading = false;

  const handleApprove = () => {
    console.log('Approving request:', id);
    alert('Request approved successfully!');
    setApproveDialog(false);
    setComments('');
  };

  const handleReject = (reason: string) => {
    console.log('Rejecting request:', id, 'Reason:', reason);
    alert('Request rejected successfully!');
    setRejectDialog(false);
    setComments('');
  };

  const handleReceiptSubmit = () => {
    console.log('Submitting receipt:', receipt);
    alert('Receipt submitted successfully!');
    setReceipt(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Request not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const canApprove = user?.role?.includes('approver') && request.status === 'pending';
  const canSubmitReceipt = user?.role === 'staff' && request.status === 'approved' && !request.receipt;

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
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
        <Badge variant={getStatusVariant(request.status)} className="text-sm">
          {request.status.toUpperCase()}
        </Badge>
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
              <p className="text-2xl font-bold mt-1">${parseFloat(request.amount).toFixed(2)}</p>
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
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={request.proforma} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download Proforma
                  </a>
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
            <Button onClick={() => setRejectDialog(true)} variant="destructive" className="flex-1 transition-all duration-300 hover:scale-105">
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </CardContent>
        </Card>
      )}

      {canSubmitReceipt && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">Submit Receipt</CardTitle>
            <CardDescription className="text-gray-600">Upload the receipt for this approved purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              label="Receipt"
              onFileSelect={setReceipt}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {receipt && (
              <Button
                onClick={handleReceiptSubmit}
                className="w-full bg-black text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105"
              >
                <Upload className="mr-2 h-4 w-4" />
                Submit Receipt
              </Button>
            )}
          </CardContent>
        </Card>
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