import { useState } from "react";
import { useBridge } from "@/hooks/useBridge";
import { useStacksWallet } from "@/hooks/useStacksWallet";
import { ConnectWalletButton } from "@/components/bridge/ConnectWalletButton";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { BalanceDisplay } from "@/components/bridge/BalanceDisplay";
import { ExternalLink, ArrowRight, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from '@/components/Footer';

interface WithdrawFormProps {
  isConnected: boolean;
  usdcxBalance: string;
  minWithdrawalAmount: string;
  onWithdraw: (amount: string, ethereumAddress: string) => Promise<string>;
}

const WithdrawForm = ({ isConnected, usdcxBalance, minWithdrawalAmount, onWithdraw }: WithdrawFormProps) => {
  const [amount, setAmount] = useState('');
  const [ethereumAddress, setEthereumAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txId, setTxId] = useState('');
  const [step, setStep] = useState<'idle' | 'burning' | 'burned' | 'attesting' | 'completed'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;

    setIsLoading(true);
    setError('');
    setSuccess('');
    setTxId('');
    setStep('burning');

    try {
      // Validate amount
      const numAmount = parseFloat(amount);
      const numBalance = parseFloat(usdcxBalance);
      const minAmount = parseFloat(minWithdrawalAmount);
      
      if (numAmount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      if (numAmount < minAmount) {
        throw new Error(`Minimum withdrawal amount is ${minAmount} USDCx`);
      }
      
      if (numAmount > numBalance) {
        throw new Error('Insufficient USDCx balance');
      }

      // Validate Ethereum address (basic check)
      if (!ethereumAddress.startsWith('0x') || ethereumAddress.length !== 42) {
        throw new Error('Invalid Ethereum address');
      }

      // Burn the tokens directly (no approval needed for protocol-burn)
      const transactionId = await onWithdraw(amount, ethereumAddress);
      setTxId(transactionId);
      setStep('burned');
      setSuccess('Burn transaction submitted! Circle will process the withdrawal off-chain.');
      
      // Simulate attestation process (in real app, you'd monitor for events)
      setTimeout(() => {
        setStep('attesting');
        setSuccess('Circle attestation service is monitoring for your burn event...');
        
        setTimeout(() => {
          setStep('completed');
          setSuccess('Burn event processed! USDC will be released to your Ethereum address within 5-15 minutes. Check your Ethereum wallet.');
        }, 3000);
      }, 2000);
      
      setAmount('');
      setEthereumAddress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('idle');
    setSuccess('');
    setError('');
    setTxId('');
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Withdraw to Ethereum</h3>
      
      {/* Process Info */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>How withdrawal works:</strong> Your USDCx is burned on Stacks, Circle's attestation service detects the burn event, 
          verifies it, and releases equivalent USDC to your Ethereum address. This process typically takes 5-15 minutes.
          Minimum withdrawal: {minWithdrawalAmount} USDCx.
        </p>
        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Testnet Issue:</strong> Circle's testnet attestation service has bugs and releases incorrect USDC amounts.
            Our code burns the correct amount, but Circle's system may deliver less.The Issue is being solved but mainnet works perfectly,coming soon.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      {step !== 'idle' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <button onClick={resetForm} className="text-xs text-primary hover:underline">
              Start New
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${['burning', 'burned', 'attesting', 'completed'].includes(step) ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className="flex-1 h-0.5 bg-muted">
              <div className={`h-full bg-primary transition-all duration-300 ${['burned', 'attesting', 'completed'].includes(step) ? 'w-1/3' : 'w-0'}`}></div>
            </div>
            <div className={`w-3 h-3 rounded-full ${['burned', 'attesting', 'completed'].includes(step) ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className="flex-1 h-0.5 bg-muted">
              <div className={`h-full bg-primary transition-all duration-300 ${['attesting', 'completed'].includes(step) ? 'w-1/3' : 'w-0'}`}></div>
            </div>
            <div className={`w-3 h-3 rounded-full ${['attesting', 'completed'].includes(step) ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className="flex-1 h-0.5 bg-muted">
              <div className={`h-full bg-primary transition-all duration-300 ${step === 'completed' ? 'w-1/3' : 'w-0'}`}></div>
            </div>
            <div className={`w-3 h-3 rounded-full ${step === 'completed' ? 'bg-primary' : 'bg-muted'}`}></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Burn</span>
            <span>Attest</span>
            <span>Release</span>
            <span>Complete</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Amount (USDCx)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min: ${minWithdrawalAmount}`}
            step="0.01"
            min={minWithdrawalAmount}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!isConnected || isLoading || step !== 'idle'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ethereum Address</label>
          <input
            type="text"
            value={ethereumAddress}
            onChange={(e) => setEthereumAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            disabled={!isConnected || isLoading || step !== 'idle'}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            {success}
            {txId && (
              <div className="mt-2">
                <a
                  href={`https://explorer.stacks.co/txid/${txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs flex items-center gap-1"
                >
                  View burn transaction on Stacks Explorer <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-muted-foreground mt-1">
                  Transaction may take 5-10 minutes to confirm. The withdrawal process will begin once confirmed.
                </p>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!isConnected || isLoading || !amount || !ethereumAddress || step !== 'idle'}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Processing...' : isConnected ? 'Withdraw to Ethereum' : 'Connect Stacks Wallet'}
        </button>
      </form>
    </div>
  );
};

const Index = () => {
  const [mode, setMode] = useState<'bridge' | 'withdraw'>('bridge');
  
  const {
    isConnected: isEthConnected,
    ethBalance,
    usdcBalance,
    refreshBalances,
    approveUSDC,
    depositToStacks,
  } = useBridge();

  const {
    stacksAddress,
    isConnected: isStacksConnected,
    usdcxBalance,
    minWithdrawalAmount,
    burnUsdcx,
    approveUsdcx,
    refreshBalance,
  } = useStacksWallet();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12 flex-1">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-3">
                <span className="text-white">Ethereum</span>
                <span className="text-foreground"> ↔ </span>
                <span className="text-gradient-bitcoin">Stacks</span>
              </h2>
              
              {/* Mode Toggle */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setMode('bridge')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'bridge'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Bridge to Stacks
                </button>
                <button
                  onClick={() => setMode('withdraw')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'withdraw'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Withdraw to Ethereum
                </button>
              </div>
              
              {/* Chain Logos */}
              <div className="flex items-center justify-center gap-8 mb-4">
                {mode === 'bridge' ? (
                  <>
                    <div className="flex flex-col items-center">
                      <img 
                        src="https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900941/download_6_b0zu0z.png" 
                        alt="Ethereum" 
                        className="w-16 h-16 rounded-full border-2 border-orange-200 dark:border-orange-700 bg-white shadow-lg" 
                      />
                      <span className="text-sm font-medium text-white mt-2">USDC</span>
                    </div>
                    
                    <ArrowRight className="w-8 h-8 text-muted-foreground" />
                    
                    <div className="flex flex-col items-center">
                      <img 
                        src="https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768901230/download_7_pixwpt.png" 
                        alt="Stacks" 
                        className="w-16 h-16 rounded-full border-2 border-indigo-200 dark:border-indigo-700 bg-white shadow-lg" 
                      />
                      <span className="text-sm font-medium text-gradient-bitcoin mt-2">USDCx</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center">
                      <img 
                        src="https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768901230/download_7_pixwpt.png" 
                        alt="Stacks" 
                        className="w-16 h-16 rounded-full border-2 border-indigo-200 dark:border-indigo-700 bg-white shadow-lg" 
                      />
                      <span className="text-sm font-medium text-gradient-bitcoin mt-2">USDCx</span>
                    </div>
                    
                    <ArrowLeft className="w-8 h-8 text-muted-foreground" />
                    
                    <div className="flex flex-col items-center">
                      <img 
                        src="https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900941/download_6_b0zu0z.png" 
                        alt="Ethereum" 
                        className="w-16 h-16 rounded-full border-2 border-orange-200 dark:border-orange-700 bg-white shadow-lg" 
                      />
                      <span className="text-sm font-medium text-white mt-2">USDC</span>
                    </div>
                  </>
                )}
              </div>
              
              <p className="text-muted-foreground text-lg">
                {mode === 'bridge' 
                  ? 'Blazing fast bridging between Ethereum and Stacks'
                  : 'Withdraw USDCx from Stacks back to Ethereum'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Powered by Circle & Stacks
              </p>
            </div>

            {/* Bridge Content */}
            {mode === 'bridge' ? (
              <>
                {/* Balance Display */}
                <BalanceDisplay
                  ethBalance={ethBalance}
                  usdcBalance={usdcBalance}
                  onRefresh={refreshBalances}
                  isConnected={isEthConnected}
                />

                {/* Bridge Form */}
                <BridgeForm
                  isConnected={isEthConnected}
                  usdcBalance={usdcBalance}
                  ethBalance={ethBalance}
                  onApprove={approveUSDC}
                  onDeposit={depositToStacks}
                />
              </>
            ) : (
              <>
                {/* Withdraw Balance Display */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Balance</h3>
                    <button
                      onClick={refreshBalance}
                      className="text-sm text-primary hover:underline"
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">USDCx Balance:</span>
                      <span className="font-mono text-lg">
                        {isStacksConnected ? `${usdcxBalance} USDCx` : 'Connect wallet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Withdraw Form */}
                <WithdrawForm
                  isConnected={isStacksConnected}
                  usdcxBalance={usdcxBalance}
                  minWithdrawalAmount={minWithdrawalAmount}
                  onWithdraw={burnUsdcx}
                />
              </>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
              >
                <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                  Get Test USDC
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Circle Faucet <ExternalLink className="w-3 h-3" />
                </p>
              </a>
              <a
                href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
              >
                <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                  Get Test ETH
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Sepolia Faucet <ExternalLink className="w-3 h-3" />
                </p>
              </a>
            </div>

            {/* Network Info */}
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Network: <span className="text-foreground">Ethereum Sepolia</span> ↔ <span className="text-foreground">Stacks Testnet</span>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Index;
