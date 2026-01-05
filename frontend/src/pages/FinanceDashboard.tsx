import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Upload, DollarSign, TrendingUp, FileText, Download, BarChart3, PieChart, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseRequest } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { useRequestsSync } from '@/hooks/useRequestsSync';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Simple Chart Components
const SimpleBarChart = ({ data, title }: { data: Array<{label: string, value: number, color: string}>, title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm font-medium text-gray-700">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${item.color}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                {item.value}
              </div>
            </div>
            <div className="w-16 text-sm text-gray-600">{formatCurrency(item.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SimplePieChart = ({ data, title }: { data: Array<{label: string, value: number, color: string}>, title: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 100, 0);
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={item.color.includes('bg-') ? 
                    item.color.includes('green') ? '#10b981' :
                    item.color.includes('yellow') ? '#f59e0b' :
                    item.color.includes('red') ? '#ef4444' : '#6b7280'
                    : item.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 rounded-full ${item.color}`}
              style={{
                backgroundColor: item.color.includes('bg-') ? undefined :
                  item.color.includes('green') ? '#10b981' :
                  item.color.includes('yellow') ? '#f59e0b' :
                  item.color.includes('red') ? '#ef4444' : '#6b7280'
              }}
            />
            <span className="text-sm text-gray-700">{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};



export default function FinanceDashboard() {
  const { user } = useAuth();
  const { requests, isLoading, loadRequests } = useRequestsSync();
  
  console.log('Finance Dashboard - Requests loaded:', requests.length);
  console.log('Finance Dashboard - Sample request:', requests[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Check if user is finance
  if (user?.role !== 'finance') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Access denied. Finance role required.</p>
        <Button asChild className="bg-black text-white hover:bg-gray-800">
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const totalAmount = requests.reduce((sum, req) => sum + parseFloat(req.amount), 0);
  const approvedAmount = requests
    .filter(req => req.status === 'approved')
    .reduce((sum, req) => sum + parseFloat(req.amount), 0);
  const pendingAmount = requests
    .filter(req => req.status === 'pending')
    .reduce((sum, req) => sum + parseFloat(req.amount), 0);
  const rejectedAmount = requests
    .filter(req => req.status === 'rejected')
    .reduce((sum, req) => sum + parseFloat(req.amount), 0);

  // Chart data
  const statusChartData = [
    { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: 'bg-green-500' },
    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'bg-yellow-500' },
    { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: 'bg-red-500' }
  ];

  const amountChartData = [
    { label: 'Approved', value: approvedAmount, color: 'bg-green-500' },
    { label: 'Pending', value: pendingAmount, color: 'bg-yellow-500' },
    { label: 'Rejected', value: rejectedAmount, color: 'bg-red-500' }
  ];

  // Monthly data (mock data for demonstration)
  const monthlyData = [
    { label: 'Jan', value: Math.floor(totalAmount * 0.1), color: 'bg-blue-500' },
    { label: 'Feb', value: Math.floor(totalAmount * 0.15), color: 'bg-blue-500' },
    { label: 'Mar', value: Math.floor(totalAmount * 0.12), color: 'bg-blue-500' },
    { label: 'Apr', value: Math.floor(totalAmount * 0.18), color: 'bg-blue-500' },
    { label: 'May', value: Math.floor(totalAmount * 0.20), color: 'bg-blue-500' },
    { label: 'Jun', value: Math.floor(totalAmount * 0.25), color: 'bg-blue-500' }
  ];

  // Department breakdown (mock data)
  const departmentData = [
    { label: 'IT', value: Math.floor(requests.length * 0.3), color: 'bg-purple-500' },
    { label: 'HR', value: Math.floor(requests.length * 0.2), color: 'bg-indigo-500' },
    { label: 'Operations', value: Math.floor(requests.length * 0.25), color: 'bg-pink-500' },
    { label: 'Marketing', value: Math.floor(requests.length * 0.15), color: 'bg-cyan-500' },
    { label: 'Finance', value: Math.floor(requests.length * 0.1), color: 'bg-orange-500' }
  ];

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

  const handleFileUpload = async () => {
    if (uploadFile) {
      try {
        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append('document', uploadFile);
        
        // Here you would typically send to your API
        // For now, we'll simulate the upload
        console.log('Uploading file:', uploadFile.name, 'Type:', uploadFile.type);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert(`File "${uploadFile.name}" uploaded successfully!`);
        setUploadFile(null);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-1">
              Finance Dashboard 💰
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              Financial overview and analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-10 px-4 text-sm font-semibold">
                  <Upload className="mr-1 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-gray-200 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-black text-lg font-bold">Upload Financial Document</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Upload invoices, receipts, or other financial documents
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <FileUpload
                    onFileSelect={setUploadFile}
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
                    maxSize={10 * 1024 * 1024}
                    label="Select Document"
                  />
                  {uploadFile && (
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setUploadFile(null)}
                        className="border border-gray-300 text-black hover:bg-gray-100"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleFileUpload}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        Upload
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              className="h-10 px-4 text-sm font-semibold border-black text-black hover:bg-black hover:text-white"
              onClick={() => {
                const csvData = requests.map(r => ({
                  Title: r.title,
                  Amount: r.amount,
                  Status: r.status,
                  'Created By': r.created_by_name,
                  'Created At': formatDate(r.created_at)
                }));
                const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'finance-report.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="mr-1 h-4 w-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Enhanced Financial Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-blue-800 uppercase">Total Requests</CardTitle>
              <div className="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 mb-1">{requests.length}</div>
              <p className="text-xs text-blue-700">All purchase requests</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-purple-800 uppercase">Total Amount</CardTitle>
              <div className="h-8 w-8 bg-purple-200 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 mb-1">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-purple-700">All requests combined</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-green-800 uppercase">Approved Amount</CardTitle>
              <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 mb-1">{formatCurrency(approvedAmount)}</div>
              <p className="text-xs text-green-700">Ready for payment</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-yellow-800 uppercase">Pending Amount</CardTitle>
              <div className="h-8 w-8 bg-yellow-200 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-yellow-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900 mb-1">{formatCurrency(pendingAmount)}</div>
              <p className="text-xs text-yellow-700">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-black flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Request Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimplePieChart data={statusChartData} title="" />
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-black flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Amount by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={amountChartData} title="" />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs for different views */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-gray-100 border border-gray-200 p-1 rounded">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-black data-[state=active]:text-white font-semibold px-4 py-1 rounded text-sm"
            >
              All Requests ({requests.length})
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="data-[state=active]:bg-black data-[state=active]:text-white font-semibold px-4 py-1 rounded text-sm"
            >
              Approved ({requests.filter(r => r.status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-black data-[state=active]:text-white font-semibold px-4 py-1 rounded text-sm"
            >
              Pending ({requests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-black flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  All Purchase Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-black font-semibold text-sm">Title</TableHead>
                      <TableHead className="text-black font-semibold text-sm">Amount</TableHead>
                      <TableHead className="text-black font-semibold text-sm">Status</TableHead>
                      <TableHead className="text-black font-semibold text-sm">Created By</TableHead>
                      <TableHead className="text-black font-semibold text-sm">Created At</TableHead>
                      <TableHead className="text-right text-black font-semibold text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50 border-gray-100">
                        <TableCell className="font-medium text-black text-sm">{request.title}</TableCell>
                        <TableCell className="text-black font-semibold text-sm">{formatCurrency(request.amount)}</TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className="text-black text-sm">{request.created_by_name}</TableCell>
                        <TableCell className="text-black text-sm">{formatDate(request.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border border-gray-300 text-black hover:bg-gray-100 text-xs px-2 py-1"
                              onClick={() => window.open(`/requests/${request.id}`, '_blank')}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border border-black text-black hover:bg-black hover:text-white text-xs px-2 py-1"
                              onClick={() => {
                                const data = `Request: ${request.title}\nAmount: ${formatCurrency(request.amount)}\nStatus: ${request.status}\nCreated By: ${request.created_by_name}\nDate: ${formatDate(request.created_at)}`;
                                const blob = new Blob([data], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `request-${request.id}-export.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Export
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card className="bg-white border border-green-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-green-800 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Approved Requests - Ready for Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-green-200">
                      <TableHead className="text-green-800 font-semibold text-sm">Title</TableHead>
                      <TableHead className="text-green-800 font-semibold text-sm">Amount</TableHead>
                      <TableHead className="text-green-800 font-semibold text-sm">Created By</TableHead>
                      <TableHead className="text-green-800 font-semibold text-sm">Created At</TableHead>
                      <TableHead className="text-right text-green-800 font-semibold text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.filter(r => r.status === 'approved').map((request) => (
                      <TableRow key={request.id} className="hover:bg-green-50 border-green-100">
                        <TableCell className="font-medium text-black text-sm">{request.title}</TableCell>
                        <TableCell className="text-green-700 font-bold text-sm">{formatCurrency(request.amount)}</TableCell>
                        <TableCell className="text-black text-sm">{request.created_by_name}</TableCell>
                        <TableCell className="text-black text-sm">{formatDate(request.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border border-green-300 text-green-700 hover:bg-green-100 text-xs px-2 py-1"
                              onClick={() => window.open(`/requests/${request.id}`, '_blank')}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-1"
                              onClick={() => {
                                const data = `Request: ${request.title}\nAmount: ${formatCurrency(request.amount)}\nStatus: ${request.status}\nCreated By: ${request.created_by_name}\nDate: ${formatDate(request.created_at)}`;
                                const blob = new Blob([data], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `request-${request.id}-export.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Export
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card className="bg-white border border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-yellow-800 flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Pending Requests - Awaiting Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-yellow-200">
                      <TableHead className="text-yellow-800 font-semibold text-sm">Title</TableHead>
                      <TableHead className="text-yellow-800 font-semibold text-sm">Amount</TableHead>
                      <TableHead className="text-yellow-800 font-semibold text-sm">Created By</TableHead>
                      <TableHead className="text-yellow-800 font-semibold text-sm">Created At</TableHead>
                      <TableHead className="text-right text-yellow-800 font-semibold text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.filter(r => r.status === 'pending').map((request) => (
                      <TableRow key={request.id} className="hover:bg-yellow-50 border-yellow-100">
                        <TableCell className="font-medium text-black text-sm">{request.title}</TableCell>
                        <TableCell className="text-yellow-700 font-bold text-sm">{formatCurrency(request.amount)}</TableCell>
                        <TableCell className="text-black text-sm">{request.created_by_name}</TableCell>
                        <TableCell className="text-black text-sm">{formatDate(request.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border border-yellow-300 text-yellow-700 hover:bg-yellow-100 text-xs px-2 py-1"
                              onClick={() => window.open(`/requests/${request.id}`, '_blank')}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-yellow-600 text-white hover:bg-yellow-700 text-xs px-2 py-1"
                              onClick={() => {
                                const data = `Request: ${request.title}\nAmount: ${formatCurrency(request.amount)}\nStatus: ${request.status}\nCreated By: ${request.created_by_name}\nDate: ${formatDate(request.created_at)}`;
                                const blob = new Blob([data], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `request-${request.id}-export.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Export
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}