import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Approval } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface ApprovalTimelineProps {
  approvals: Approval[];
  currentStatus: 'pending' | 'approved' | 'rejected';
}

export function ApprovalTimeline({ approvals, currentStatus }: ApprovalTimelineProps) {
  const getStatusIcon = (approval: Approval) => {
    if (approval.approved === true) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (approval.approved === false) {
      return <XCircle className="h-6 w-6 text-destructive" />;
    }
    return <Clock className="h-6 w-6 text-muted-foreground" />;
  };

  const getStatusText = (approval: Approval) => {
    if (approval.approved === true) return 'Approved';
    if (approval.approved === false) return 'Rejected';
    return 'Pending';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Approval Timeline</h3>
      
      {approvals.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
          No approvals yet
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval, index) => (
            <div key={approval.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                {getStatusIcon(approval)}
                {index < approvals.length - 1 && (
                  <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{approval.approver_name}</p>
                    <p className={cn(
                      'text-sm',
                      approval.approved === true && 'text-green-600',
                      approval.approved === false && 'text-destructive',
                      approval.approved === null && 'text-muted-foreground'
                    )}>
                      {getStatusText(approval)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(approval.created_at)}
                  </p>
                </div>
                
                {approval.comments && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">{approval.comments}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}