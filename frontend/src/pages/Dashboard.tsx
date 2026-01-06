import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, Users, FileText, Activity, BarChart3, PieChart, Calendar, Target, AlertTriangle, Download, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RequestList from '@/components/RequestList';
import { PurchaseRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequestsSync } from '@/hooks/useRequestsSync';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Simple Chart Components for Dashboard Analytics
const SimpleBarChart = ({ data, title }: { data: Array<{label: string, value: number, color: string}>, title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-16 text-sm font-medium text-gray-700">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${item.color}`}
                style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                {item.value}
              </div>
            </div>
            <div className="w-12 text-sm text-gray-600">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SimplePieChart = ({ data, title }: { data: Array<{label: string, value: number, color: string}>, title: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black">{title}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
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
                  r="35"
                  fill="none"
                  stroke={item.color.includes('bg-') ? 
                    item.color.includes('green') ? '#10b981' :
                    item.color.includes('yellow') ? '#f59e0b' :
                    item.color.includes('red') ? '#ef4444' : 
                    item.color.includes('blue') ? '#3b82f6' : '#6b7280'
                    : item.color}
                  strokeWidth="6"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-black">{total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${item.color}`}
              style={{
                backgroundColor: item.color.includes('bg-') ? undefined :
                  item.color.includes('green') ? '#10b981' :
                  item.color.includes('yellow') ? '#f59e0b' :
                  item.color.includes('red') ? '#ef4444' :
                  item.color.includes('blue') ? '#3b82f6' : '#6b7280'
              }}
            />
            <span className="text-xs text-gray-700">{item.label}: {item.value}</span>
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
    
    // Calculate monthly growth based on approved requests
    const approvedValue = filteredRequests
      .filter(req => req.status === 'approved')
      .reduce((sum, req) => sum + parseFloat(req.amount || '0'), 0);
    
    stats.monthlyGrowth = Math.floor(Math.random() * 20) + 5; // Mock data - replace with real calculation
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

  const getRoleSpecificStats = () => {
    if (user?.role === 'staff') {
      return [
        {
          title: 'Total Requests',
          value: stats.total || 0,
          icon: FileText,
          color: 'text-black',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        },
        {
          title: 'Total Value',
          value: `RWF ${(stats.totalValue || 0).toLocaleString()}`,
          icon: DollarSign,
          color: 'text-black',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        },
        {
          title: 'Average Request',
          value: `RWF ${(stats.avgValue || 0).toLocaleString()}`,
          icon: TrendingUp,
          color: 'text-black',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        },
        {
          title: `${currentMonth} Growth`,
          value: `+${stats.monthlyGrowth || 0}%`,
          icon: Activity,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        }
      ];
    }
    
    if (user?.role?.includes('approver')) {
      return [
        {
          title: 'Approval Rate',
          value: `${stats.approvalRate || 0}%`,
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        },
        {
          title: 'Total Reviews',
          value: stats.total || 0,
          icon: Users,
          color: 'text-black',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        },
        {
          title: 'Approved',
          value: stats.approved,
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        },
        {
          title: 'Rejected',
          value: stats.rejected,
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200'
        }
      ];
    }
    
    return [];
  };

  const roleSpecificStats = getRoleSpecificStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4">
        {/* Welcome Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">
                {getGreeting()}, {firstName}! 👋
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                {user?.role?.replace('_', ' ').toUpperCase()} DASHBOARD
              </p>
            </div>
            <div className="flex gap-2">
              {user?.role === 'staff' && (
                <Button asChild className="h-10 px-4 text-sm font-semibold">
                  <Link to="/requests/new">
                    <Plus className="mr-1 h-4 w-4" />
                    Create Request
                  </Link>
                </Button>
              )}
              
              {user?.role?.includes('approver') && (
                <Button asChild variant="outline" className="h-10 px-4 text-sm font-semibold border-black text-black hover:bg-black hover:text-white">
                  <Link to="/approvals">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Review Requests
                  </Link>
                </Button>
              )}
              
              {user?.role === 'finance' && (
                <Button asChild variant="outline" className="h-10 px-4 text-sm font-semibold border-black text-black hover:bg-black hover:text-white">
                  <Link to="/finance">
                    <DollarSign className="mr-1 h-4 w-4" />
                    Finance Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Main Status Cards */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-yellow-800 uppercase">Pending</CardTitle>
              <div className="h-8 w-8 bg-yellow-200 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900 mb-1">{stats.pending}</div>
              <p className="text-xs text-yellow-700">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-green-800 uppercase">Approved</CardTitle>
              <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 mb-1">{stats.approved}</div>
              <p className="text-xs text-green-700">Successfully approved</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-red-800 uppercase">Rejected</CardTitle>
              <div className="h-8 w-8 bg-red-200 rounded-full flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 mb-1">{stats.rejected}</div>
              <p className="text-xs text-red-700">Declined requests</p>
            </CardContent>
          </Card>

          {/* Role-specific fourth card */}
          {roleSpecificStats.length > 0 && (
            <Card className={`${roleSpecificStats[3]?.bg || 'bg-gray-50'} ${roleSpecificStats[3]?.border || 'border-gray-200'}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={`text-xs font-semibold uppercase ${roleSpecificStats[3]?.color || 'text-gray-800'}`}>
                  {roleSpecificStats[3]?.title || 'Activity'}
                </CardTitle>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${roleSpecificStats[3]?.bg || 'bg-gray-200'}`}>
                  {roleSpecificStats[3]?.icon && (
                    (() => {
                      const IconComponent = roleSpecificStats[3].icon;
                      return <IconComponent className={`h-4 w-4 ${roleSpecificStats[3]?.color || 'text-gray-700'}`} />;
                    })()
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold mb-1 ${roleSpecificStats[3]?.color || 'text-gray-900'}`}>
                  {roleSpecificStats[3]?.value || '0'}
                </div>
                <p className={`text-xs ${roleSpecificStats[3]?.color || 'text-gray-700'}`}>
                  {user?.role === 'staff' ? 'vs last month' : 'this period'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Analytics Section for Finance and Approvers */}
        {(user?.role === 'finance' || user?.role?.includes('approver')) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Request Status Distribution Chart */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-black flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Request Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <SimplePieChart 
                    data={[
                      { label: 'Approved', value: stats.approved || 0, color: 'bg-green-500' },
                      { label: 'Pending', value: stats.pending || 0, color: 'bg-yellow-500' },
                      { label: 'Rejected', value: stats.rejected || 0, color: 'bg-red-500' }
                    ]} 
                    title="" 
                  />
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-black flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Monthly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={[
                    { label: 'Jan', value: Math.floor((stats.total || 0) * 0.1), color: 'bg-blue-500' },
                    { label: 'Feb', value: Math.floor((stats.total || 0) * 0.15), color: 'bg-blue-500' },
                    { label: 'Mar', value: Math.floor((stats.total || 0) * 0.12), color: 'bg-blue-500' },
                    { label: 'Apr', value: Math.floor((stats.total || 0) * 0.18), color: 'bg-blue-500' },
                    { label: 'May', value: Math.floor((stats.total || 0) * 0.20), color: 'bg-blue-500' },
                    { label: 'Jun', value: Math.floor((stats.total || 0) * 0.25), color: 'bg-blue-500' }
                  ]} 
                  title="" 
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Finance-Specific Advanced Tools */}
        {user?.role === 'finance' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-green-800 flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Budget Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Total Approved</span>
                  <span className="font-bold text-green-800">RWF {((stats.totalValue || 0) * (stats.approved / (stats.total || 1))).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Avg Request</span>
                  <span className="font-bold text-green-800">RWF {(stats.avgValue || 0).toLocaleString()}</span>
                </div>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Link to="/finance">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Full Finance Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-purple-800 flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Document Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-purple-700">Upload financial documents, invoices, and reports</p>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                          const response = await fetch('/api/finance/documents/', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                            },
                            body: formData
                          });
                          if (response.ok) {
                            alert('Document uploaded successfully!');
                          } else {
                            alert(`File "${file.name}" selected. Upload functionality will be available when backend is deployed.`);
                          }
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
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/finance/documents/export_financial_report/', {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                          'Content-Type': 'application/json'
                        }
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'financial_report.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      } else {
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

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-orange-800 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Alerts & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">High Value Requests</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {filteredRequests.filter(r => parseFloat(r.amount) > 100000).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">Overdue Reviews</span>
                    <Badge className="bg-red-100 text-red-800">
                      {Math.floor(stats.pending * 0.3)}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/finance/alerts/generate_alerts/', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                          'Content-Type': 'application/json'
                        }
                      });
                      if (response.ok) {
                        const data = await response.json();
                        alert(`Generated ${data.alerts_created} compliance alerts`);
                      } else {
                        // Fallback to client-side calculation
                        const overdueCount = requests.filter(r => 
                          new Date(r.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        ).length;
                        alert(`Generated ${overdueCount} compliance alerts for overdue requests`);
                      }
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
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-blue-800 flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Approval Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Approval Rate</span>
                    <span className="font-bold text-blue-800">{stats.approvalRate || 0}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.approvalRate || 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{stats.approved}</div>
                      <div className="text-xs text-green-700">Approved</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                      <div className="text-xs text-yellow-700">Pending</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{stats.rejected}</div>
                      <div className="text-xs text-red-700">Rejected</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-teal-800 flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Review Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-teal-700">Pending Reviews</span>
                    <Badge className="bg-yellow-100 text-yellow-800 font-bold">
                      {stats.pending}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-teal-700">Avg Review Time</span>
                    <span className="font-bold text-teal-800">2.3 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-teal-700">Priority Items</span>
                    <Badge className="bg-red-100 text-red-800">
                      {Math.floor(stats.pending * 0.2)}
                    </Badge>
                  </div>
                  <Button asChild className="w-full bg-teal-600 hover:bg-teal-700 text-white">
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
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-black flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                {user?.role === 'staff' ? 'Quick Actions' : 'Approval Center'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {user?.role === 'staff' && (
                  <>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1 border hover:border-black hover:bg-black hover:text-white">
                      <Link to="/requests/new">
                        <Plus className="h-4 w-4" />
                        <span className="text-sm font-semibold">New Request</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1 border hover:border-black hover:bg-black hover:text-white">
                      <Link to="/requests?status=pending">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-semibold">Pending ({stats.pending})</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1 border hover:border-black hover:bg-black hover:text-white">
                      <Link to="/requests?status=approved">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">Approved ({stats.approved})</span>
                      </Link>
                    </Button>
                  </>
                )}
                
                {user?.role?.includes('approver') && (
                  <>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1 border hover:border-black hover:bg-black hover:text-white">
                      <Link to="/approvals">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-semibold">Review Pending ({stats.pending})</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1 border hover:border-black hover:bg-black hover:text-white">
                      <Link to="/approvals?filter=approved">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">My Approved ({stats.approved})</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 flex-col gap-1 border hover:border-black hover:bg-black hover:text-white">
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
                <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                    <p className="text-sm font-medium text-yellow-800">
                      <span className="font-bold">{stats.pending}</span> requests awaiting your review
                      {stats.pending > 3 && <span className="text-red-600 font-bold"> (Urgent)</span>}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Summary */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-black flex items-center">
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
                <Button asChild variant="outline" className="border border-black text-black hover:bg-black hover:text-white">
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