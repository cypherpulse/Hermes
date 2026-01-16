import { useState, useEffect, useCallback } from 'react';
import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  http,
  formatUnits,
  parseUnits,
  type Address,
  type Hex,
} from 'viem';
import { sepolia } from 'viem/chains';
import { BRIDGE_CONFIG, ERC20_ABI, X_RESERVE_ABI } from '@/lib/bridge-config';
import { encodeStacksAddress } from '@/lib/stacks-address';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}

interface WalletState {
  address: Address | null;
  ethBalance: string;
  usdcBalance: string;
  isConnecting: boolean;
  isConnected: boolean;
  chainId: number | null;
  error: string | null;
}

// Create public client outside component (reusable)
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(BRIDGE_CONFIG.ETH_RPC_URL),
});

export function useEthereumWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    ethBalance: '0',
    usdcBalance: '0',
    isConnecting: false,
    isConnected: false,
    chainId: null,
    error: null,
  });

  const [walletAddress, setWalletAddress] = useState<Address | null>(null);

  const fetchBalances = useCallback(async (address: Address) => {
    try {
      // Fetch ETH balance
      const ethBalance = await publicClient.getBalance({ address });
      
      // Fetch USDC balance using call
      const usdcBalanceResult = await publicClient.call({
        to: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
        data: `0x70a08231000000000000000000000000${address.slice(2)}` as Hex,
      });

      let usdcBalance = BigInt(0);
      if (usdcBalanceResult.data) {
        usdcBalance = BigInt(usdcBalanceResult.data);
      }

      setState(prev => ({
        ...prev,
        ethBalance: formatUnits(ethBalance, 18),
        usdcBalance: formatUnits(usdcBalance, 6),
      }));
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'Please install MetaMask or another Web3 wallet' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      }) as string;
      const chainId = parseInt(chainIdHex, 16);

      // Switch to Sepolia if not already on it
      if (chainId !== BRIDGE_CONFIG.CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${BRIDGE_CONFIG.CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: unknown) {
          // Chain not added, try to add it
          const err = switchError as { code?: number };
          if (err.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${BRIDGE_CONFIG.CHAIN_ID.toString(16)}`,
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: [BRIDGE_CONFIG.ETH_RPC_URL],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      const address = accounts[0] as Address;
      setWalletAddress(address);

      setState(prev => ({
        ...prev,
        address,
        isConnected: true,
        isConnecting: false,
        chainId: BRIDGE_CONFIG.CHAIN_ID,
      }));

      // Fetch balances
      await fetchBalances(address);
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err.message || 'Failed to connect wallet',
      }));
    }
  }, [fetchBalances]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      ethBalance: '0',
      usdcBalance: '0',
      isConnecting: false,
      isConnected: false,
      chainId: null,
      error: null,
    });
    setWalletAddress(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const newAddress = accounts[0] as Address;
        setWalletAddress(newAddress);
        setState(prev => ({ ...prev, address: newAddress }));
        fetchBalances(newAddress);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [disconnect, fetchBalances]);

  const approveUSDC = useCallback(async (amount: string): Promise<string | null> => {
    if (!walletAddress || !window.ethereum) {
      throw new Error('Wallet not connected');
    }

    const walletClient = createWalletClient({
      account: walletAddress,
      chain: sepolia,
      transport: custom(window.ethereum),
    });

    const value = parseUnits(amount, 6);

    const hash = await walletClient.writeContract({
      address: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [BRIDGE_CONFIG.X_RESERVE_CONTRACT as Address, value],
      account: walletAddress,
      chain: sepolia,
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    return hash;
  }, [walletAddress]);

  const depositToStacks = useCallback(async (
    amount: string,
    stacksRecipient: string
  ): Promise<string | null> => {
    if (!walletAddress || !window.ethereum) {
      throw new Error('Wallet not connected');
    }

    const walletClient = createWalletClient({
      account: walletAddress,
      chain: sepolia,
      transport: custom(window.ethereum),
    });

    const value = parseUnits(amount, 6);
    const maxFee = parseUnits('0', 6);
    const remoteRecipient = encodeStacksAddress(stacksRecipient);
    const hookData = '0x' as Hex;

    const hash = await walletClient.writeContract({
      address: BRIDGE_CONFIG.X_RESERVE_CONTRACT as Address,
      abi: X_RESERVE_ABI,
      functionName: 'depositToRemote',
      args: [
        value,
        BRIDGE_CONFIG.STACKS_DOMAIN,
        remoteRecipient,
        BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
        maxFee,
        hookData,
      ],
      account: walletAddress,
      chain: sepolia,
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    // Refresh balances
    await fetchBalances(walletAddress);

    return hash;
  }, [walletAddress, fetchBalances]);

  const refreshBalances = useCallback(() => {
    if (state.address) {
      fetchBalances(state.address);
    }
  }, [state.address, fetchBalances]);

  return {
    ...state,
    connect,
    disconnect,
    approveUSDC,
    depositToStacks,
    refreshBalances,
    hasMetaMask: typeof window !== 'undefined' && !!window.ethereum,
  };
}
