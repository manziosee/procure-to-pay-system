import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { ProformaProcessor } from '@/components/ProformaProcessor';
import { purchaseRequests, proforma, documents } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';


const requestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(1000000, 'Amount cannot exceed 1,000,000 RWF'),
  proforma: z.instanceof(File).nullable().optional(),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0.01, 'Unit price must be greater than 0').max(1000000, 'Unit price cannot exceed 1,000,000 RWF'),
  })).min(1, 'At least one item is required'),
});

type RequestFormData = z.infer<typeof requestSchema>;

export default function CreateRequest() {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState([{ name: '', description: '', quantity: 1, unit_price: 0 }]);
  const [isProcessingProforma, setIsProcessingProforma] = useState(false);
  const [proformaData, setProformaData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      items: [{ name: '', description: '', quantity: 1, unit_price: 0 }]
    }
  });

  // Initialize items in form
  React.useEffect(() => {
    setValue('items', items);
  }, [items, setValue]);

  const proformaFile = watch('proforma');

  const onSubmit = async (data: RequestFormData) => {
    console.log('Form submitted with data:', data);
    
    // Validate items before submission
    const validItems = items.filter(item => 
      item.name.trim() && 
      item.description.trim() && 
      item.quantity > 0 && 
      item.unit_price > 0
    );
    
    if (validItems.length === 0) {
      alert('Please add at least one valid item with all fields filled');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First create request without file
      const requestData = {
        title: data.title,
        description: data.description,
        amount: data.amount.toString(),
        items: validItems
      };
      
      console.log('Sending request to API...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://procure-to-pay-system-xnwp.onrender.com/api'}/requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(JSON.stringify(errorData));
      }
      
      const createdRequest = await response.json();
      
      // If there's a proforma file, upload it separately
      if (data.proforma) {
        console.log('Uploading proforma file...');
        try {
          const fileFormData = new FormData();
          fileFormData.append('proforma', data.proforma);
          
          const fileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://procure-to-pay-system-xnwp.onrender.com/api'}/requests/${createdRequest.id}/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
              // Don't set Content-Type for FormData, let browser set it
            },
            body: fileFormData
          });
          
          if (!fileResponse.ok) {
            const fileError = await fileResponse.json();
            console.error('File upload error:', fileError);
            alert('Request created but proforma upload failed. You can upload it later by editing the request.');
          } else {
            console.log('Proforma uploaded successfully');
          }
        } catch (fileError) {
          console.error('File upload error:', fileError);
          alert('Request created but proforma upload failed. You can upload it later by editing the request.');
        }
      }
      
      console.log('Request created successfully:', response);
      alert('Purchase request created successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Error creating request:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage: string;
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
        // Redirect to login
        navigate('/login');
        return;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create requests.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        // Handle validation errors
        const errors = error.response.data;
        const errorMessages = [];
        for (const [field, messages] of Object.entries(errors)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        errorMessage = errorMessages.length > 0 ? errorMessages.join('\n') : 'Validation failed';
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Failed to create request. Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Request</h1>
          <p className="text-muted-foreground">Submit a new purchase request</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Fill in the details for your purchase request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                placeholder="Enter request title"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Enter request description"
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium">
                Amount (RWF) - Maximum: 1,000,000
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                max="1000000"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
              <p className="text-xs text-gray-500">Note: Amounts over 1,000,000 RWF require special approval process</p>
            </div>

            {errors.items && (
              <div className="text-sm text-destructive mb-4">
                {errors.items.message || 'Please fill in all item details'}
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-medium">Request Items</label>
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setItems(items.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Name</label>
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].name = e.target.value;
                          setItems(newItems);
                          setValue('items', newItems);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Description</label>
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].description = e.target.value;
                          setItems(newItems);
                          setValue('items', newItems);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setItems(newItems);
                          setValue('items', newItems);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Unit Price (RWF)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.unit_price}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].unit_price = parseFloat(e.target.value) || 0;
                          setItems(newItems);
                          setValue('items', newItems);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newItems = [...items, { name: '', description: '', quantity: 1, unit_price: 0 }];
                  setItems(newItems);
                  setValue('items', newItems);
                }}
              >
                Add Item
              </Button>
            </div>

            <ProformaProcessor
              onDataExtracted={(data) => {
                setProformaData(data);
                
                // Auto-fill form with extracted data
                if (data.items && data.items.length > 0) {
                  setItems(data.items);
                  setValue('items', data.items);
                }
                if (data.total_amount) {
                  setValue('amount', parseFloat(data.total_amount));
                }
                if (data.title) {
                  setValue('title', data.title);
                }
                if (data.description) {
                  setValue('description', data.description);
                }
              }}
              onFileUploaded={(file) => setValue('proforma', file)}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-black hover:bg-gray-800 text-white shadow-lg transition-all duration-300 hover:scale-105">
                {isSubmitting ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}