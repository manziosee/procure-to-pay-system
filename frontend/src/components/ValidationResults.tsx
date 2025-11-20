import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ValidationResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ValidationResultsProps {
  requestId: number;
  validationResult?: ValidationResult;
}

export function ValidationResults({ requestId, validationResult }: ValidationResultsProps) {
  if (!validationResult) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Receipt Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Validation results will appear here once the receipt is processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getOverallStatus = () => {
    const { itemsMatch, pricesMatch, vendorMatch } = validationResult;
    if (itemsMatch && pricesMatch && vendorMatch) return 'success';
    if (!itemsMatch || !pricesMatch || !vendorMatch) return 'error';
    return 'warning';
  };

  const status = getOverallStatus();

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
          {status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          Receipt Validation Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            {validationResult.itemsMatch ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm">Items</span>
          </div>
          
          <div className="flex items-center gap-2">
            {validationResult.pricesMatch ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm">Prices</span>
          </div>
          
          <div className="flex items-center gap-2">
            {validationResult.vendorMatch ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm">Vendor</span>
          </div>
        </div>

        {validationResult.discrepancies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">Discrepancies Found:</h4>
            <ul className="space-y-1">
              {validationResult.discrepancies.map((discrepancy, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <XCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                  {discrepancy}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2">
          <Badge 
            variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
          >
            {status === 'success' && 'Validation Passed'}
            {status === 'error' && 'Validation Failed'}
            {status === 'warning' && 'Validation Warning'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}