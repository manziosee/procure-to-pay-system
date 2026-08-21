import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Upload, DollarSign, TrendingUp, FileText, Download, BarChart3, PieChart, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatusBadge } from '@/components/StatusBadge';
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

const STATUS_COLOR: Record<string, string> = {
  Approved: '#16a34a',
  Pending: '#d97706',
  Rejected: '#dc2626',
};

const SimpleBarChart = ({ data }: { data: Array<{ label: string; value: number }> }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-20 text-sm font-medium text-gray-500">{item.label}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
            <div
              className="h-full rounded-full bg-black transition-all duration-700 ease-out"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-24 text-right text-sm text-gray-600">{formatCurrency(item.value)}</div>
        </div>
      ))}
    </div>
  );
};

const SimplePieChart = ({ data }: { data: Array<{ label: string; value: number }> }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-gray-500">No data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 100, 0);
              return (
                <circle
                  key={item.label}
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke={STATUS_COLOR[item.label] || '#9ca3af'}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 justify-center">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[item.label] || '#9ca3af' }} />
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Check if user is finance
  if (user?.role !== 'finance') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Access denied. Finance role required.</p>
        <Button asChild>
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

  const statusChartData = [
    { label: 'Approved', value: requests.filter(r => r.status === 'approved').length },
    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length },
    { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length },
  ];

  const amountChartData = [
    { label: 'Approved', value: approvedAmount },
    { label: 'Pending', value: pendingAmount },
    { label: 'Rejected', value: rejectedAmount },
  ];

  // Real totals per calendar month, not a fixed arbitrary split of the grand total
  const monthlyData = (() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'short' }) };
    });

    return months.map(({ year, month, label }) => {
      const value = requests
        .filter((r) => {
          const created = new Date(r.created_at);
          return created.getFullYear() === year && created.getMonth() === month;
        })
        .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
      return { label, value };
    });
  })();

  const handleFileUpload = async () => {
    if (uploadFile) {
      try {
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
            <h1 className="font-display text-2xl font-bold text-black mb-1">
              Finance Dashboard
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              Financial overview and analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
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
                      <Button variant="outline" onClick={() => setUploadFile(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleFileUpload}>
                        Upload
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
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

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Requests</CardTitle>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{requests.length}</div>
              <p className="text-xs text-gray-500">All purchase requests</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Amount</CardTitle>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-gray-500">All requests combined</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approved Amount</CardTitle>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(approvedAmount)}</div>
              <p className="text-xs text-gray-500">Ready for payment</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Amount</CardTitle>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(pendingAmount)}</div>
              <p className="text-xs text-gray-500">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Request Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimplePieChart data={statusChartData} />
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Monthly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={monthlyData} />
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All Requests ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({requests.filter(r => r.status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({requests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  All Purchase Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium text-black">{request.title}</TableCell>
                        <TableCell className="text-black font-semibold">{formatCurrency(request.amount)}</TableCell>
                        <TableCell>
                          <StatusBadge status={request.status as 'pending' | 'approved' | 'rejected'} />
                        </TableCell>
                        <TableCell>{request.created_by_name}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/requests/${request.id}`, '_blank')}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
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
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Approved Requests — Ready for Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.filter(r => r.status === 'approved').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium text-black">{request.title}</TableCell>
                        <TableCell className="text-green-600 font-semibold">{formatCurrency(request.amount)}</TableCell>
                        <TableCell>{request.created_by_name}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/requests/${request.id}`, '_blank')}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
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
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Pending Requests — Awaiting Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.filter(r => r.status === 'pending').map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium text-black">{request.title}</TableCell>
                        <TableCell className="text-amber-600 font-semibold">{formatCurrency(request.amount)}</TableCell>
                        <TableCell>{request.created_by_name}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/requests/${request.id}`, '_blank')}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
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
