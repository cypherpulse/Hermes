import { appKit } from '@/lib/reown-config';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useBalance } from 'wagmi';
import { Wallet, LogOut } from 'lucide-react';
import { useDisconnect } from '@reown/appkit/react';
import { formatUnits, type Address } from 'viem';

export function ConnectWalletButton() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { data: balance } = useBalance({ 
    address: address as Address | undefined 
  });
  const { disconnect } = useDisconnect();

  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect';
  const displayBalance = balance 
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4) 
    : '0.0000';
  const displaySymbol = balance?.symbol || 'ETH';

  if (!isConnected) {
    return (
      <button
        onClick={() => appKit.open()}
        className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200 active:scale-95"
      >
        <Wallet className="w-5 h-5 transition-transform group-hover:scale-110" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Network Selector */}
      <button
        onClick={() => appKit.open({ view: 'Networks' })}
        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-primary/20 hover:border-primary/50 hover:bg-secondary transition-all duration-200"
      >
        <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
          Network
        </span>
      </button>

      {/* Balance Display */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30 border border-primary/10">
        <div className="text-right">
          <div className="text-xs font-semibold text-primary">
            {displayBalance}
          </div>
          <div className="text-xs text-muted-foreground">
            {displaySymbol}
          </div>
        </div>
      </div>

      {/* Account Button */}
      <div className="relative group">
        <button
          onClick={() => appKit.open({ view: 'Account' })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 hover:border-primary/60 hover:from-primary/30 hover:to-primary/20 transition-all duration-200 active:scale-95"
        >
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
            {displayAddress.charAt(0)}
          </div>
          <span className="font-mono text-sm font-semibold text-foreground">
            {displayAddress}
          </span>
        </button>

        {/* Hover Tooltip */}
        <div className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-primary/40 z-50 shadow-xl">
          Click to view account
        </div>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={() => disconnect()}
        className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/60 transition-all duration-200 group"
        title="Disconnect wallet"
      >
        <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
      </button>
    </div>
  );
}
