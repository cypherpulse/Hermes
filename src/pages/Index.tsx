import { useBridge } from "@/hooks/useBridge";
import { ConnectWalletButton } from "@/components/bridge/ConnectWalletButton";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { BalanceDisplay } from "@/components/bridge/BalanceDisplay";
import { ExternalLink, ArrowDownUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Index = () => {
  const location = useLocation();
  const {
    isConnected: isEthConnected,
    ethBalance,
    usdcBalance,
    refreshBalances,
    approveUSDC,
    depositToStacks,
  } = useBridge();

  const navItems = [
    { path: '/', label: 'Bridge' },
    { path: '/multichain', label: 'Multichain' },
    { path: '/transfer', label: 'Transfer USDCx' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link to="/" className="flex items-center gap-3">
                  <img 
                    src="/logo.png" 
                    alt="Hermes" 
                    className="w-10 h-10 rounded-xl shadow-lg bg-white p-1"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Hermes</h1>
                    <p className="text-xs text-muted-foreground">Borderless Stablecoins</p>
                  </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
              
              <ConnectWalletButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-3">
                <span className="text-gradient-bitcoin">USDC</span>
                <span className="text-foreground"> ↔ USDCx</span>
              </h2>
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
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-6 mt-auto">
          <div className="container mx-auto px-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              Alkebulant Labs
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

export default Index;
