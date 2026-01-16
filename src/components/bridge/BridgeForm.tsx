import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, Loader2, ExternalLink, AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { isValidStacksAddress } from "@/lib/stacks-address";
import { toast } from "sonner";
import { useBridgeStatus, type BridgeStatus } from "@/hooks/useBridgeStatus";

interface BridgeFormProps {
  isConnected: boolean;
  usdcBalance: string;
  ethBalance: string;
  onApprove: (amount: string) => Promise<string | null>;
  onDeposit: (amount: string, recipient: string) => Promise<string | null>;
}

type BridgeStep = 'input' | 'approving' | 'approved' | 'depositing' | 'monitoring' | 'complete';

export function BridgeForm({
  isConnected,
  usdcBalance,
  ethBalance,
  onApprove,
  onDeposit,
}: BridgeFormProps) {
  const [amount, setAmount] = useState("");
  const [stacksAddress, setStacksAddress] = useState("");
  const [step, setStep] = useState<BridgeStep>('input');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bridgeStatus = useBridgeStatus();

  // Watch for bridge completion
  useEffect(() => {
    if (bridgeStatus.status === 'completed') {
      setStep('complete');
      toast.success("🎉 USDCx minted successfully!");
    }
  }, [bridgeStatus.status]);

  const parsedAmount = parseFloat(amount) || 0;
  const balance = parseFloat(usdcBalance) || 0;
  const hasEnoughBalance = parsedAmount > 0 && parsedAmount <= balance;
  const isValidAddress = stacksAddress ? isValidStacksAddress(stacksAddress) : false;
  const canProceed = hasEnoughBalance && isValidAddress && parseFloat(ethBalance) > 0;

  const handleApprove = async () => {
    if (!canProceed) return;
    
    setError(null);
    setStep('approving');
    
    try {
      const hash = await onApprove(amount);
      if (hash) {
        setStep('approved');
        toast.success("USDC approved successfully!");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to approve USDC");
      setStep('input');
      toast.error("Approval failed");
    }
  };

  const handleDeposit = async () => {
    if (!canProceed) return;
    
    setError(null);
    setStep('depositing');
    
    try {
      const hash = await onDeposit(amount, stacksAddress);
      if (hash) {
        setTxHash(hash);
        setStep('monitoring');
        // Start monitoring for USDCx mint
        bridgeStatus.startMonitoring(hash, stacksAddress, amount);
        toast.success("Bridge transaction submitted! Monitoring for completion...");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to deposit");
      setStep('approved');
      toast.error("Deposit failed");
    }
  };

  const handleReset = () => {
    setAmount("");
    setStacksAddress("");
    setStep('input');
    setTxHash(null);
    setError(null);
    bridgeStatus.reset();
  };

  const handleMaxAmount = () => {
    setAmount(usdcBalance);
  };

  if (!isConnected) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Connect your Ethereum wallet to start bridging
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'monitoring' && txHash) {
    const getStatusInfo = (status: BridgeStatus) => {
      switch (status) {
        case 'eth_confirmed':
          return { 
            label: 'Ethereum Confirmed', 
            description: 'Waiting for attestation service to detect deposit...',
            progress: 25,
            color: 'text-blue-500'
          };
        case 'attesting':
          return { 
            label: 'Attestation in Progress', 
            description: 'Circle attestation service is processing...',
            progress: 50,
            color: 'text-yellow-500'
          };
        case 'minting':
          return { 
            label: 'Minting USDCx', 
            description: 'Stacks transaction detected, minting in progress...',
            progress: 75,
            color: 'text-green-500'
          };
        case 'completed':
          return { 
            label: 'Completed!', 
            description: 'USDCx has been minted to your wallet!',
            progress: 100,
            color: 'text-green-500'
          };
        default:
          return { 
            label: 'Processing', 
            description: 'Bridge in progress...',
            progress: 10,
            color: 'text-muted-foreground'
          };
      }
    };

    const statusInfo = getStatusInfo(bridgeStatus.status);

    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center relative">
              {bridgeStatus.status === 'completed' ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    <Clock className="w-3 h-3" />
                  </div>
                </>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {bridgeStatus.status === 'completed' ? '🎉 Bridge Complete!' : 'Bridging in Progress...'}
            </h3>
            
            <p className="text-muted-foreground mb-4">
              {amount} USDC → {amount} USDCx
            </p>

            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${statusInfo.progress}%` }}
              />
            </div>

            {/* Status */}
            <div className={`text-sm font-medium ${statusInfo.color} mb-2`}>
              {statusInfo.label}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {statusInfo.description}
            </p>

            {/* Timer */}
            <div className="bg-secondary rounded-xl p-3 mb-4 inline-block">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-foreground">
                  {bridgeStatus.formatElapsedTime(bridgeStatus.elapsedTime)}
                </span>
                <span className="text-muted-foreground">elapsed</span>
              </div>
            </div>

            {/* Transaction Links */}
            <div className="space-y-3 mb-6">
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Ethereum Transaction</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-primary hover:underline flex items-center justify-center gap-2"
                >
                  {txHash.slice(0, 12)}...{txHash.slice(-6)}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {bridgeStatus.stacksTxHash && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <p className="text-sm text-green-500 mb-2">🎉 Stacks Mint Transaction</p>
                  <a
                    href={`https://explorer.hiro.so/txid/${bridgeStatus.stacksTxHash}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-green-500 hover:underline flex items-center justify-center gap-2"
                  >
                    {bridgeStatus.stacksTxHash.slice(0, 12)}...{bridgeStatus.stacksTxHash.slice(-6)}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <a
                href={`https://explorer.hiro.so/address/${stacksAddress}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
              >
                View Stacks Wallet
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {bridgeStatus.status === 'completed' && (
              <Button onClick={handleReset} className="gradient-bitcoin text-primary-foreground font-semibold px-8">
                Bridge More
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete' && txHash) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-bitcoin flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Bridge Initiated!</h3>
            <p className="text-muted-foreground mb-4">
              Your {amount} USDC has been deposited to xReserve. 
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
              <p className="text-yellow-500 font-medium text-sm mb-2">⏳ Waiting for Stacks Attestation</p>
              <p className="text-yellow-500/80 text-xs">
                The Stacks attestation service will detect your deposit and mint USDCx to your address. 
                This can take <strong>5-30 minutes</strong> on testnet.
              </p>
            </div>
            <div className="bg-secondary rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">Ethereum Transaction</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-primary hover:underline flex items-center justify-center gap-2"
              >
                {txHash.slice(0, 16)}...{txHash.slice(-8)}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-secondary rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-2">Check Stacks Wallet</p>
              <a
                href={`https://explorer.hiro.so/address/${stacksAddress}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-primary hover:underline flex items-center justify-center gap-2"
              >
                View on Stacks Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                USDCx Contract: <a 
                  href="https://explorer.hiro.so/txid/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx?chain=testnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ST1PQH...usdcx
                </a>
              </p>
            </div>
            <Button onClick={handleReset} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Bridge More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Bridge USDC → USDCx</CardTitle>
        <CardDescription>
          Transfer USDC from Ethereum Sepolia to Stacks Testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* From Section */}
        <div className="bg-secondary rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">From: Ethereum Sepolia</Label>
            <span className="text-sm text-muted-foreground">
              Balance: <span className="text-foreground font-medium">{parseFloat(usdcBalance).toFixed(2)} USDC</span>
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 px-0"
              disabled={step !== 'input' && step !== 'approved'}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaxAmount}
              className="text-primary hover:text-primary hover:bg-primary/10"
              disabled={step !== 'input' && step !== 'approved'}
            >
              MAX
            </Button>
          </div>
          {parsedAmount > balance && (
            <p className="text-destructive text-sm">Insufficient balance</p>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center">
            <ArrowDown className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* To Section */}
        <div className="bg-secondary rounded-xl p-4 space-y-3">
          <Label className="text-muted-foreground">To: Stacks Testnet</Label>
          <Input
            type="text"
            placeholder="ST... (Stacks testnet address)"
            value={stacksAddress}
            onChange={(e) => setStacksAddress(e.target.value)}
            className="font-mono text-sm"
            disabled={step !== 'input'}
          />
          {stacksAddress && !isValidAddress && (
            <p className="text-destructive text-sm">Invalid Stacks address (must start with ST for testnet)</p>
          )}
          {isValidAddress && (
            <p className="text-green-500 text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Valid Stacks address
            </p>
          )}
        </div>

        {/* ETH Balance Warning */}
        {parseFloat(ethBalance) === 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-destructive font-medium">Insufficient ETH for gas</p>
              <p className="text-destructive/80 text-sm">
                You need ETH to pay for transaction fees.{" "}
                <a
                  href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Get testnet ETH
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {step === 'input' && (
            <Button
              onClick={handleApprove}
              disabled={!canProceed}
              className="w-full gradient-bitcoin text-primary-foreground font-semibold py-6 text-lg rounded-xl glow-orange hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Approve USDC
            </Button>
          )}

          {step === 'approving' && (
            <Button
              disabled
              className="w-full bg-secondary text-foreground font-semibold py-6 text-lg rounded-xl"
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Approving USDC...
            </Button>
          )}

          {step === 'approved' && (
            <Button
              onClick={handleDeposit}
              className="w-full gradient-bitcoin text-primary-foreground font-semibold py-6 text-lg rounded-xl glow-orange hover:opacity-90 transition-opacity"
            >
              Bridge to Stacks
            </Button>
          )}

          {step === 'depositing' && (
            <Button
              disabled
              className="w-full bg-secondary text-foreground font-semibold py-6 text-lg rounded-xl"
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Bridging to Stacks...
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by Circle's xReserve Protocol</p>
        </div>
      </CardContent>
    </Card>
  );
}
