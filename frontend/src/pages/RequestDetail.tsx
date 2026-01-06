import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, Upload, Edit, FileText, Eye, Trash2 } from 'lucide-react';
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
              
              {/* Display extracted items if available */}
              {request.items && request.items.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-700 mb-3">📋 Extracted Items</p>
                  <div className="space-y-2">
                    {request.items.map((item: any, index: number) => (
                      <div key={item.id || index} className="flex justify-between items-center p-2 bg-white rounded border border-blue-200">
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">{item.name}</p>
                          <p className="text-sm text-blue-600">Qty: {item.quantity} × RWF {item.unit_price}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-800">RWF {item.total_price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
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
                  {(request.proforma || request.proforma_filename) && (
                    <Badge className="bg-green-100 text-green-800 border border-green-300">
                      ✅ Processed
                    </Badge>
                  )}
                </div>
              </div>
              {request.proforma || request.proforma_filename ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                          📎
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {request.proforma_filename || `proforma-${request.id}.pdf`}
                          </p>
                          <p className="text-xs text-blue-600">
                            Uploaded by staff • AI processed
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-blue-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
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
                        link.download = request.proforma_filename || `proforma-${request.id}.pdf`;
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
                      <p className="text-sm font-semibold text-blue-900 mb-2">🤖 AI Extraction Complete</p>
                      <div className="text-sm text-blue-800 space-y-2">
                        <p className="font-medium">Successfully processed your proforma invoice.</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="font-semibold text-blue-700">Vendor:</p>
                            <p className="text-blue-900">{request.ai_extracted_data.vendor || request.proforma_data?.vendor || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-700">Total Amount:</p>
                            <p className="text-blue-900 font-bold">RWF {parseFloat(request.ai_extracted_data.total_amount || request.proforma_data?.total_amount || '0').toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-700">Items Found:</p>
                            <p className="text-blue-900">{request.items?.length || 0} items</p>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-700">Processing:</p>
                            <p className="text-blue-900">{request.ai_extracted_data.processing_method === 'ai_extraction' ? 'AI' : 'Basic'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-700">Confidence:</p>
                            <p className="text-blue-900">{Math.round((request.ai_extracted_data.confidence || request.proforma_data?.confidence || 0.5) * 100)}%</p>
                          </div>
                        </div>
                        
                        {request.items && request.items.length > 0 && (
                          <div className="mt-3">
                            <p className="font-semibold text-blue-700 mb-2">Extracted Items:</p>
                            <div className="space-y-1">
                              {request.items.slice(0, 3).map((item: any, index: number) => (
                                <div key={item.id || index} className="text-xs text-blue-800">
                                  {item.name} - Qty: {item.quantity} - RWF {item.unit_price}
                                </div>
                              ))}
                              {request.items.length > 3 && (
                                <div className="text-xs text-blue-600 italic">...and {request.items.length - 3} more items</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">📄</div>
                  <p className="text-sm text-blue-700 font-medium mb-1">No proforma uploaded</p>
                  <p className="text-xs text-blue-600">Staff needs to upload proforma for processing</p>
                  <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800">💡 Contact staff to upload the proforma document</p>
                  </div>
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
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-green-100 rounded flex items-center justify-center mr-3">
                          📝
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            {request.purchase_order_filename || `PO-${request.id}.pdf`}
                          </p>
                          <p className="text-xs text-green-600">
                            Purchase Order #{request.id} • Auto-generated
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-green-500">
                        {request.status === 'approved' ? 'Ready' : 'Generated'}
                      </div>
                    </div>
                  </div>
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
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">⏳</div>
                  <p className="text-sm text-green-700 font-medium mb-1">Not generated yet</p>
                  <p className="text-xs text-green-600">Will be auto-generated upon approval</p>
                  <div className="mt-3 p-2 bg-green-100 rounded-lg">
                    <p className="text-xs text-green-800">💡 Requires both Level 1 & Level 2 approval</p>
                  </div>
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
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-purple-100 rounded flex items-center justify-center mr-3">
                          📎
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">
                            {request.receipt_filename || `receipt-${request.id}.pdf`}
                          </p>
                          <p className="text-xs text-purple-600">
                            Submitted & AI-validated
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-purple-500">
                        Verified
                      </div>
                    </div>
                  </div>
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
                        link.download = request.receipt_filename || `receipt-${request.id}.pdf`;
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
                      <p className="text-sm font-semibold text-purple-900 mb-2">🤖 AI Validation Complete</p>
                      <div className="text-sm text-purple-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Validation Status:</span>
                          <div className="flex items-center space-x-2">
                            <span className={`h-2 w-2 rounded-full ${
                              request.receipt_validation_result.is_valid ? 'bg-green-500' : 'bg-red-500'
                            }`}></span>
                            <span className={`font-bold ${
                              request.receipt_validation_result.is_valid ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {request.receipt_validation_result.is_valid ? '✅ Valid' : '❌ Invalid'}
                            </span>
                          </div>
                        </div>
                        
                        {request.receipt_validation_result.confidence && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">AI Confidence:</span>
                            <span className="font-bold text-purple-900">
                              {Math.round(request.receipt_validation_result.confidence * 100)}%
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Processing:</span>
                          <span className="text-purple-900">AI Validation</span>
                        </div>
                        
                        {request.receipt_validation_result.discrepancies && request.receipt_validation_result.discrepancies.length > 0 ? (
                          <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                            <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Issues Found:</p>
                            {request.receipt_validation_result.discrepancies.slice(0, 2).map((issue: any, index: number) => (
                              <p key={index} className="text-xs text-red-600">• {issue.reason || issue}</p>
                            ))}
                            {request.receipt_validation_result.discrepancies.length > 2 && (
                              <p className="text-xs text-red-500 italic">...and {request.receipt_validation_result.discrepancies.length - 2} more</p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-xs font-semibold text-green-700">✅ All validations passed</p>
                            <p className="text-xs text-green-600">Receipt matches purchase order requirements</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">🤖</div>
                  <p className="text-sm text-purple-700 font-medium mb-1">AI Receipt Validation Ready</p>
                  <p className="text-xs text-purple-600 mb-3">
                    {request.status === 'approved' ? 'Submit receipt for intelligent validation' : 'Available after approval'}
                  </p>
                  {request.status === 'approved' && user?.role === 'staff' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-100 rounded-lg border border-purple-200">
                        <p className="text-xs font-semibold text-purple-800 mb-2">🧠 AI Validation Features:</p>
                        <div className="grid grid-cols-1 gap-2 text-xs text-purple-700">
                          <div className="flex items-center">
                            <span className="mr-2">✅</span>
                            <span>Smart amount verification against PO</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">🔍</span>
                            <span>Automatic vendor & date extraction</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">📊</span>
                            <span>Line item matching & validation</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">⚡</span>
                            <span>Instant fraud detection</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <p className="text-xs text-purple-800 font-medium">💡 Supported: PDF, JPG, PNG • Max 10MB</p>
                      </div>
                      <Button 
                        className="w-full bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 font-semibold"
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = '.pdf,.jpg,.jpeg,.png';
                          fileInput.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              setReceipt(file);
                              await handleReceiptSubmit();
                            }
                          };
                          fileInput.click();
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Receipt for AI Validation
                      </Button>
                    </div>
                  )}
                  {request.status !== 'approved' && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-700 font-medium mb-1">🔒 Waiting for Approval</p>
                      <p className="text-xs text-purple-600">AI validation will be available once the purchase order is approved</p>
                    </div>
                  )}
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
        {user?.role === 'staff' && request.created_by === user.id && (
          <Card className="card-premium bg-white border-2 border-blue-200 animate-slide-up">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-800 flex items-center">
                <Edit className="mr-3 h-6 w-6" />
                Staff Actions
              </CardTitle>
              <CardDescription className="text-blue-600">
                Manage your purchase request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  asChild 
                  variant="outline" 
                  className="flex-1 h-12 border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 font-semibold"
                >
                  <Link to={`/requests/${id}`}>
                    <Eye className="mr-2 h-5 w-5" />
                    View Details
                  </Link>
                </Button>
                <Button 
                  asChild 
                  className="flex-1 h-12 bg-green-600 text-white hover:bg-green-700 transition-all duration-300 hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Link to={`/requests/${id}/edit`}>
                    <Edit className="mr-2 h-5 w-5" />
                    Edit Request
                  </Link>
                </Button>
                <Button 
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) return;
                    
                    try {
                      const { purchaseRequests } = await import('@/services/api');
                      await purchaseRequests.delete(id!);
                      alert('Request deleted successfully!');
                      navigate('/');
                    } catch (error) {
                      console.error('Error deleting request:', error);
                      alert('Failed to delete request');
                    }
                  }}
                  className="flex-1 h-12 bg-red-600 text-white hover:bg-red-700 transition-all duration-300 hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Delete Request
                </Button>
              </div>
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
          <div className="animate-slide-up" data-receipt-validator>
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