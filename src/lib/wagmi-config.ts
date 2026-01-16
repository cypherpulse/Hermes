import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// WalletConnect Project ID - get yours at https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

export const config = getDefaultConfig({
  appName: 'Hermes Bridge',
  projectId,
  chains: [sepolia],
  ssr: false,
  appDescription: 'Cross-chain USDC bridge between Ethereum and Stacks',
  appUrl: typeof window !== 'undefined' ? window.location.origin : 'https://hermes-bridge.vercel.app',
  appIcon: typeof window !== 'undefined' ? `${window.location.origin}/hermes-logo.svg` : 'https://hermes-bridge.vercel.app/hermes-logo.svg',
});
