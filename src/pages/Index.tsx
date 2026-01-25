import { useBridge } from "@/hooks/useBridge";
import { ConnectWalletButton } from "@/components/bridge/ConnectWalletButton";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { BalanceDisplay } from "@/components/bridge/BalanceDisplay";
import { ExternalLink, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from '@/components/Footer';

const Index = () => {
  const {
    isConnected: isEthConnected,
    ethBalance,
    usdcBalance,
    refreshBalances,
    approveUSDC,
    depositToStacks,
  } = useBridge();

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
              
              {/* Chain Logos */}
              <div className="flex items-center justify-center gap-8 mb-4">
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
              </div>
              
              <p className="text-muted-foreground text-lg">
                Blazing fast bridging between Ethereum and Stacks
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Powered by Circle & Stacks
              </p>
            </div>

            {/* Bridge Content */}
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
