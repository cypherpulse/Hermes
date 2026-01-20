import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { 
  sepolia, 
  baseSepolia, 
  arbitrumSepolia, 
  optimismSepolia, 
  polygonAmoy,
  avalancheFuji,
  lineaSepolia,
} from 'wagmi/chains';
import { defineChain } from 'viem';

// WalletConnect Project ID - get yours at https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Define Unichain Sepolia (not in wagmi/chains yet)
const unichainSepolia = defineChain({
  id: 1301,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://sepolia.uniscan.xyz' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Hermes Bridge',
  projectId,
  chains: [
    sepolia,
    baseSepolia,
    arbitrumSepolia,
    optimismSepolia,
    polygonAmoy,
    avalancheFuji,
    lineaSepolia,
    unichainSepolia,
  ],
  ssr: false,
});
