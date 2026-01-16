import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertCircle, CheckCircle2, Send, Wallet } from "lucide-react";
import { isValidStacksAddress } from "@/lib/stacks-address";
import { toast } from "sonner";

interface TransferFormProps {
  isConnected: boolean;
  stacksAddress: string | null;
  usdcxBalance: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onTransfer: (recipient: string, amount: string, memo?: string) => Promise<string | null>;
  isLoading: boolean;
}

type TransferStep = 'input' | 'transferring' | 'complete';

export function TransferForm({
  isConnected,
  stacksAddress,
  usdcxBalance,
  onConnect,
  onDisconnect,
  onTransfer,
  isLoading,
}: TransferFormProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<TransferStep>('input');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = parseFloat(amount) || 0;
  const balance = parseFloat(usdcxBalance) || 0;
  const hasEnoughBalance = parsedAmount > 0 && parsedAmount <= balance;
  const isValidRecipient = recipient ? isValidStacksAddress(recipient) : false;
  const canTransfer = hasEnoughBalance && isValidRecipient && !isLoading;

  const handleTransfer = async () => {
    if (!canTransfer) return;
    
    setError(null);
    setStep('transferring');
    
    try {
      const hash = await onTransfer(recipient, amount, memo || undefined);
      if (hash) {
        setTxHash(hash);
        setStep('complete');
        toast.success("Transfer submitted successfully!");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to transfer USDCx");
      setStep('input');
      toast.error("Transfer failed");
    }
  };

  const handleReset = () => {
    setAmount("");
    setRecipient("");
    setMemo("");
    setStep('input');
    setTxHash(null);
    setError(null);
  };

  const handleMaxAmount = () => {
    setAmount(usdcxBalance);
  };

  if (!isConnected) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Transfer USDCx</CardTitle>
          <CardDescription>
            Send USDCx to another Stacks address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg mb-6">
              Connect your Stacks wallet to transfer USDCx
            </p>
            <Button 
              onClick={onConnect}
              className="gradient-bitcoin text-primary-foreground font-semibold px-8 py-3 rounded-xl"
            >
              Connect Stacks Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete' && txHash) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Transfer USDCx</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-bitcoin flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Transfer Submitted!</h3>
            <p className="text-muted-foreground mb-4">
              Your {amount} USDCx transfer has been submitted to the Stacks network.
            </p>
            <div className="bg-secondary rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-2">Transaction ID</p>
              <a
                href={`https://explorer.hiro.so/txid/${txHash}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-primary hover:underline flex items-center justify-center gap-2"
              >
                {txHash.slice(0, 16)}...{txHash.slice(-8)}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <Button onClick={handleReset} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Send More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Transfer USDCx</CardTitle>
        <CardDescription>
          Send USDCx to another Stacks address on testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Wallet Info */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-green-500 font-medium">Connected</p>
              <p className="text-xs text-muted-foreground font-mono">
                {stacksAddress?.slice(0, 8)}...{stacksAddress?.slice(-6)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            className="text-muted-foreground hover:text-foreground"
          >
            Disconnect
          </Button>
        </div>

        {/* Amount Section */}
        <div className="bg-secondary rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Amount</Label>
            <span className="text-sm text-muted-foreground">
              Balance: <span className="text-foreground font-medium">{parseFloat(usdcxBalance).toFixed(2)} USDCx</span>
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 px-0"
              disabled={step !== 'input'}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaxAmount}
              className="text-primary hover:text-primary hover:bg-primary/10"
              disabled={step !== 'input'}
            >
              MAX
            </Button>
          </div>
          {parsedAmount > balance && (
            <p className="text-destructive text-sm">Insufficient balance</p>
          )}
        </div>

        {/* Recipient Section */}
        <div className="bg-secondary rounded-xl p-4 space-y-3">
          <Label className="text-muted-foreground">Recipient Address</Label>
          <Input
            type="text"
            placeholder="ST... (Stacks testnet address)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="font-mono text-sm"
            disabled={step !== 'input'}
          />
          {recipient && !isValidRecipient && (
            <p className="text-destructive text-sm">Invalid Stacks address (must start with ST for testnet)</p>
          )}
          {isValidRecipient && (
            <p className="text-green-500 text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Valid Stacks address
            </p>
          )}
        </div>

        {/* Optional Memo */}
        <div className="bg-secondary rounded-xl p-4 space-y-3">
          <Label className="text-muted-foreground">Memo (Optional)</Label>
          <Input
            type="text"
            placeholder="Add a note to your transfer"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="text-sm"
            disabled={step !== 'input'}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-3">
          {step === 'input' && (
            <Button
              onClick={handleTransfer}
              disabled={!canTransfer}
              className="w-full gradient-bitcoin text-primary-foreground font-semibold py-6 text-lg rounded-xl glow-orange hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-5 h-5 mr-2" />
              Send USDCx
            </Button>
          )}

          {step === 'transferring' && (
            <Button
              disabled
              className="w-full bg-secondary text-foreground font-semibold py-6 text-lg rounded-xl"
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Confirm in Wallet...
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>USDCx Token on Stacks Testnet</p>
        </div>
      </CardContent>
    </Card>
  );
}
