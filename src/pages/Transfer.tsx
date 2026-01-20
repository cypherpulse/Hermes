import { useStacksWallet } from "@/hooks/useStacksWallet";
import { ConnectWalletButton } from "@/components/bridge/ConnectWalletButton";
import { TransferForm } from "@/components/bridge/TransferForm";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

const Transfer = () => {
  const {
    stacksAddress,
    isConnected: isStacksConnected,
    usdcxBalance,
    isLoading: isStacksLoading,
    connectWallet: connectStacksWallet,
    disconnectWallet: disconnectStacksWallet,
    transferUsdcx,
    refreshBalance: refreshStacksBalance,
  } = useStacksWallet();

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <img
                  src="https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768901230/download_7_pixwpt.png"
                  alt="Stacks Logo"
                  className="w-8 h-8 rounded-full shadow-lg"
                />
                <h2 className="text-4xl font-bold text-foreground">Transfer</h2>
              </div>
              <p className="text-muted-foreground text-lg">
                Transfer USDCx tokens on Stacks
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Send USDCx to other Stacks addresses
              </p>
            </div>

            {/* Stacks Balance Display */}
            {isStacksConnected && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">USDCx Balance</p>
                    <p className="text-2xl font-bold text-foreground">{parseFloat(usdcxBalance).toFixed(2)} USDCx</p>
                  </div>
                  <button
                    onClick={refreshStacksBalance}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ↻
                  </button>
                </div>
              </div>
            )}

            {/* Transfer Form */}
            <TransferForm
              isConnected={isStacksConnected}
              stacksAddress={stacksAddress}
              usdcxBalance={usdcxBalance}
              onConnect={connectStacksWallet}
              onDisconnect={disconnectStacksWallet}
              onTransfer={transferUsdcx}
              isLoading={isStacksLoading}
            />

            {/* Network Info */}
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Network: <span className="text-foreground">Stacks Testnet</span>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-6 mt-auto">
          <div className="container mx-auto px-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Powered by Circle & Stacks
            </p>
            <div className="flex items-center justify-center">
              <code
                className="bg-secondary px-3 py-2 rounded text-primary cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
                onClick={() => {
                  navigator.clipboard.writeText('SP2F70QJ9J57YSSZE76KC1A3X718ADXSZPG8581EP');
                  alert('Address copied!');
                }}
                title="Click to copy donation address"
              >
                SP2F70QJ9J57YSSZE76KC1A3X718ADXSZPG8581EP
              </code>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Transfer;