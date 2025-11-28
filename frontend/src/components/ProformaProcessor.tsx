import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { documents } from '@/services/api';

interface ProformaProcessorProps {
  onDataExtracted?: (data: any) => void;
  onFileUploaded?: (file: File) => void;
}

export const ProformaProcessor: React.FC<ProformaProcessorProps> = ({
  onDataExtracted,
  onFileUploaded
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setError('');
    setIsProcessing(true);

    try {
      // Process with AI document processing
      const processResult = await documents.process(file);
      
      const extractedData = processResult.data.extracted_data || {};
      
      // Ensure consistent data structure
      const normalizedData = {
        vendor_name: extractedData.vendor || 'Unknown Vendor',
        total_amount: extractedData.total_amount || '0.00',
        items: extractedData.items || [],
        terms: extractedData.terms || 'Net 30',
        confidence: extractedData.confidence || 0.5,
        processing_method: processResult.data.processing_method || 'Unknown'
      };
      
      setExtractedData(normalizedData);
      onDataExtracted?.(normalizedData);
      onFileUploaded?.(file);
      
    } catch (err: any) {
      console.error('Error processing proforma:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Failed to process proforma';
      
      if (err.response?.status === 400) {
        errorMessage = err.response?.data?.error || 'Invalid file or request format';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (err.response?.status === 413) {
        errorMessage = 'File too large. Maximum size is 15MB.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait and try again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Proforma Invoice Processing
        </CardTitle>
        <CardDescription>
          Upload your proforma invoice in any format (PDF, JPG, PNG, TXT, CSV, etc.). AI will extract items, prices, and vendor information automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload
          onFileSelect={handleFileUpload}
          accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.gif,.txt,.text,.csv"
          maxSize={15 * 1024 * 1024} // 15MB
          label="Upload Proforma Invoice"
        />

        {isProcessing && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-semibold">Processing with AI...</p>
                  <p className="text-sm">Using OCR and AI to extract items, prices, and vendor details from your document.</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold">Processing Failed</p>
              <p className="text-sm">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {extractedData && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">🤖 AI Extraction Complete</p>
                  <p className="text-sm">Successfully processed your proforma invoice.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Vendor:</p>
                    <p>{extractedData.vendor_name || extractedData.vendor || 'Not detected'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Amount:</p>
                    <p>{extractedData.total_amount ? `RWF ${parseFloat(extractedData.total_amount).toLocaleString()}` : 'Not detected'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Items Found:</p>
                    <Badge variant="secondary">{extractedData.items?.length || 0} items</Badge>
                  </div>
                  <div>
                    <p className="font-medium">Processing:</p>
                    <Badge className={extractedData.processing_method === 'AI' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                      {extractedData.processing_method || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium">Confidence:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (extractedData.confidence || 0) > 0.7 ? 'bg-green-500' : 
                            (extractedData.confidence || 0) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.round((extractedData.confidence || 0) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">
                        {Math.round((extractedData.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {extractedData.items && extractedData.items.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Extracted Items:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {extractedData.items.map((item: any, index: number) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <span className="font-medium">{item.name}</span> - 
                          <span className="ml-1">Qty: {item.quantity}</span> - 
                          <span className="ml-1">RWF {parseFloat(item.unit_price || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {uploadedFile && (
          <div className="text-sm text-gray-600">
            <p>📎 {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};