import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RequestList from '@/components/RequestList';
import { PurchaseRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequestsSync } from '@/hooks/useRequestsSync';

// Mock data for demo
const mockRequests: PurchaseRequest[] = [
  {
    id: 1,
    title: 'Office Supplies',
    description: 'Pens, papers, and other office supplies',
    amount: '250.00',
    status: 'pending',
    created_by: 1,
    created_by_name: 'John Staff',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    approvals: []
  },
  {
    id: 2,
    title: 'Laptop Computer',
    description: 'Dell Laptop for new employee',
    amount: '1200.00',
    status: 'approved',
    created_by: 1,
    created_by_name: 'John Staff',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-12T14:00:00Z',
    approvals: []
  },
  {
    id: 3,
    title: 'Software License',
    description: 'Adobe Creative Suite license',
    amount: '600.00',
    status: 'rejected',
    created_by: 1,
    created_by_name: 'John Staff',
    created_at: '2024-01-08T11:00:00Z',
    updated_at: '2024-01-09T16:00:00Z',
    approvals: []
  }
];

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
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
    }
    setFilteredRequests(filtered);
  }, [requests, user]);

  const getStats = (): Stats => {
    if (!filteredRequests) return { pending: 0, approved: 0, rejected: 0 };
    
    return filteredRequests.reduce((acc: Stats, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-gray-600">
            {user?.role?.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'staff' && (
            <Button asChild className="bg-black text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105 transform shadow-lg font-semibold">
              <Link to="/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Link>
            </Button>
          )}
          
          {user?.role?.includes('approver') && (
            <Button asChild variant="outline" className="border-black text-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105">
              <Link to="/approvals">
                <CheckCircle className="mr-2 h-4 w-4" />
                View Approvals
              </Link>
            </Button>
          )}
          
          {user?.role === 'finance' && (
            <Button asChild variant="outline" className="border-black text-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105">
              <Link to="/finance">
                <DollarSign className="mr-2 h-4 w-4" />
                Finance Dashboard
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:border-yellow-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
            <div className="h-8 w-8 bg-yellow-200 rounded-full flex items-center justify-center">
              🕐
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
            <p className="text-xs text-yellow-700 font-medium">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:border-green-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Approved</CardTitle>
            <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
              ✅
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
            <p className="text-xs text-green-700 font-medium">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 hover:border-red-400 transition-all duration-300 hover:scale-105 transform hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Rejected</CardTitle>
            <div className="h-8 w-8 bg-red-200 rounded-full flex items-center justify-center">
              ❌
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
            <p className="text-xs text-red-700 font-medium">
              Declined requests
            </p>
          </CardContent>
        </Card>
      </div>

      <RequestList 
        requests={filteredRequests} 
        loading={isLoading} 
        onDelete={deleteRequest}
      />
    </div>
  );
}