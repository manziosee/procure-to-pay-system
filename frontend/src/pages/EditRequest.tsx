import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';

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

  // Mock request data - replace with API call
  const mockRequest = {
    id: Number(id),
    title: 'Office Supplies Request',
    description: 'Monthly office supplies including pens, papers, and folders',
    amount: '250.00',
    status: 'pending' as const,
    created_by: user?.id || 1,
    proforma: undefined
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditRequestFormData>({
    resolver: zodResolver(editRequestSchema),
    defaultValues: {
      title: mockRequest.title,
      description: mockRequest.description,
      amount: parseFloat(mockRequest.amount),
    }
  });

  const proformaFile = watch('proforma');

  // Check if user can edit this request
  if (user?.role !== 'staff' || mockRequest.status !== 'pending') {
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
    
    // Simulate API call
    setTimeout(() => {
      console.log('Request updated:', data);
      alert('Request updated successfully!');
      navigate(`/requests/${id}`);
      setIsSubmitting(false);
    }, 1500);
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