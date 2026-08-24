import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Upload, DollarSign, TrendingUp, FileText, Download, BarChart3, PieChart, Calendar, Building2, Wallet, Clock, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useRequestsSync } from '@/hooks/useRequestsSync';
import { SimpleLineChart } from '@/components/charts/SimpleLineChart';
import { finance as financeAPI, vendors as vendorsAPI, purchaseRequests as purchaseRequestsAPI } from '@/services/api';
import { RequestFilters } from '@/components/RequestFilters';
import { RequestPagination } from '@/components/RequestPagination';
import type { Vendor, Budget, BudgetStatus, PurchaseRequest } from '@/types';
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
  const [topVendors, setTopVendors] = useState<Vendor[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [newBudgetDept, setNewBudgetDept] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  // All-requests table: searched/filtered/paginated independently of the aggregate
  // stats/charts above, which reflect the unfiltered first page from useRequestsSync.
  const [tableItems, setTableItems] = useState<PurchaseRequest[]>([]);
  const [tableCount, setTableCount] = useState(0);
  const [tableNext, setTableNext] = useState<string | null>(null);
  const [tablePrevious, setTablePrevious] = useState<string | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatus, setTableStatus] = useState('all');
  const [tablePage, setTablePage] = useState(1);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const loadBudgetData = () => {
    financeAPI.getBudgets().then((res) => setBudgets(res.data.results || res.data || [])).catch(() => {});
    financeAPI.getBudgetStatus().then((res) => setBudgetStatus(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    vendorsAPI.getAll().then((res) => setTopVendors((res.data.results || res.data || []).slice(0, 5))).catch(() => {});
    loadBudgetData();
  }, []);

  useEffect(() => {
    setTableLoading(true);
    const timeout = setTimeout(() => {
      const params: Record<string, string | number> = { page: tablePage };
      if (tableSearch.trim()) params.search = tableSearch.trim();
      if (tableStatus !== 'all') params.status = tableStatus;

      purchaseRequestsAPI.getAll(params)
        .then((res) => {
          const data = res.data;
          setTableItems(data.results || data || []);
          setTableCount(data.count ?? (data.results || data || []).length);
          setTableNext(data.next ?? null);
          setTablePrevious(data.previous ?? null);
        })
        .catch((error) => console.error('Error loading requests table:', error))
        .finally(() => setTableLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [tableSearch, tableStatus, tablePage]);

  // Reset to page 1 whenever the filters change
  useEffect(() => {
    setTablePage(1);
  }, [tableSearch, tableStatus]);

  const existingBudgetForNewDept = budgets.find(
    (b) => b.department.toLowerCase() === newBudgetDept.trim().toLowerCase()
  );

  const handleAddBudget = async () => {
    const limit = parseFloat(newBudgetLimit);
    const department = newBudgetDept.trim();
    if (!department || !limit || limit <= 0) return;
    setSavingBudget(true);
    try {
      if (existingBudgetForNewDept) {
        await financeAPI.updateBudget(existingBudgetForNewDept.id, { monthly_limit: limit });
      } else {
        await financeAPI.createBudget({ department, monthly_limit: limit });
      }
      setNewBudgetDept('');
      setNewBudgetLimit('');
      loadBudgetData();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget');
    } finally {
      setSavingBudget(false);
    }
  };

  // Average days between a request's creation and its final approval/rejection
  const avgTurnaroundDays = (() => {
    const resolved = requests.filter((r) => r.status !== 'pending' && r.approvals?.length);
    if (resolved.length === 0) return null;
    const totalDays = resolved.reduce((sum, r) => {
      const created = new Date(r.created_at).getTime();
      const lastAction = Math.max(...r.approvals.map((a) => new Date(a.created_at).getTime()));
      return sum + (lastAction - created) / (1000 * 60 * 60 * 24);
    }, 0);
    return (totalDays / resolved.length).toFixed(1);
  })();

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
              <SimpleLineChart data={monthlyData} />
            </CardContent>
          </Card>
        </div>

        {/* Top Vendors + Approval Turnaround */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-gray-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Top Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topVendors.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No vendors yet — vendors appear once a proforma invoice is processed.</p>
              ) : (
                <div className="space-y-3">
                  {topVendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-black">{vendor.name}</p>
                        <p className="text-xs text-gray-500">{vendor.request_count} request{vendor.request_count === 1 ? '' : 's'}</p>
                      </div>
                      <p className="font-semibold text-black">{vendor.total_spend ? formatCurrency(vendor.total_spend) : '—'}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full mt-4">
                <Link to="/vendors">View All Vendors</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg. Approval Turnaround</CardTitle>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {avgTurnaroundDays !== null ? `${avgTurnaroundDays}d` : '—'}
              </div>
              <p className="text-xs text-gray-500">From submission to final decision</p>
            </CardContent>
          </Card>
        </div>

        {/* Department Budgets */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Department Budgets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetStatus.length === 0 ? (
              <p className="text-sm text-gray-500">No department budgets set yet.</p>
            ) : (
              <div className="space-y-4">
                {budgetStatus.map((b) => (
                  <div key={b.department}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-black">{b.department}</span>
                      <span className={`text-xs ${b.percentage_used > 100 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {formatCurrency(b.spent)} / {formatCurrency(b.monthly_limit)} ({b.percentage_used}%)
                        {b.percentage_used > 100 ? ' — over budget' : ''}
                      </span>
                    </div>
                    <Progress value={Math.min(b.percentage_used, 100)} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 pt-2 border-t border-gray-100">
              <div className="flex-1 space-y-1">
                <Label htmlFor="budget-dept" className="text-xs">Department</Label>
                <Input
                  id="budget-dept"
                  placeholder="e.g. Engineering"
                  value={newBudgetDept}
                  onChange={(e) => setNewBudgetDept(e.target.value)}
                />
              </div>
              <div className="w-40 space-y-1">
                <Label htmlFor="budget-limit" className="text-xs">Monthly Limit (RWF)</Label>
                <Input
                  id="budget-limit"
                  type="number"
                  placeholder="0"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                />
              </div>
              <Button onClick={handleAddBudget} disabled={savingBudget}>
                <Plus className="mr-1 h-4 w-4" />
                {existingBudgetForNewDept ? 'Update' : 'Add'}
              </Button>
            </div>
          </CardContent>
        </Card>

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
              <CardHeader className="space-y-3">
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  All Purchase Requests
                </CardTitle>
                <RequestFilters
                  search={tableSearch}
                  onSearchChange={setTableSearch}
                  status={tableStatus}
                  onStatusChange={setTableStatus}
                />
              </CardHeader>
              <CardContent>
                {tableLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                  </div>
                ) : tableItems.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">No requests match your filters.</p>
                ) : (
                  <>
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
                        {tableItems.map((request) => (
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
                    <RequestPagination
                      page={tablePage}
                      count={tableCount}
                      hasNext={!!tableNext}
                      hasPrevious={!!tablePrevious}
                      onPageChange={setTablePage}
                    />
                  </>
                )}
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
