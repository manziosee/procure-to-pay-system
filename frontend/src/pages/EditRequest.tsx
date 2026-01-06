import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const editRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  proforma: z.instanceof(File).optional(),
});

type EditRequestFormData = z.infer<typeof editRequestSchema>;

export default function EditRequest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
    const loadRequest = async () => {
      if (!id) return;
      try {
        const { purchaseRequests } = await import('@/services/api');
        const response = await purchaseRequests.getById(id);
        setRequest(response.data);
      } catch (error) {
        console.error('Error loading request:', error);
        alert('Failed to load request');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequest();
  }, [id, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditRequestFormData>({
    resolver: zodResolver(editRequestSchema),
  });

  // Update form when request data loads
  useEffect(() => {
    if (request) {
      reset({
        title: request.title,
        description: request.description,
        amount: parseFloat(request.amount),
      });
    }
  }, [request, reset]);

  const proformaFile = watch('proforma');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  // Check if user can edit this request
  if (!request || user?.role !== 'staff' || request.created_by !== user.id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">You cannot edit this request</p>
        <Button onClick={() => navigate('/')} className="bg-black text-white hover:bg-gray-800">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: EditRequestFormData) => {
    setIsSubmitting(true);
    setAiResult(null);
    
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('amount', data.amount.toString());
      
      if (data.proforma) {
        setAiProcessing(true);
        formData.append('proforma', data.proforma);
      }
      
      const { purchaseRequests } = await import('@/services/api');
      const response = await purchaseRequests.partialUpdate(id!, formData);
      
      if (data.proforma && response.data) {
        setAiResult({
          success: true,
          message: 'AI processing completed successfully',
          itemsExtracted: response.data.items?.length || 0
        });
      }
      
      alert('Request updated successfully!');
      navigate(`/requests/${id}`);
    } catch (error) {
      console.error('Error updating request:', error);
      setAiResult({
        success: false,
        message: 'Update failed, but basic processing completed'
      });
      alert('Failed to update request');
    } finally {
      setIsSubmitting(false);
      setAiProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/requests/${id}`)} className="hover:bg-gray-100">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-black">Edit Request</h1>
          <p className="text-gray-600">Update your purchase request details</p>
        </div>
      </div>

      <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-black">Request Details</CardTitle>
          <CardDescription className="text-gray-600">
            Modify the details for your purchase request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-black">
                Title
              </label>
              <Input
                id="title"
                placeholder="Enter request title"
                className="border-gray-300 focus:border-black"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-black">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Enter request description"
                rows={4}
                className="border-gray-300 focus:border-black"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-black">
                Amount
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="border-gray-300 focus:border-black"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-black">
                Proforma Invoice (Optional)
              </label>
              <FileUpload
                onFileSelect={(file) => setValue('proforma', file)}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={5 * 1024 * 1024}
                label="Upload New Proforma"
              />
              {proformaFile && (
                <p className="text-sm text-gray-600">
                  {proformaFile.name} ({(proformaFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              {aiProcessing && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    🤖 AI is processing your document... This may take a few seconds.
                  </AlertDescription>
                </Alert>
              )}
              {aiResult && (
                <Alert className={aiResult.success ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                  <Bot className={`h-4 w-4 ${aiResult.success ? 'text-green-600' : 'text-yellow-600'}`} />
                  <AlertDescription className={aiResult.success ? 'text-green-800' : 'text-yellow-800'}>
                    {aiResult.success ? '✅' : '⚠️'} {aiResult.message}
                    {aiResult.itemsExtracted > 0 && ` (${aiResult.itemsExtracted} items extracted)`}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/requests/${id}`)}
                disabled={isSubmitting}
                className="border-gray-300 text-black hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}