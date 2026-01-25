import { useState } from 'react';
import { ArrowRight, Loader2, Wallet, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { toast } from 'sonner';

const SolanaPage = () => {
  const [amount, setAmount] = useState('');
  const [stacksRecipient, setStacksRecipient] = useState('');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStep, setBridgeStep] = useState<'input' | 'bridging' | 'complete'>('input');
  
  const { publicKey, connected } = useWallet();
  const { bridgeToStacks, fetchUsdcBalance, usdcBalance, solanaAddress, solBalance, fetchSolBalance } = useSolanaWallet();

  const handleBridge = async () => {
    if (!amount || !stacksRecipient) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!solanaAddress) {
      toast.error('Solana wallet must be connected');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsBridging(true);
    setBridgeStep('bridging');
    try {
      console.log('Starting Solana to Stacks bridge...');
      const success = await bridgeToStacks(amount, stacksRecipient);
      if (success) {
        setBridgeStep('complete');
        toast.success('Bridge completed successfully!');
        setAmount('');
        setStacksRecipient('');
        setTimeout(() => setBridgeStep('input'), 3000);
      } else {
        throw new Error('Bridge failed');
      }
    } catch (error) {
      console.error('Bridge failed:', error);
      toast.error('Bridge failed: ' + (error as Error).message);
      setBridgeStep('input');
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <main className="container mx-auto px-4 py-12 flex-1">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">
                <span className="text-purple-600">Solana</span>
                <span className="text-foreground"> ↔ Stacks</span>
              </h2>
              
              {/* Chain Logos */}
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="flex flex-col items-center">
                  <img 
                    src="https://res.cloudinary.com/dg5rr4ntw/image/upload/v1769232348/solana-sol-logo-png_seeklogo-423095_slbgbb.png" 
                    alt="Solana" 
                    className="w-16 h-16 rounded-full border-2 border-purple-200 dark:border-purple-700 bg-white shadow-lg" 
                  />
                  <span className="text-sm font-medium text-purple-600 mt-2">USDC</span>
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
              </div>
              
              <p className="text-muted-foreground text-lg">
                Bridge USDC from Solana to Stacks
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Secure cross-chain USDC transfers
              </p>
            </div>

            {/* Wallet Connection */}
            {!connected && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <WalletMultiButton />
                    <p className="text-sm text-muted-foreground mt-2">
                      Connect your Solana wallet to get started
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connected Wallet Info */}
            {solanaAddress && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-3">
                        Solana Devnet Wallet
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 font-mono bg-green-100 dark:bg-green-800/50 rounded px-2 py-1 mb-3">
                        {solanaAddress.slice(0, 12)}...{solanaAddress.slice(-12)}
                      </p>
                      
                      {/* Balance Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-green-800/30 rounded-lg p-3 border border-green-300 dark:border-green-600">
                          <div className="flex items-center justify-center mb-1">
                            <img 
                              src="https://cryptologos.cc/logos/solana-sol-logo.png" 
                              alt="SOL" 
                              className="w-5 h-5 rounded-full mr-1" 
                            />
                            <span className="text-xs font-medium text-green-800 dark:text-green-200">SOL</span>
                          </div>
                          <p className="text-lg font-bold text-green-900 dark:text-green-100">
                            {solBalance !== null ? `${solBalance.toFixed(4)}` : 'Loading...'}
                          </p>
                        </div>
                        
                        <div className="bg-white dark:bg-green-800/30 rounded-lg p-3 border border-green-300 dark:border-green-600">
                          <div className="flex items-center justify-center mb-1">
                            <img 
                              src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" 
                              alt="USDC" 
                              className="w-5 h-5 rounded-full mr-1" 
                            />
                            <span className="text-xs font-medium text-green-800 dark:text-green-200">USDC</span>
                          </div>
                          <p className="text-lg font-bold text-green-900 dark:text-green-100">
                            {usdcBalance !== null ? `${usdcBalance.toFixed(2)}` : 'Loading...'}
                          </p>
                        </div>
                      </div>
                      
                      <Button onClick={() => { fetchUsdcBalance(); fetchSolBalance(); }} variant="outline" size="sm" className="mt-3">
                        Refresh Balances
                      </Button>
                    </div>
                    
                    {!window.ethereum && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-4">
                        ⚠️ Additional wallet connection required for bridging
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bridge Form */}
            {solanaAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <img
                      src="https://cryptologos.cc/logos/solana-sol-logo.png"
                      alt="Solana"
                      className="w-8 h-8 rounded-full"
                    />
                    Solana to Stacks Bridge
                  </CardTitle>
                  <CardDescription>
                    Transfer USDC from Solana to Stacks securely
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (USDC)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  {/* Stacks Recipient */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stacks Recipient Address</label>
                    <Input
                      placeholder="SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7"
                      value={stacksRecipient}
                      onChange={(e) => setStacksRecipient(e.target.value)}
                    />
                  </div>

                  {/* Bridge Progress */}
                  {bridgeStep === 'bridging' && (
                    <div className="text-center py-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                      <p className="text-sm text-muted-foreground">Bridging in progress...</p>
                      <p className="text-xs text-muted-foreground mt-1">Transferring USDC from Solana to Stacks</p>
                    </div>
                  )}

                  {bridgeStep === 'complete' && (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-green-600 font-medium">Bridge completed successfully!</p>
                      <p className="text-xs text-muted-foreground mt-1">USDCx should arrive in your Stacks wallet soon</p>
                    </div>
                  )}

                  {/* Bridge Button */}
                  {bridgeStep === 'input' && (
                    <Button onClick={handleBridge} className="w-full" size="lg" disabled={isBridging || !solanaAddress || !window.ethereum}>
                      {isBridging ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Bridging...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Bridge to Stacks
                        </>
                      )}
                    </Button>
                  )}

                  {/* Info */}
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Connect your Solana wallet first</p>
                    <p>• Ensure you have USDC on Solana</p>
                    <p>• Enter the amount and Stacks recipient address</p>
                    <p>• The bridge may take 5-30 minutes to complete</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 gap-4 mt-8">
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
              >
                <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                  Get Test USDC on Solana
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Circle Faucet <ExternalLink className="w-3 h-3" />
                </p>
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

const Solana = () => <SolanaPage />;

export default Solana;