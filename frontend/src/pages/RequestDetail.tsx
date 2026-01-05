import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, Upload, Edit, FileText } from 'lucide-react';
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
      const response = await purchaseRequests.approve(id, comments);
      alert('Request approved successfully!');
      setApproveDialog(false);
      setComments('');
      // Reload request data to show updated approvals
      await loadRequest();
    } catch (error: any) {
      console.error('Error approving request:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to approve request';
      alert(errorMessage);
    }
  };

  const handleReject = async (reason: string) => {
    if (!id) return;
    try {
      const { purchaseRequests } = await import('@/services/api');
      const response = await purchaseRequests.reject(id, reason);
      alert('Request rejected successfully!');
      setRejectDialog(false);
      setComments('');
      // Reload request data to show updated approvals
      await loadRequest();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to reject request';
      alert(errorMessage);
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
    (a.approver?.id === user?.id?.toString() || a.approver_id === user?.id?.toString())
  );
  
  const canApprove = (() => {
    if (request.status !== 'pending') return false;
    if (userHasActed) return false; // User has already acted
    
    if (user?.role === 'approver_level_1') {
      return !hasLevel1Rejection; // Level 1 can approve if not already rejected
    }
    
    if (user?.role === 'approver_level_2') {
      // Level 2 can approve if Level 1 hasn't rejected AND either:
      // 1. Level 1 has approved, OR
      // 2. No Level 1 action yet (both can work in parallel)
      return !hasLevel1Rejection;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="hover:bg-gray-100 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-black gradient-text">{request.title}</h1>
              <p className="text-lg text-gray-600 font-medium">Request #{request.id}</p>
            </div>
          </div>
          <div className="animate-scale-in">
            {getStatusBadge(request.status)}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-slide-up">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-2 animate-scale-in">
          {/* Request Information */}
          <Card className="card-premium bg-white border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black flex items-center">
                <FileText className="mr-3 h-6 w-6" />
                Request Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                <p className="text-gray-900 leading-relaxed">{request.description}</p>
              </div>
              <Separator className="bg-gray-200" />
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Request Amount</p>
                <p className="text-4xl font-bold text-green-700 mb-1">
                  {parseFloat(request.amount).toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}
                </p>
                <p className="text-sm text-green-600">Total requested amount</p>
              </div>
              <Separator className="bg-gray-200" />
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-700 mb-2">Created By</p>
                  <p className="text-lg font-bold text-blue-900">{request.created_by_name}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-700 mb-2">Created At</p>
                  <p className="text-lg font-bold text-purple-900">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="card-premium bg-white border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center">
              <FileText className="mr-3 h-6 w-6" />
              Documents & AI Processing
            </CardTitle>
            <CardDescription className="text-gray-600">
              AI-powered document processing and validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proforma Invoice */}
            <div className="p-4 border-2 border-blue-100 rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                    📄
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Proforma Invoice</p>
                    <p className="text-sm text-blue-700">AI-processed document</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {request.proforma && (
                    <Badge className="bg-green-100 text-green-800 border border-green-300">
                      ✅ Processed
                    </Badge>
                  )}
                </div>
              </div>
              {request.proforma ? (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all duration-300"
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
                    Download Proforma
                  </Button>
                  {request.ai_extracted_data && (
                    <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-2">🤖 AI Extracted Data:</p>
                      <div className="text-sm text-blue-800 space-y-1">
                        {Object.entries(request.ai_extracted_data).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{key.replace('_', ' ').toUpperCase()}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm text-blue-700 font-medium">No file uploaded</p>
                  <p className="text-xs text-blue-600">Upload a proforma for AI processing</p>
                </div>
              )}
            </div>

            {/* Purchase Order */}
            <div className="p-4 border-2 border-green-100 rounded-lg bg-green-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-green-200 rounded-full flex items-center justify-center mr-3">
                    📋
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Purchase Order</p>
                    <p className="text-sm text-green-700">Auto-generated on approval</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {(request.purchase_order || request.status === 'approved') && (
                    <Badge className="bg-green-100 text-green-800 border border-green-300">
                      ✅ Generated
                    </Badge>
                  )}
                </div>
              </div>
              {request.purchase_order || request.status === 'approved' ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 transition-all duration-300"
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
                  Download PO
                </Button>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-sm text-green-700 font-medium">Not generated yet</p>
                  <p className="text-xs text-green-600">Will be auto-generated upon approval</p>
                </div>
              )}
            </div>

            {/* Receipt */}
            <div className="p-4 border-2 border-purple-100 rounded-lg bg-purple-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-purple-200 rounded-full flex items-center justify-center mr-3">
                    🧾
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">Receipt</p>
                    <p className="text-sm text-purple-700">AI-validated against PO</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {request.receipt && (
                    <Badge className="bg-purple-100 text-purple-800 border border-purple-300">
                      ✅ Validated
                    </Badge>
                  )}
                </div>
              </div>
              {request.receipt ? (
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-all duration-300"
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
                    Download Receipt
                  </Button>
                  {request.receipt_validation_result && (
                    <div className="p-3 bg-purple-100 rounded-lg border border-purple-200">
                      <p className="text-sm font-semibold text-purple-900 mb-2">🤖 AI Validation Result:</p>
                      <div className="text-sm text-purple-800">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`h-2 w-2 rounded-full ${
                            request.receipt_validation_result.is_valid ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <span className="font-medium">
                            {request.receipt_validation_result.is_valid ? 'Valid' : 'Invalid'}
                          </span>
                        </div>
                        {request.receipt_validation_result.confidence && (
                          <p className="text-xs">Confidence: {Math.round(request.receipt_validation_result.confidence * 100)}%</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm text-purple-700 font-medium">No receipt submitted</p>
                  <p className="text-xs text-purple-600">
                    {request.status === 'approved' ? 'Submit receipt for AI validation' : 'Available after approval'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Approval History */}
        <Card className="card-premium bg-white border-2 border-gray-200 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center">
              <CheckCircle className="mr-3 h-6 w-6" />
              Approval Timeline
            </CardTitle>
            <CardDescription className="text-gray-600">
              Track the approval progress and history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalTimeline approvals={request.approvals} currentStatus={request.status} />
          </CardContent>
        </Card>

        {/* Staff Actions */}
        {user?.role === 'staff' && request.status === 'pending' && request.created_by === user.id && (
          <Card className="card-premium bg-white border-2 border-blue-200 animate-slide-up">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-800 flex items-center">
                <Edit className="mr-3 h-6 w-6" />
                Staff Actions
              </CardTitle>
              <CardDescription className="text-blue-600">
                Edit your pending request before approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="btn-premium h-12 px-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <Link to={`/requests/${id}/edit`}>
                  <Edit className="mr-2 h-5 w-5" />
                  Edit Request
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Approval Actions */}
        {canApprove && (
          <Card className="card-premium bg-white border-2 border-yellow-200 animate-slide-up">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-yellow-800 flex items-center">
                <CheckCircle className="mr-3 h-6 w-6" />
                Approval Actions
              </CardTitle>
              <CardDescription className="text-yellow-600">
                Review and approve or reject this request
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button 
                onClick={() => setApproveDialog(true)} 
                className="flex-1 h-12 bg-green-600 text-white hover:bg-green-700 transition-all duration-300 hover:scale-105 font-semibold text-base"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Approve Request
              </Button>
              <Button 
                onClick={() => setRejectDialog(true)} 
                className="flex-1 h-12 bg-red-600 text-white hover:bg-red-700 border-2 border-red-600 hover:border-red-700 transition-all duration-300 hover:scale-105 font-semibold text-base"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Reject Request
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Finalized Status */}
        {user?.role?.includes('approver') && request.status !== 'pending' && (
          <Card className={`card-premium border-2 animate-slide-up ${
            request.status === 'approved' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <CardHeader>
              <CardTitle className={`text-xl font-bold flex items-center ${
                request.status === 'approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                {request.status === 'approved' ? (
                  <CheckCircle className="mr-3 h-6 w-6" />
                ) : (
                  <XCircle className="mr-3 h-6 w-6" />
                )}
                Request Status
              </CardTitle>
              <CardDescription className={request.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
                This request has been {request.status} and cannot be modified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-6 rounded-lg text-center border-2 ${
                request.status === 'approved' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}>
                {request.status === 'approved' ? (
                  <CheckCircle className="mx-auto h-12 w-12 mb-3" />
                ) : (
                  <XCircle className="mx-auto h-12 w-12 mb-3" />
                )}
                <p className="text-xl font-bold mb-2">
                  Request {request.status.toUpperCase()}
                </p>
                <p className="text-sm">
                  No further approval actions are available
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Receipt Submission */}
        {canSubmitReceipt && (
          <div className="animate-slide-up">
            <ReceiptValidator
              requestId={id!}
              purchaseOrder={request.purchase_order}
              onValidationComplete={(result) => setValidationResult(result)}
              onReceiptSubmitted={() => {
                alert('Receipt submitted successfully!');
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Dialogs */}
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
    </div>
  );
}