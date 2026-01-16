import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BalanceDisplayProps {
  ethBalance: string;
  usdcBalance: string;
  onRefresh: () => void;
  isConnected: boolean;
}

export function BalanceDisplay({
  ethBalance,
  usdcBalance,
  onRefresh,
  isConnected,
}: BalanceDisplayProps) {
  if (!isConnected) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">Your Balances</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">ETH (Sepolia)</p>
          <p className="text-lg font-bold text-foreground">
            {ethBalance && !isNaN(parseFloat(ethBalance)) ? parseFloat(ethBalance).toFixed(4) : '0.0000'}
          </p>
        </div>
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">USDC (Sepolia)</p>
          <p className="text-lg font-bold text-foreground">
            {usdcBalance && !isNaN(parseFloat(usdcBalance)) ? parseFloat(usdcBalance).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>
    </div>
  );
}
