import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Upload, DollarSign, TrendingUp, FileText, Download } from 'lucide-react';
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



export default function FinanceDashboard() {
  const { user } = useAuth();
  const { requests, isLoading, loadRequests } = useRequestsSync();
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

  const handleFileUpload = () => {
    if (uploadFile) {
      console.log('Uploading file:', uploadFile.name);
      alert('File uploaded successfully!');
      setUploadFile(null);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Finance Dashboard</h1>
          <p className="text-gray-600">
            Financial overview and document management
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-black">Upload Financial Document</DialogTitle>
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
                    className="border-gray-300 text-black hover:bg-gray-100"
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
      </div>

      {/* Financial Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:border-blue-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Requests</CardTitle>
            <div className="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center">
              📄
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{requests.length}</div>
            <p className="text-xs text-blue-700 font-medium">All purchase requests</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:border-purple-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Total Amount</CardTitle>
            <div className="h-8 w-8 bg-purple-200 rounded-full flex items-center justify-center">
              💰
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-purple-700 font-medium">All requests combined</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:border-green-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Approved Amount</CardTitle>
            <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
              ✅
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{formatCurrency(approvedAmount)}</div>
            <p className="text-xs text-green-700 font-medium">Ready for payment</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:border-yellow-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending Amount</CardTitle>
            <div className="h-8 w-8 bg-yellow-200 rounded-full flex items-center justify-center">
              🕐
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-yellow-700 font-medium">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-black data-[state=active]:text-white">
            All Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Approved ({requests.filter(r => r.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Pending ({requests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Title</TableHead>
                  <TableHead className="text-black">Amount</TableHead>
                  <TableHead className="text-black">Status</TableHead>
                  <TableHead className="text-black">Created By</TableHead>
                  <TableHead className="text-black">Created At</TableHead>
                  <TableHead className="text-right text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <TableCell className="font-medium text-black">{request.title}</TableCell>
                    <TableCell className="text-black">{formatCurrency(request.amount)}</TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-black">{request.created_by_name}</TableCell>
                    <TableCell className="text-black">{formatDate(request.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="sm" className="hover:bg-gray-100">
                          <Link to={`/requests/${request.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-300 text-black hover:bg-gray-100"
                          onClick={() => {
                            console.log('Downloading report for request:', request.id);
                            alert('Financial report downloaded!');
                          }}
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Report
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card className="border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Title</TableHead>
                  <TableHead className="text-black">Amount</TableHead>
                  <TableHead className="text-black">Created By</TableHead>
                  <TableHead className="text-black">Created At</TableHead>
                  <TableHead className="text-right text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.filter(r => r.status === 'approved').map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <TableCell className="font-medium text-black">{request.title}</TableCell>
                    <TableCell className="text-black">{formatCurrency(request.amount)}</TableCell>
                    <TableCell className="text-black">{request.created_by_name}</TableCell>
                    <TableCell className="text-black">{formatDate(request.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="hover:bg-gray-100">
                        <Link to={`/requests/${request.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card className="border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Title</TableHead>
                  <TableHead className="text-black">Amount</TableHead>
                  <TableHead className="text-black">Created By</TableHead>
                  <TableHead className="text-black">Created At</TableHead>
                  <TableHead className="text-right text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.filter(r => r.status === 'pending').map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <TableCell className="font-medium text-black">{request.title}</TableCell>
                    <TableCell className="text-black">{formatCurrency(request.amount)}</TableCell>
                    <TableCell className="text-black">{request.created_by_name}</TableCell>
                    <TableCell className="text-black">{formatDate(request.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="hover:bg-gray-100">
                        <Link to={`/requests/${request.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}