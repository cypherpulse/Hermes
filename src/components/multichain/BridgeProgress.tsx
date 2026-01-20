import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BridgeStep } from '@/hooks/useMultiChainBridge';
import { cn } from '@/lib/utils';

interface BridgeProgressProps {
  steps: BridgeStep[];
  isCompleted: boolean;
  onReset: () => void;
}

export function BridgeProgress({
  steps,
  isCompleted,
  onReset,
}: BridgeProgressProps) {
  const hasFailedSteps = steps.some(step => step.status === 'failed');
  const isActuallyCompleted = isCompleted && !hasFailedSteps;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Bridge Progress</h3>
        {(isActuallyCompleted || hasFailedSteps) && (
          <Button variant="outline" size="sm" onClick={onReset}>
            New Bridge
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg",
              step.status === 'in-progress' && "bg-primary/10",
              step.status === 'completed' && "bg-green-500/10",
              step.status === 'failed' && "bg-destructive/10",
            )}
          >
            {/* Status Icon */}
            <div className="mt-0.5">
              {step.status === 'pending' && (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
              )}
              {step.status === 'in-progress' && (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              )}
              {step.status === 'completed' && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {step.status === 'failed' && (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
            </div>

            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{step.name}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>

              {step.error && (
                <p className="text-sm text-destructive mt-1">{step.error}</p>
              )}

              {step.txHash && step.explorerUrl && (
                <a
                  href={step.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                >
                  View Transaction
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Step Number */}
            <span className="text-sm text-muted-foreground">
              {index + 1}/{steps.length}
            </span>
          </div>
        ))}
      </div>

      {isActuallyCompleted && (
        <Alert className="bg-green-500/10 border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">
            Bridge completed successfully! Your USDC should arrive shortly.
          </AlertDescription>
        </Alert>
      )}

      {hasFailedSteps && (
        <Alert className="bg-destructive/10 border-destructive/20">
          <XCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Bridge failed. Please check the error messages above and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}