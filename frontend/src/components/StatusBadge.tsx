import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    approved: 'bg-green-100 text-green-800 border border-green-300',
    rejected: 'bg-red-100 text-red-800 border border-red-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};