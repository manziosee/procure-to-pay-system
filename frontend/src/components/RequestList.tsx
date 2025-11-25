import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { PurchaseRequest } from '@/types';
import { formatDate, formatStatus } from '@/utils/formatters';
import { formatCurrency } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RequestListProps {
  requests?: PurchaseRequest[];
  loading: boolean;
}

export default function RequestList({ requests, loading }: RequestListProps) {
  if (loading) {
    return (
      <Card className="p-8 border-gray-200">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="p-8 border-gray-200">
        <p className="text-center text-gray-600">No requests found</p>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300',
      approved: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-300',
      rejected: 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-800 border border-rose-300',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  return (
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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                  {formatStatus(request.status)}
                </span>
              </TableCell>
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
  );
}