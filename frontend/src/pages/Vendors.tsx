import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { vendors as vendorsAPI } from '@/services/api';
import type { Vendor } from '@/types';

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    vendorsAPI.getAll()
      .then((response) => setVendors(response.data.results || response.data || []))
      .catch((error) => console.error('Error loading vendors:', error))
      .finally(() => setIsLoading(false));
  }, []);

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
        <div>
          <h1 className="font-display text-2xl font-bold text-black mb-1">Vendors</h1>
          <p className="text-sm text-gray-600 font-medium">
            Vendors extracted from processed proforma invoices
          </p>
        </div>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              All Vendors ({vendors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No vendors yet — vendors appear here once a proforma invoice is processed.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Total Spend</TableHead>
                    <TableHead>Most Recent Request</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium text-black">{vendor.name}</TableCell>
                      <TableCell className="text-black">{vendor.request_count}</TableCell>
                      <TableCell className="text-black font-semibold">
                        {vendor.total_spend ? formatCurrency(vendor.total_spend) : '—'}
                      </TableCell>
                      <TableCell>{vendor.last_request_at ? formatDate(vendor.last_request_at) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
