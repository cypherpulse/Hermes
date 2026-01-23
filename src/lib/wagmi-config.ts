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

const arcSepolia = defineChain({
  id: 5042002,
  name: 'Arc Sepolia',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

const worldChainSepolia = defineChain({
  id: 4801,
  name: 'World Chain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://worldchain-sepolia.g.alchemy.com/public'] },
  },
  blockExplorers: {
    default: { name: 'World Chain Explorer', url: 'https://worldchain-sepolia.explorer.alchemy.com' },
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
    arcSepolia,
    worldChainSepolia,
  ],
  ssr: false,
});
