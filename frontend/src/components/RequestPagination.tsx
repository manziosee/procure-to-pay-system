import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequestPaginationProps {
  page: number;
  count: number;
  pageSize?: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

export function RequestPagination({ page, count, pageSize = 20, hasNext, hasPrevious, onPageChange }: RequestPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  if (count <= pageSize) return null;

  return (
    <div className="flex items-center justify-between pt-3">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages} · {count} total
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrevious} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
