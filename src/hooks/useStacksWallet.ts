import { useState, useCallback, useEffect } from 'react';
import { 
  connect, 
  disconnect, 
  isConnected as checkIsConnected, 
  getLocalStorage, 
  request 
} from '@stacks/connect';
import { Cl, Pc } from '@stacks/transactions';

// USDCx contract details on testnet
const USDCX_CONTRACT = {
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  name: 'usdcx',
  assetName: 'usdcx-token',
};

export function useStacksWallet() {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [usdcxBalance, setUsdcxBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsdcxBalance = async (address: string) => {
    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${address}/balances`
      );
      const data = await response.json();
      
      // Look for USDCx token balance
      const usdcxKey = `${USDCX_CONTRACT.address}.${USDCX_CONTRACT.name}::${USDCX_CONTRACT.assetName}`;
      const balance = data.fungible_tokens?.[usdcxKey]?.balance || '0';
      
      // Convert from micro-units (6 decimals)
      const formatted = (parseInt(balance) / 1_000_000).toFixed(6);
      setUsdcxBalance(formatted);
    } catch (error) {
      console.error('Error fetching USDCx balance:', error);
      setUsdcxBalance('0');
    }
  };

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = () => {
      if (checkIsConnected()) {
        const storage = getLocalStorage();
        
        // The new API stores addresses differently
        const stxAddresses = storage?.addresses?.stx;
        if (stxAddresses && stxAddresses.length > 0) {
          // Find testnet address (starts with ST)
          const testnetAddr = stxAddresses.find((a: { address: string }) => 
            a.address.startsWith('ST')
          );
          const address = testnetAddr?.address || stxAddresses[0]?.address;
          
          if (address) {
            setStacksAddress(address);
            setIsConnected(true);
            fetchUsdcxBalance(address);
          }
        }
      }
    };
    checkConnection();
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use @stacks/connect v8 API - it handles mobile deep linking automatically
      await connect();
      
      // Get addresses from local storage after connect
      const storage = getLocalStorage();
      
      const stxAddresses = storage?.addresses?.stx;
      if (stxAddresses && stxAddresses.length > 0) {
        // Find testnet address (starts with ST)
        const testnetAddr = stxAddresses.find((a: { address: string }) => 
          a.address.startsWith('ST')
        );
        const address = testnetAddr?.address || stxAddresses[0]?.address;
        
        if (address) {
          setStacksAddress(address);
          setIsConnected(true);
          fetchUsdcxBalance(address);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setStacksAddress(null);
    setIsConnected(false);
    setUsdcxBalance('0');
  }, []);

  const refreshBalance = useCallback(() => {
    if (stacksAddress) {
      fetchUsdcxBalance(stacksAddress);
    }
  }, [stacksAddress]);

  const transferUsdcx = useCallback(async (
    recipient: string,
    amount: string,
    memo?: string
  ): Promise<string | null> => {
    if (!stacksAddress) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      // Convert amount to micro-units (6 decimals)
      const microAmount = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

      // Create post-condition using the Pc builder API
      const postCondition = Pc.principal(stacksAddress)
        .willSendEq(microAmount)
        .ft(`${USDCX_CONTRACT.address}.${USDCX_CONTRACT.name}`, USDCX_CONTRACT.assetName);

      // Build function arguments using Cl helpers
      const functionArgs = [
        Cl.uint(microAmount),
        Cl.principal(stacksAddress),
        Cl.principal(recipient),
        memo ? Cl.some(Cl.bufferFromUtf8(memo)) : Cl.none(),
      ];

      // Use the new request API for contract calls
      const response = await request('stx_callContract', {
        contract: `${USDCX_CONTRACT.address}.${USDCX_CONTRACT.name}`,
        functionName: 'transfer',
        functionArgs,
        postConditions: [postCondition],
        network: 'testnet',
      });

      console.log('Transfer TX:', response.txid);
      setIsLoading(false);
      
      // Refresh balance after a delay
      setTimeout(() => refreshBalance(), 5000);
      
      return response.txid;
    } catch (error) {
      setIsLoading(false);
      console.error('Transfer error:', error);
      throw error;
    }
  }, [stacksAddress, refreshBalance]);

  return {
    stacksAddress,
    isConnected,
    usdcxBalance,
    isLoading,
    connectWallet,
    disconnectWallet,
    transferUsdcx,
    refreshBalance,
  };
}
