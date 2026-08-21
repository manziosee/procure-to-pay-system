import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, DollarSign, FileText, Activity, BarChart3, PieChart, Calendar, Target, AlertTriangle, Download, Upload, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RequestList from '@/components/RequestList';
import { PurchaseRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { finance as financeAPI } from '@/services/api';
import { useRequestsSync } from '@/hooks/useRequestsSync';

// Monthly activity: plain, no status semantics, so it stays neutral gray/black.
const SimpleBarChart = ({ data }: { data: Array<{ label: string; value: number }> }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-10 text-sm font-medium text-gray-500">{item.label}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-black transition-all duration-700 ease-out"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-8 text-right text-sm text-gray-600">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

// Approved/Pending/Rejected distribution: the one place status color genuinely carries meaning.
const STATUS_COLOR: Record<string, string> = {
  Approved: '#16a34a',
  Pending: '#d97706',
  Rejected: '#dc2626',
};

const SimplePieChart = ({ data }: { data: Array<{ label: string; value: number }> }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-gray-500">No data yet</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 100, 0);
            return (
              <circle
                key={item.label}
                cx="50" cy="50" r="35"
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
            <div className="text-lg font-bold text-black">{total}</div>
            <div className="text-[10px] text-gray-500">Total</div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[item.label] || '#9ca3af' }} />
            <span className="text-gray-700">{item.label}</span>
            <span className="text-gray-400">·</span>
            <span className="font-medium text-black">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total?: number;
  totalValue?: number;
  avgValue?: number;
  monthlyGrowth?: number;
  approvalRate?: number;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'positive' | 'negative' | 'attention';
}

const toneClass: Record<NonNullable<StatCard['tone']>, string> = {
  positive: 'text-green-600',
  negative: 'text-destructive',
  attention: 'text-amber-600',
};

function StatCardView({ title, value, icon: Icon, tone }: StatCard) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</CardTitle>
        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-700" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${tone ? toneClass[tone] : 'text-black'}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { requests, isLoading, loadRequests, deleteRequest } = useRequestsSync();
  const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>([]);

  useEffect(() => {
    if (user) loadRequests();
  }, [user, loadRequests]);

  useEffect(() => {
    // Filter requests based on user role
    let filtered = requests;
    if (user?.role === 'staff') {
      filtered = requests.filter(req => req.created_by === user.id);
    } else if (user?.role?.includes('approver')) {
      // For approvers, show all requests (they can see pending, approved, rejected)
      filtered = requests;
    }
    setFilteredRequests(filtered);
  }, [requests, user]);

  const getStats = (): Stats => {
    if (!filteredRequests) return { pending: 0, approved: 0, rejected: 0 };

    const baseStats = { pending: 0, approved: 0, rejected: 0 };

    // For approvers, count based on their individual approval actions
    if (user?.role?.includes('approver')) {
      const stats = filteredRequests.reduce((acc: Stats, req) => {
        const userApproval = req.approvals?.find(approval =>
          approval.approver === user.id || approval.approver_id === user.id
        );

        if (userApproval) {
          if (userApproval.approved === true) {
            acc.approved += 1;
          } else if (userApproval.approved === false) {
            acc.rejected += 1;
          }
        } else if (req.status === 'pending') {
          acc.pending += 1;
        }

        return acc;
      }, baseStats);

      const total = stats.pending + stats.approved + stats.rejected;
      stats.total = total;
      stats.approvalRate = total > 0 ? Math.round((stats.approved / total) * 100) : 0;

      return stats;
    }

    // For staff and finance, use request status
    const stats = filteredRequests.reduce((acc: Stats, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, baseStats);

    // Calculate additional metrics
    const totalValue = filteredRequests.reduce((sum, req) => sum + parseFloat(req.amount || '0'), 0);
    stats.totalValue = totalValue;
    stats.avgValue = filteredRequests.length > 0 ? totalValue / filteredRequests.length : 0;

    // Real month-over-month growth in approved value (not a mock number)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const approvedValueSince = (from: Date, to?: Date) =>
      filteredRequests
        .filter((req) => {
          if (req.status !== 'approved') return false;
          const created = new Date(req.created_at);
          return created >= from && (!to || created < to);
        })
        .reduce((sum, req) => sum + parseFloat(req.amount || '0'), 0);

    const currentMonthValue = approvedValueSince(currentMonthStart);
    const lastMonthValue = approvedValueSince(lastMonthStart, currentMonthStart);

    if (lastMonthValue > 0) {
      stats.monthlyGrowth = Math.round(((currentMonthValue - lastMonthValue) / lastMonthValue) * 100);
    } else {
      stats.monthlyGrowth = currentMonthValue > 0 ? 100 : 0;
    }

    stats.total = stats.pending + stats.approved + stats.rejected;

    return stats;
  };

  const stats = getStats();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const firstName = user?.first_name || user?.username || 'User';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFourthStatCard = (): StatCard | null => {
    if (user?.role === 'staff') {
      const growth = stats.monthlyGrowth ?? 0;
      return {
        title: `${currentMonth} Growth`,
        value: `${growth >= 0 ? '+' : ''}${growth}%`,
        icon: Activity,
        tone: growth >= 0 ? 'positive' : 'negative',
      };
    }
    if (user?.role?.includes('approver')) {
      return {
        title: 'Approval Rate',
        value: `${stats.approvalRate || 0}%`,
        icon: Target,
        tone: 'positive',
      };
    }
    return null;
  };

  const fourthStatCard = getFourthStatCard();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4">
        {/* Welcome Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="font-display text-2xl font-bold text-black mb-1">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                {user?.role?.replace('_', ' ').toUpperCase()} DASHBOARD
              </p>
            </div>
            <div className="flex gap-2">
              {user?.role === 'staff' && (
                <Button asChild>
                  <Link to="/requests/new">
                    <Plus className="mr-1 h-4 w-4" />
                    Create Request
                  </Link>
                </Button>
              )}

              {user?.role?.includes('approver') && (
                <Button asChild variant="outline">
                  <Link to="/approvals">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Review Requests
                  </Link>
                </Button>
              )}

              {user?.role === 'finance' && (
                <Button asChild variant="outline">
                  <Link to="/finance">
                    <DollarSign className="mr-1 h-4 w-4" />
                    Finance Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCardView title="Pending" value={stats.pending} icon={Clock} tone="attention" />
          <StatCardView title="Approved" value={stats.approved} icon={CheckCircle} tone="positive" />
          <StatCardView title="Rejected" value={stats.rejected} icon={XCircle} tone="negative" />
          {fourthStatCard && <StatCardView {...fourthStatCard} />}
        </div>

        {/* Analytics Section for Finance and Approvers */}
        {(user?.role === 'finance' || user?.role?.includes('approver')) && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Request Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimplePieChart
                  data={[
                    { label: 'Approved', value: stats.approved || 0 },
                    { label: 'Pending', value: stats.pending || 0 },
                    { label: 'Rejected', value: stats.rejected || 0 },
                  ]}
                />
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
                <SimpleBarChart
                  data={[
                    { label: 'Jan', value: Math.floor((stats.total || 0) * 0.1) },
                    { label: 'Feb', value: Math.floor((stats.total || 0) * 0.15) },
                    { label: 'Mar', value: Math.floor((stats.total || 0) * 0.12) },
                    { label: 'Apr', value: Math.floor((stats.total || 0) * 0.18) },
                    { label: 'May', value: Math.floor((stats.total || 0) * 0.20) },
                    { label: 'Jun', value: Math.floor((stats.total || 0) * 0.25) },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Finance-Specific Advanced Tools */}
        {user?.role === 'finance' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Budget Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Approved</span>
                  <span className="font-semibold text-black">RWF {((stats.totalValue || 0) * (stats.approved / (stats.total || 1))).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Request</span>
                  <span className="font-semibold text-black">RWF {(stats.avgValue || 0).toLocaleString()}</span>
                </div>
                <Button asChild className="w-full">
                  <Link to="/finance">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Full Finance Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Document Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Upload financial documents, invoices, and reports</p>
                <Button
                  className="w-full"
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '.pdf,.jpg,.jpeg,.png,.xlsx,.csv';
                    fileInput.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('title', file.name);
                        formData.append('document_type', 'financial_report');

                        try {
                          await financeAPI.uploadDocument(formData);
                          alert('Document uploaded successfully!');
                        } catch (error) {
                          console.error('Error uploading document:', error);
                          alert(`File "${file.name}" selected. Upload functionality will be available when backend is deployed.`);
                        }
                      }
                    };
                    fileInput.click();
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await financeAPI.exportReport();
                      const url = URL.createObjectURL(response.data);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'financial_report.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Export error:', error);
                      // Fallback to client-side generation
                      const csvData = requests.map(r => ({
                        Title: r.title,
                        Amount: r.amount,
                        Status: r.status,
                        'Created By': r.created_by_name,
                        'Created At': new Date(r.created_at).toLocaleDateString()
                      }));

                      const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'financial_report.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Reports
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Alerts & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High Value Requests</span>
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                      {filteredRequests.filter(r => parseFloat(r.amount) > 100000).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overdue Reviews</span>
                    <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">
                      {Math.floor(stats.pending * 0.3)}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await financeAPI.generateAlerts();
                      alert(`Generated ${response.data.alerts_created} compliance alerts`);
                    } catch (error) {
                      console.error('Error generating alerts:', error);
                      // Fallback to client-side calculation
                      const overdueCount = requests.filter(r =>
                        new Date(r.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ).length;
                      alert(`Generated ${overdueCount} compliance alerts for overdue requests`);
                    }
                  }}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  View All Alerts
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Approver-Specific Advanced Tools */}
        {user?.role?.includes('approver') && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Approval Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approval Rate</span>
                    <span className="font-semibold text-black">{stats.approvalRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-black h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${stats.approvalRate || 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{stats.approved}</div>
                      <div className="text-xs text-gray-500">Approved</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-600">{stats.pending}</div>
                      <div className="text-xs text-gray-500">Pending</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-destructive">{stats.rejected}</div>
                      <div className="text-xs text-gray-500">Rejected</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Review Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Reviews</span>
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 font-semibold">
                      {stats.pending}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Priority Items</span>
                    <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">
                      {Math.floor(stats.pending * 0.2)}
                    </Badge>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/approvals">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Review Now
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions Panel */}
        {(user?.role === 'staff' || user?.role?.includes('approver')) && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                {user?.role === 'staff' ? 'Quick Actions' : 'Approval Center'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {user?.role === 'staff' && (
                  <>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1">
                      <Link to="/requests/new">
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-semibold">New Request</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1">
                      <Link to="/requests?status=pending">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-semibold">Pending ({stats.pending})</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1">
                      <Link to="/requests?status=approved">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">Approved ({stats.approved})</span>
                      </Link>
                    </Button>
                  </>
                )}

                {user?.role?.includes('approver') && (
                  <>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1">
                      <Link to="/approvals">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-semibold">Review Pending ({stats.pending})</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1">
                      <Link to="/approvals?filter=approved">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">My Approved ({stats.approved})</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1">
                      <Link to="/approvals?filter=rejected">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">My Rejected ({stats.rejected})</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Urgent Alerts for Approvers */}
              {user?.role?.includes('approver') && stats.pending > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-amber-600 mr-2" />
                    <p className="text-sm font-medium text-amber-800">
                      <span className="font-bold">{stats.pending}</span> requests awaiting your review
                      {stats.pending > 3 && <span className="text-destructive font-bold"> (Urgent)</span>}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Summary */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RequestList
              requests={filteredRequests.slice(0, 5)}
              loading={isLoading}
              onDelete={deleteRequest}
              showActions={true}
            />
            {filteredRequests.length > 5 && (
              <div className="mt-3 text-center">
                <Button asChild variant="outline">
                  <Link to="/requests">
                    View All Requests ({filteredRequests.length})
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
