/**
 * Multichain Bridge Configuration
 * 
 * This configuration supports CCTP (Cross-Chain Transfer Protocol) bridging
 * between multiple chains via Ethereum as an intermediary to reach Stacks.
 * 
 * Flow: Source Chain → Ethereum (CCTP) → Stacks (xReserve)
 */

export type CCTPChainId = 
  | 'Arbitrum_Sepolia'
  | 'Avalanche_Fuji'
  | 'Base_Sepolia'
  | 'Ethereum_Sepolia'
  | 'Optimism_Sepolia'
  | 'Polygon_Amoy_Testnet'
  | 'Linea_Sepolia'
  | 'Unichain_Sepolia'
  | 'Arc_Testnet';

export interface CCTPChainConfig {
  id: CCTPChainId;
  name: string;
  displayName: string;
  chainId: number;
  icon: string;
  rpcUrl: string;
  blockExplorer: string;
  usdcAddress: `0x${string}`;
  isTestnet: boolean;
  color: string;
}

// Supported CCTP Testnet chains for Bridge Kit
export const CCTP_CHAINS: Record<CCTPChainId, CCTPChainConfig> = {
    Arc_Testnet: {
      id: 'Arc_Testnet',
      name: 'Arc Testnet',
      displayName: 'Arc',
      chainId: 5042002,
      icon: 'https://res.cloudinary.com/dbczn8b8l/image/upload/v1769026854/gkzp400sdnxpucyctjnf.jpg',
      rpcUrl: 'https://rpc.testnet.arc.network',
      blockExplorer: 'https://testnet.arcscan.app',
      usdcAddress: '0x3600000000000000000000000000000000000000',
      isTestnet: true,
      color: '#1A73E8',
    },
  Ethereum_Sepolia: {
    id: 'Ethereum_Sepolia',
    name: 'Ethereum Sepolia',
    displayName: 'Ethereum',
    chainId: 11155111,
    icon: 'https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900941/download_6_b0zu0z.png',
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    isTestnet: true,
    color: '#627EEA',
  },
  Base_Sepolia: {
    id: 'Base_Sepolia',
    name: 'Base Sepolia',
    displayName: 'Base',
    chainId: 84532,
    icon: 'https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900372/download_hfl3h3.png',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    isTestnet: true,
    color: '#0052FF',
  },
  Arbitrum_Sepolia: {
    id: 'Arbitrum_Sepolia',
    name: 'Arbitrum Sepolia',
    displayName: 'Arbitrum',
    chainId: 421614,
    icon: 'https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900371/download_1_a5572s.png',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    isTestnet: true,
    color: '#28A0F0',
  },
  Avalanche_Fuji: {
    id: 'Avalanche_Fuji',
    name: 'Avalanche Fuji',
    displayName: 'Avalanche',
    chainId: 43113,
    icon: 'https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900372/avalanche-avax-logo_nkju6o.png',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    blockExplorer: 'https://testnet.snowtrace.io',
    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65',
    isTestnet: true,
    color: '#E84142',
  },
  Optimism_Sepolia: {
    id: 'Optimism_Sepolia',
    name: 'OP Sepolia',
    displayName: 'Optimism',
    chainId: 11155420,
    icon: 'https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900371/download_2_sv0thd.png',
    rpcUrl: 'https://sepolia.optimism.io',
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    isTestnet: true,
    color: '#FF0420',
  },
  Polygon_Amoy_Testnet: {
    id: 'Polygon_Amoy_Testnet',
    name: 'Polygon Amoy',
    displayName: 'Polygon',
    chainId: 80002,
    icon: 'https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900372/download_3_pnzwd3.png',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    blockExplorer: 'https://amoy.polygonscan.com',
    usdcAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    isTestnet: true,
    color: '#8247E5',
  },
  Linea_Sepolia: {
    id: 'Linea_Sepolia',
    name: 'Linea Sepolia',
    displayName: 'Linea',
    chainId: 59141,
    icon: 'https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900372/download_5_fwekae.png',
    rpcUrl: 'https://rpc.sepolia.linea.build',
    blockExplorer: 'https://sepolia.lineascan.build',
    usdcAddress: '0xf56dc6695cF1f5c364eDEbC7Dc7077ac9B586068',
    isTestnet: true,
    color: '#61DFFF',
  },
  Unichain_Sepolia: {
    id: 'Unichain_Sepolia',
    name: 'Unichain Sepolia',
    displayName: 'Unichain',
    chainId: 1301,
    icon: 'https://res.cloudinary.com/dg5rr4ntw/image/upload/v1768900372/download_ppknwm.jpg',
    rpcUrl: 'https://sepolia.unichain.org',
    blockExplorer: 'https://sepolia.uniscan.xyz',
    usdcAddress: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    isTestnet: true,
    color: '#FF007A',
  },
} as const;

// Get chains excluding Ethereum (for source selection when going TO Stacks)
export const getSourceChains = (): CCTPChainConfig[] => {
  return Object.values(CCTP_CHAINS).filter(chain => chain.id !== 'Ethereum_Sepolia');
};

// Get all chains for EVM-to-EVM bridging
export const getAllChains = (): CCTPChainConfig[] => {
  return Object.values(CCTP_CHAINS);
};

// Get chain by ID
export const getChainById = (id: CCTPChainId): CCTPChainConfig | undefined => {
  return CCTP_CHAINS[id];
};

// Get chain by chainId (numeric)
export const getChainByChainId = (chainId: number): CCTPChainConfig | undefined => {
  return Object.values(CCTP_CHAINS).find(chain => chain.chainId === chainId);
};

// Bridge Kit chain name mapping (matches Bridge Kit's expected format)
export const BRIDGE_KIT_CHAIN_NAMES: Record<CCTPChainId, string> = {
  Ethereum_Sepolia: 'Ethereum_Sepolia',
  Base_Sepolia: 'Base_Sepolia',
  Arbitrum_Sepolia: 'Arbitrum_Sepolia',
  Avalanche_Fuji: 'Avalanche_Fuji',
  Optimism_Sepolia: 'Optimism_Sepolia',
  Polygon_Amoy_Testnet: 'Polygon_Amoy_Testnet',
  Linea_Sepolia: 'Linea_Sepolia',
  Unichain_Sepolia: 'Unichain_Sepolia',
  Arc_Testnet: 'Arc_Testnet',
};

// Bridge step types
export type BridgeStepType = 'cctp' | 'xreserve';

export interface MultichainBridgeStep {
  type: BridgeStepType;
  fromChain: CCTPChainId;
  toChain: CCTPChainId | 'Stacks';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  txHash?: string;
  explorerUrl?: string;
}

export interface MultichainBridgeResult {
  success: boolean;
  steps: MultichainBridgeStep[];
  totalSteps: number;
  currentStep: number;
  error?: string;
}

// Wagmi chain configurations
export const WAGMI_CHAIN_CONFIG = {
    Arc_Testnet: {
      id: 5042002,
      name: 'Arc Testnet',
      nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
      rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
      blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
      testnet: true,
    },
  Base_Sepolia: {
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
    blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
    testnet: true,
  },
  Arbitrum_Sepolia: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] } },
    blockExplorers: { default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' } },
    testnet: true,
  },
  Avalanche_Fuji: {
    id: 43113,
    name: 'Avalanche Fuji',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: { default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] } },
    blockExplorers: { default: { name: 'Snowtrace', url: 'https://testnet.snowtrace.io' } },
    testnet: true,
  },
  Optimism_Sepolia: {
    id: 11155420,
    name: 'OP Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.optimism.io'] } },
    blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia-optimism.etherscan.io' } },
    testnet: true,
  },
  Polygon_Amoy_Testnet: {
    id: 80002,
    name: 'Polygon Amoy',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-amoy.polygon.technology'] } },
    blockExplorers: { default: { name: 'Polygonscan', url: 'https://amoy.polygonscan.com' } },
    testnet: true,
  },
  Linea_Sepolia: {
    id: 59141,
    name: 'Linea Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.sepolia.linea.build'] } },
    blockExplorers: { default: { name: 'Lineascan', url: 'https://sepolia.lineascan.build' } },
    testnet: true,
  },
  Unichain_Sepolia: {
    id: 1301,
    name: 'Unichain Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.unichain.org'] } },
    blockExplorers: { default: { name: 'Uniscan', url: 'https://sepolia.uniscan.xyz' } },
    testnet: true,
  },
} as const;

// ERC20 ABI for USDC balance/allowance
export const MULTICHAIN_ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'remaining', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
] as const;
