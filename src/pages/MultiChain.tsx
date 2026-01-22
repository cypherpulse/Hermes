/**
 * MultiChain Page
 * 
 * Page for multichain bridging - allows users to bridge USDC from
 * various EVM chains to Stacks (via Ethereum) or between EVM chains directly.
 */

import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, ArrowLeft, Zap, Shield, Globe } from 'lucide-react';
import { ConnectWalletButton } from '@/components/bridge/ConnectWalletButton';
import { MultiChainBridgeForm } from '@/components/multichain/MultiChainBridgeForm';
import { BridgeProgress } from '@/components/multichain/BridgeProgress';
import { useMultiChainBridge } from '@/hooks/useMultiChainBridge';
import { useStacksWallet } from '@/hooks/useStacksWallet';
import { CCTP_CHAINS } from '@/lib/multichain-bridge-config';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function MultiChain() {
  const location = useLocation();
  const { isConnected } = useMultiChainBridge();
  const { stacksAddress, isConnected: isStacksConnected, connectWallet: connectStacksWallet } = useStacksWallet();

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Globe className="w-4 h-4" />
                Multichain Bridge
              </div>
              <h2 className="text-3xl font-bold mb-3">
                <span className="text-foreground">Bridge from </span>
                <span className="text-gradient-bitcoin">Any Chain</span>
              </h2>
              <p className="text-muted-foreground">
                Bridge USDC from 7+ chains to Stacks seamlessly
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-sm">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-muted-foreground">Fast</span>
              </div>
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-sm">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span className="text-muted-foreground">Secure</span>
              </div>
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-sm">
                <span className="text-blue-500">◎</span>
                  <span className="text-foreground font-medium">Circle Verified</span>
              </div>
            </div>

            {/* Stacks Wallet Connection (for destination) */}
            {!isStacksConnected && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Connect Stacks Wallet</p>
                    <p className="text-sm text-muted-foreground">Required for bridging to Stacks</p>
                  </div>
                  <button
                    onClick={connectStacksWallet}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>
            )}

            {/* Connected Stacks Address */}
            {isStacksConnected && stacksAddress && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stacks Destination</p>
                    <p className="font-mono text-sm text-foreground">
                      {stacksAddress.slice(0, 10)}...{stacksAddress.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-500 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Connected
                  </div>
                </div>
              </div>
            )}

            {/* Bridge Form */}
            <div className="bg-card/50 border border-border rounded-2xl p-6 backdrop-blur-sm">
              <MultiChainBridgeForm 
                isWalletConnected={isConnected}
                stacksAddress={stacksAddress}
              />
            </div>

            {/* Supported Chains */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-3">Supported Chains</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(CCTP_CHAINS).map((chain) => (
                  <div
                    key={chain.id}
                    className="flex items-center gap-2 bg-accent/30 hover:bg-accent/50 px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    {chain.icon.startsWith('http') ? (
                      <img
                        src={chain.icon}
                        alt={chain.displayName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">{chain.icon}</span>
                    )}
                    <span className="text-muted-foreground font-medium">{chain.displayName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-3">How it Works</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <div>
                    <p className="text-sm font-medium">Select Source Chain</p>
                    <p className="text-xs text-muted-foreground">Choose which chain your USDC is on</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</div>
                  <div>
                    <p className="text-sm font-medium">Secure Transfer</p>
                    <p className="text-xs text-muted-foreground">Your USDC is safely transferred across chains</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</div>
                  <div>
                    <p className="text-sm font-medium">Arrive on Stacks</p>
                    <p className="text-xs text-muted-foreground">Your USDC arrives instantly on Stacks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Links */}
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://sepoliafaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
              >
                <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                  Get Test ETH
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  Sepolia Faucet
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
              >
                <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                  Get Test USDC
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  Circle Faucet
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
