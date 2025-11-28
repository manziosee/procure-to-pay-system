import { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertTriangle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { purchaseRequests } from '@/services/api';

interface ReceiptValidatorProps {
  requestId: string;
  purchaseOrder?: any;
  onValidationComplete?: (result: any) => void;
  onReceiptSubmitted?: () => void;
}

export const ReceiptValidator: React.FC<ReceiptValidatorProps> = ({
  requestId,
  purchaseOrder,
  onValidationComplete,
  onReceiptSubmitted
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleReceiptUpload = async (file: File) => {
    setReceiptFile(file);
    setError('');
    // Just store the file, validation happens on submit
  };

  const handleSubmitReceipt = async () => {
    if (!receiptFile) return;

    setIsSubmitting(true);
    setIsValidating(true);
    try {
      // Backend handles both validation and submission
      const result = await purchaseRequests.submitReceipt(requestId, receiptFile);
      setValidationResult(result.data.validation_results);
      onValidationComplete?.(result.data.validation_results);
      onReceiptSubmitted?.();
    } catch (err: any) {
      console.error('Error submitting receipt:', err);
      setError(err.response?.data?.message || 'Failed to submit receipt');
    } finally {
      setIsSubmitting(false);
      setIsValidating(false);
    }
  };

  const getValidationIcon = () => {
    if (!validationResult) return null;
    
    if (validationResult.is_valid) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (validationResult.has_warnings) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getValidationColor = () => {
    if (!validationResult) return 'border-gray-200';
    
    if (validationResult.is_valid) {
      return 'border-green-200 bg-green-50';
    } else if (validationResult.has_warnings) {
      return 'border-yellow-200 bg-yellow-50';
    } else {
      return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Receipt Validation
        </CardTitle>
        <CardDescription>
          Upload your receipt. AI will validate it against the Purchase Order to ensure accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload
          onFileSelect={handleReceiptUpload}
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={10 * 1024 * 1024} // 10MB
          label="Upload Receipt"
        />

        {isValidating && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-semibold">Validating Receipt...</p>
                  <p className="text-sm">Comparing receipt details with Purchase Order using AI.</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold">Validation Failed</p>
              <p className="text-sm">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {validationResult && (
          <Alert className={getValidationColor()}>
            {getValidationIcon()}
            <AlertDescription className={validationResult.is_valid ? 'text-green-800' : validationResult.has_warnings ? 'text-yellow-800' : 'text-red-800'}>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">
                    {validationResult.is_valid ? '✅ Receipt Validated Successfully' : 
                     validationResult.has_warnings ? '⚠️ Receipt Validated with Warnings' : 
                     '❌ Receipt Validation Failed'}
                  </p>
                  <p className="text-sm">
                    {validationResult.is_valid ? 'All items and amounts match the Purchase Order.' :
                     validationResult.has_warnings ? 'Minor discrepancies found but within acceptable limits.' :
                     'Significant discrepancies found that require attention.'}
                  </p>
                </div>

                {validationResult.comparison && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Vendor Match:</p>
                      <Badge className={validationResult.comparison.vendor_match ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {validationResult.comparison.vendor_match ? 'Matched' : 'Mismatch'}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">Amount Match:</p>
                      <Badge className={validationResult.comparison.amount_match ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {validationResult.comparison.amount_match ? 'Matched' : 'Mismatch'}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">Items Match:</p>
                      <Badge className={validationResult.comparison.items_match ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {validationResult.comparison.items_match ? 'Matched' : 'Mismatch'}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">Confidence:</p>
                      <Badge className={validationResult.confidence > 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {Math.round((validationResult.confidence || 0) * 100)}%
                      </Badge>
                    </div>
                  </div>
                )}

                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Issues Found:</p>
                    <ul className="text-sm space-y-1">
                      {validationResult.errors.map((error: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Warnings:</p>
                    <ul className="text-sm space-y-1">
                      {validationResult.warnings.map((warning: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {receiptFile && (
          <div className="flex gap-3">
            <Button
              onClick={handleSubmitReceipt}
              disabled={isSubmitting}
              className="flex-1 bg-black hover:bg-gray-800 text-white transition-all duration-300 hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isValidating ? 'Validating & Submitting...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Validate & Submit Receipt
                </>
              )}
            </Button>
          </div>
        )}

        {receiptFile && (
          <div className="text-sm text-gray-600">
            <p>📎 {receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};