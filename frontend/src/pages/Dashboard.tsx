import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RequestList from '@/components/RequestList';
import { PurchaseRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const { purchaseRequests } = await import('@/services/api');
        const response = await purchaseRequests.getAll();
        let allRequests = response.data.results || response.data || [];
        
        // Filter based on user role
        if (user?.role === 'staff') {
          // Staff can only see their own requests
          allRequests = allRequests.filter((req: any) => req.created_by === user.id);
        } else if (user?.role?.includes('approver')) {
          // Approvers see pending requests and their reviewed requests
          allRequests = allRequests.filter((req: any) => 
            req.status === 'pending' || req.approved_by === user.id
          );
        }
        // Finance sees all requests
        
        setRequests(allRequests);
      } catch (error) {
        console.error('Error loading requests:', error);
        // Fallback to mock data with role filtering
        let filteredRequests = mockRequests;
        if (user?.role === 'staff') {
          filteredRequests = mockRequests.filter(req => req.created_by === user.id);
        }
        setRequests(filteredRequests);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [user]);

  const getStats = (): Stats => {
    if (!requests) return { pending: 0, approved: 0, rejected: 0 };
    
    return requests.reduce((acc: Stats, req) => {
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
        <Card className="border-gray-200 hover:border-black transition-all duration-300 hover:scale-105 transform hover:shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.pending}</div>
            <p className="text-xs text-gray-600">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:border-black transition-all duration-300 hover:scale-105 transform hover:shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.approved}</div>
            <p className="text-xs text-gray-600">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:border-black transition-all duration-300 hover:scale-105 transform hover:shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.rejected}</div>
            <p className="text-xs text-gray-600">
              Declined requests
            </p>
          </CardContent>
        </Card>
      </div>

      <RequestList requests={requests} loading={isLoading} />
    </div>
  );
}