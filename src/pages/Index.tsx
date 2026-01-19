import { useBridge } from "@/hooks/useBridge";
import { useStacksWallet } from "@/hooks/useStacksWallet";
import { ConnectWalletButton } from "@/components/bridge/ConnectWalletButton";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { TransferForm } from "@/components/bridge/TransferForm";
import { BalanceDisplay } from "@/components/bridge/BalanceDisplay";
import { ExternalLink, ArrowDownUp, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
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
        {/* Header */}
        <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Hermes" 
                  className="w-10 h-10 rounded-xl shadow-lg bg-white p-1"
                />
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Hermes</h1>
                  <p className="text-xs text-muted-foreground">Borderless Stablecoins</p>
                </div>
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
                Powered by Circle's xReserve Protocol
              </p>
            </div>

            {/* Tabs for Bridge / Transfer */}
            <Tabs defaultValue="bridge" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="bridge" className="flex items-center gap-2">
                  <ArrowDownUp className="w-4 h-4" />
                  Bridge
                </TabsTrigger>
                <TabsTrigger value="transfer" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Transfer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bridge" className="space-y-6">
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
              </TabsContent>

              <TabsContent value="transfer" className="space-y-6">
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
              </TabsContent>
            </Tabs>

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
              <a
                href="https://www.circle.com/en/xreserve"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Circle xReserve
              </a>
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
