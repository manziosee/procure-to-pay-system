import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { documents, proforma } from '@/services/api';

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
      // First upload to proforma service
      const uploadResult = await proforma.upload(file);
      
      // Then process with AI document processing
      const processResult = await documents.process(file);
      
      const combinedData = {
        ...processResult.data,
        proforma_id: uploadResult.data.id,
        upload_url: uploadResult.data.file_url
      };
      
      setExtractedData(combinedData);
      onDataExtracted?.(combinedData);
      onFileUploaded?.(file);
      
    } catch (err: any) {
      console.error('Error processing proforma:', err);
      setError(err.response?.data?.message || 'Failed to process proforma');
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
          Upload your proforma invoice. AI will extract items, prices, and vendor information automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload
          onFileSelect={handleFileUpload}
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={10 * 1024 * 1024} // 10MB
          label="Upload Proforma Invoice"
        />

        {isProcessing && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-semibold">Processing with AI...</p>
                  <p className="text-sm">Extracting items, prices, and vendor details from your proforma.</p>
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
                    <p>{extractedData.vendor_name || 'Not detected'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Amount:</p>
                    <p>{extractedData.total_amount ? `${parseFloat(extractedData.total_amount).toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}` : 'Not detected'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Items Found:</p>
                    <Badge variant="secondary">{extractedData.items?.length || 0} items</Badge>
                  </div>
                  <div>
                    <p className="font-medium">Confidence:</p>
                    <Badge className={extractedData.confidence > 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {Math.round((extractedData.confidence || 0) * 100)}%
                    </Badge>
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
                          <span className="ml-1">{parseFloat(item.unit_price).toLocaleString('en-RW', { style: 'currency', currency: 'RWF' })}</span>
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