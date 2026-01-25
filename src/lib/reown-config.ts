import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonAmoy,
  avalancheFuji,
  lineaSepolia,
} from '@reown/appkit/networks'
import { defineChain } from 'viem'

// Define Unichain Sepolia (not in @reown/appkit/networks yet)
const unichainSepolia = defineChain({
  id: 1301,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.unichain.org'] } },
  blockExplorers: { default: { name: 'Uniscan', url: 'https://sepolia.uniscan.xyz' } },
  testnet: true,
});

const arcSepolia = defineChain({
  id: 5042002,
  name: 'Arc Sepolia',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
});

const worldChainSepolia = defineChain({
  id: 4801,
  name: 'World Chain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://worldchain-sepolia.g.alchemy.com/public'] } },
  blockExplorers: { default: { name: 'World Chain Explorer', url: 'https://worldchain-sepolia.explorer.alchemy.com' } },
  testnet: true,
});


const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set in environment variables')
}

// Create the Wagmi adapter
const metadata = {
  name: 'Hermes Bridge',
  description: 'Cross-chain USDC bridge between Ethereum and Stacks',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://hermes-bridge.vercel.app',
  icons: [
    typeof window !== 'undefined' 
      ? `${window.location.origin}/logo.png` 
      : 'https://hermes-bridge.vercel.app/logo.png'
  ]
}

// Define all supported testnet chains
const networks = [
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  avalancheFuji,
  optimismSepolia,
  polygonAmoy,
  lineaSepolia,
  unichainSepolia,
  arcSepolia,
  worldChainSepolia,
];

export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks,
})

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [
    sepolia,
    baseSepolia,
    arbitrumSepolia,
    avalancheFuji,
    optimismSepolia,
    polygonAmoy,
    lineaSepolia,
    unichainSepolia,
    arcSepolia,
    worldChainSepolia,
  ],
  defaultNetwork: sepolia,
  projectId,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--apkt-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  allowUnsupportedChain: false,
})

export type AppKit = typeof appKit