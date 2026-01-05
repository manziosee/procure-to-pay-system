import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, Users, FileText, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RequestList from '@/components/RequestList';
import { PurchaseRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequestsSync } from '@/hooks/useRequestsSync';

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
    
    // Calculate additional metrics for staff
    if (user?.role === 'staff') {
      const totalValue = filteredRequests.reduce((sum, req) => sum + parseFloat(req.amount || '0'), 0);
      stats.totalValue = totalValue;
      stats.avgValue = filteredRequests.length > 0 ? totalValue / filteredRequests.length : 0;
      
      // Mock monthly growth (in real app, compare with previous month)
      stats.monthlyGrowth = Math.floor(Math.random() * 20) + 5;
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

        {/* Extended Stats for Role-specific Metrics */}
        {roleSpecificStats.length > 4 && (
          <div className="grid gap-4 md:grid-cols-3">
            {roleSpecificStats.slice(0, 3).map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className={`${stat.bg} ${stat.border}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={`text-xs font-semibold uppercase ${stat.color}`}>
                      {stat.title}
                    </CardTitle>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${stat.bg}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-xl font-bold mb-1 ${stat.color}`}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
              showActions={false}
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