/**
 * MultiChainBridgeForm Component
 * 
 * Main form for multichain bridging operations.
 * Supports two modes:
 * 1. Bridge to Stacks (Source → ETH → Stacks)
 * 2. EVM-to-EVM bridging (Source ↔ Destination)
 */

import { useState, useEffect } from 'react';
import { 
  ArrowDown, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChainSelector, ChainSelectorWithStacks } from './ChainSelector';
import { BridgeProgress } from './BridgeProgress';
import { useMultiChainBridge, type BridgeStep } from '@/hooks/useMultiChainBridge';
import { type CCTPChainId, CCTP_CHAINS } from '@/lib/multichain-bridge-config';
import { cn } from '@/lib/utils';

interface MultiChainBridgeFormProps {
  isWalletConnected: boolean;
  stacksAddress: string | null;
}

export function MultiChainBridgeForm({ 
  isWalletConnected, 
  stacksAddress,
}: MultiChainBridgeFormProps) {
  // State
  const [sourceChain, setSourceChain] = useState<CCTPChainId | null>(null);
  const [destChain, setDestChain] = useState<CCTPChainId | 'Stacks' | null>('Stacks');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  // Hooks
  const {
    isConnected,
    sourceBalance,
    ethBalance,
    isLoadingBalance,
    refreshBalances,
    fetchBalance,
    bridgeToStacks,
    bridgeEvmToEvm,
    bridgeState,
    resetBridgeState,
    currentChain,
    supportedChains,
  } = useMultiChainBridge();

  // Track source balance separately for selected chain
  const [selectedSourceBalance, setSelectedSourceBalance] = useState('0');

  // Refresh balance when source chain changes
  useEffect(() => {
    if (sourceChain && isConnected) {
      fetchBalance(sourceChain).then(setSelectedSourceBalance);
    }
  }, [sourceChain, isConnected, fetchBalance]);

  // Set recipient to connected Stacks address if available
  useEffect(() => {
    if (stacksAddress && !recipientAddress) {
      setRecipientAddress(stacksAddress);
    }
  }, [stacksAddress, recipientAddress]);

  // Validation
  const isToStacks = destChain === 'Stacks';
  const isValidAmount = amount && parseFloat(amount) > 0;
  const hasEnoughBalance = parseFloat(amount || '0') <= parseFloat(selectedSourceBalance);
  const isValidRecipient = !isToStacks || (recipientAddress && recipientAddress.startsWith('S'));
  const canSubmit = 
    isConnected && 
    sourceChain && 
    destChain && 
    isValidAmount && 
    hasEnoughBalance && 
    isValidRecipient &&
    !bridgeState.isLoading;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceChain || !destChain || !amount) return;

    if (isToStacks) {
      await bridgeToStacks(sourceChain, amount, recipientAddress);
    } else {
      await bridgeEvmToEvm(sourceChain, destChain as CCTPChainId, amount);
    }
  };

  // Handle max amount
  const handleMax = () => {
    const maxAmount = parseFloat(selectedSourceBalance);
    if (maxAmount > 0) {
      // Leave a small buffer for potential fees
      setAmount(Math.max(0, maxAmount - 0.01).toFixed(2));
    }
  };

  // Handle swap chains
  const handleSwapChains = () => {
    if (destChain === 'Stacks') return; // Can't swap if destination is Stacks
    
    const newSource = destChain as CCTPChainId;
    const newDest = sourceChain;
    
    setSourceChain(newSource);
    setDestChain(newDest);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Chain Selector */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">From</span>
            {sourceChain && (
              <span className="text-sm text-muted-foreground">
                Balance: {parseFloat(selectedSourceBalance).toFixed(2)} USDC
              </span>
            )}
          </div>
          
          <ChainSelector
            value={sourceChain}
            onChange={(chainId) => {
              setSourceChain(chainId);
              // Reset destination if it matches source
              if (destChain === chainId) {
                setDestChain(null);
              }
            }}
            excludeChains={destChain && destChain !== 'Stacks' ? [destChain as CCTPChainId] : []}
            placeholder="Select source chain"
            supportedChains={supportedChains}
          />

          {/* Amount Input */}
          <div className="mt-4">
            <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-bold flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                step="0.01"
                min="0"
              />
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleMax}
                  className="text-xs h-7"
                >
                  MAX
                </Button>
                <span className="font-semibold text-foreground">USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            type="button"
            onClick={handleSwapChains}
            disabled={destChain === 'Stacks'}
            className={cn(
              "p-2 rounded-xl bg-card border border-border",
              "hover:bg-accent transition-colors",
              destChain === 'Stacks' && "opacity-50 cursor-not-allowed"
            )}
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* Destination Chain Selector */}
        <div className="bg-card border border-border rounded-xl p-4">
          <span className="text-sm text-muted-foreground mb-3 block">To</span>
          
          <ChainSelectorWithStacks
            value={destChain}
            onChange={(chainId) => {
              setDestChain(chainId);
              // Reset source if it matches destination
              if (sourceChain === chainId) {
                setSourceChain(null);
              }
            }}
            excludeChains={sourceChain ? [sourceChain] : []}
            placeholder="Select destination"
            supportedChains={supportedChains}
          />

          {/* Stacks Recipient Address (only for Stacks destination) */}
          {isToStacks && (
            <div className="mt-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                Stacks Recipient Address
              </label>
              <Input
                placeholder="SP... or ST..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="font-mono text-sm"
              />
              {recipientAddress && !recipientAddress.startsWith('S') && (
                <p className="text-xs text-destructive mt-1">
                  Invalid Stacks address format
                </p>
              )}
            </div>
          )}
        </div>

        {/* Route Info */}
        {sourceChain && destChain && (
          <div className="bg-accent/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-2">Bridge Route</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{CCTP_CHAINS[sourceChain]?.displayName}</span>
              {isToStacks && sourceChain !== 'Ethereum_Sepolia' ? (
                <>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ethereum</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-primary">Stacks</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-primary">
                    {isToStacks ? 'Stacks' : CCTP_CHAINS[destChain as CCTPChainId]?.displayName}
                  </span>
                </>
              )}
            </div>
            {isToStacks && sourceChain !== 'Ethereum_Sepolia' && (
              <p className="text-xs text-muted-foreground mt-2">
                Secure two-step transfer via Ethereum routing
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {bridgeState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{bridgeState.error}</AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {!hasEnoughBalance && isValidAmount && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Insufficient USDC balance</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-14 text-lg font-semibold"
        >
          {bridgeState.isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Bridging...
            </>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : !sourceChain ? (
            'Select Source Chain'
          ) : !destChain ? (
            'Select Destination'
          ) : !isValidAmount ? (
            'Enter Amount'
          ) : !hasEnoughBalance ? (
            'Insufficient Balance'
          ) : isToStacks && !isValidRecipient ? (
            'Enter Stacks Address'
          ) : (
            `Bridge to ${isToStacks ? 'Stacks' : CCTP_CHAINS[destChain as CCTPChainId]?.displayName}`
          )}
        </Button>
      </form>

      {/* Bridge Time Estimate */}
      {sourceChain && destChain && isValidAmount && !bridgeState.isLoading && (
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-500">
            {isToStacks ? (
              <>
                <strong>Estimated time:</strong> 15-25 minutes total
                <br />
                • Cross-chain transfer: 6-12 minutes
                <br />
                • Final settlement: 5-10 minutes
              </>
            ) : (
              <>
                <strong>Estimated time:</strong> 6-12 minutes
                <br />
                Transfers require security confirmation from Circle
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Bridge Progress */}
      {bridgeState.steps.length > 0 && (
        <BridgeProgress 
          steps={bridgeState.steps} 
          isCompleted={bridgeState.isCompleted}
          onReset={resetBridgeState}
        />
      )}
    </div>
  );
}
