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
  address: import.meta.env.VITE_USDCX_ADDRESS,
  name: import.meta.env.VITE_USDCX_NAME,
  assetName: import.meta.env.VITE_USDCX_ASSET_NAME,
};

// USDCx v1 contract for minting/burning
const USDCX_V1_CONTRACT = {
  address: import.meta.env.VITE_USDCX_V1_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Default testnet address
  name: 'usdcx-v1',
};

export function useStacksWallet() {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [usdcxBalance, setUsdcxBalance] = useState<string>('0');
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState<string>('5');
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

  const fetchMinWithdrawalAmount = async () => {
    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/v2/contracts/call-read/${USDCX_V1_CONTRACT.address}/${USDCX_V1_CONTRACT.name}/get-min-withdrawal-amount`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: USDCX_V1_CONTRACT.address,
            arguments: []
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Parse the Clarity response - assuming it returns a uint
        const amount = data.result?.value?.value || '5000000'; // Default to 5 USDCx in micro-units
        const formatted = (parseInt(amount) / 1_000_000).toFixed(6);
        setMinWithdrawalAmount(formatted);
      }
    } catch (error) {
      console.error('Error fetching min withdrawal amount:', error);
      // Keep default value
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
    fetchMinWithdrawalAmount(); // Fetch min withdrawal amount on mount
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
    fetchMinWithdrawalAmount();
  }, [stacksAddress]);

  const transferUsdcx = useCallback(async (
    recipient: string,
    amount: string,
    memo?: string
  ): Promise<string | null> => {
    console.log('transferUsdcx called with:', { recipient, amount, memo });
    console.log('amount type:', typeof amount, 'amount value:', amount);

    if (!stacksAddress) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      // Convert amount to micro-units (6 decimals)
      const parsedAmount = parseFloat(amount);
      console.log('parsed amount:', parsedAmount, 'isNaN:', isNaN(parsedAmount));

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid amount: ' + amount);
      }

      const microAmount = BigInt(Math.floor(parsedAmount * 1_000_000));
      console.log('micro amount:', microAmount);

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

  const burnUsdcx = useCallback(async (
    amount: string,
    ethereumAddress: string
  ): Promise<string | null> => {
    console.log('burnUsdcx called with:', { amount, ethereumAddress });

    if (!stacksAddress) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      // Convert amount to micro-units (6 decimals)
      const parsedAmount = parseFloat(amount);
      console.log('parsed amount:', parsedAmount, 'isNaN:', isNaN(parsedAmount));

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid amount: ' + amount);
      }

      // Check minimum withdrawal amount
      const minAmount = parseFloat(minWithdrawalAmount);
      if (parsedAmount < minAmount) {
        throw new Error(`Amount must be at least ${minAmount} USDCx`);
      }

      const microAmount = BigInt(Math.floor(parsedAmount * 1_000_000));
      console.log('micro amount:', microAmount);

      // Convert Ethereum address to 32-byte buffer
      // Remove 0x prefix if present
      const cleanAddress = ethereumAddress.startsWith('0x') ? ethereumAddress.slice(2) : ethereumAddress;

      // Pad to 32 bytes (64 hex chars)
      const paddedAddress = cleanAddress.padStart(64, '0');
      const addressBuffer = Buffer.from(paddedAddress, 'hex');

      console.log('Calling burn with args:', {
        amount: microAmount.toString(),
        domain: 0, // Ethereum domain
        recipient: addressBuffer.toString('hex')
      });

      // For burn operations, we need post-conditions to verify the token transfer
      // The contract will burn the tokens, but we need to ensure the user sends them

      // Build function arguments using Cl helpers
      const functionArgs = [
        Cl.uint(microAmount), // amount
        Cl.uint(0), // native-domain (0 for Ethereum)
        Cl.buffer(addressBuffer), // native-recipient as 32-byte buffer
      ];

      console.log('Contract call:', {
        contract: `${USDCX_V1_CONTRACT.address}.${USDCX_V1_CONTRACT.name}`,
        functionName: 'burn',
        functionArgs: functionArgs.map(arg => arg.toString()),
        postConditions: [Pc.principal(stacksAddress).willSendEq(microAmount).ft(`${USDCX_CONTRACT.address}.${USDCX_CONTRACT.name}`, USDCX_CONTRACT.assetName)] // Ensure exactly the burned amount is sent
      });

      // Use the new request API for contract calls
      const response = await request('stx_callContract', {
        contract: `${USDCX_V1_CONTRACT.address}.${USDCX_V1_CONTRACT.name}`,
        functionName: 'burn',
        functionArgs,
        postConditions: [Pc.principal(stacksAddress).willSendEq(microAmount).ft(`${USDCX_CONTRACT.address}.${USDCX_CONTRACT.name}`, USDCX_CONTRACT.assetName)], // Ensure exactly the burned amount is sent
        network: 'testnet',
      });

      console.log('Burn TX:', response.txid);
      setIsLoading(false);

      // Refresh balance after a delay
      setTimeout(() => refreshBalance(), 5000);

      return response.txid;
    } catch (error) {
      setIsLoading(false);
      console.error('Burn error:', error);
      throw error;
    }
  }, [stacksAddress, refreshBalance]);

  const approveUsdcx = useCallback(async (spender: string, amount: string): Promise<string | null> => {
    if (!stacksAddress) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      console.log('approve parsed amount:', parsedAmount, 'isNaN:', isNaN(parsedAmount));

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid amount: ' + amount);
      }

      const microAmount = BigInt(Math.floor(parsedAmount * 1_000_000));
      console.log('approve micro amount:', microAmount);

      // Build function arguments using Cl helpers
      const functionArgs = [
        Cl.principal(spender),
        Cl.uint(microAmount),
      ];

      // Use the new request API for contract calls
      const response = await request('stx_callContract', {
        contract: `${USDCX_CONTRACT.address}.${USDCX_CONTRACT.name}`,
        functionName: 'approve',
        functionArgs,
        postConditions: [],
        network: 'testnet',
      });

      console.log('Approve TX:', response.txid);
      setIsLoading(false);
      
      // Refresh balance after a delay
      setTimeout(() => refreshBalance(), 5000);
      
      return response.txid;
    } catch (error) {
      setIsLoading(false);
      console.error('Approve error:', error);
      throw error;
    }
  }, [stacksAddress, refreshBalance]);

  return {
    stacksAddress,
    isConnected,
    usdcxBalance,
    minWithdrawalAmount,
    isLoading,
    connectWallet,
    disconnectWallet,
    transferUsdcx,
    burnUsdcx,
    approveUsdcx,
    refreshBalance,
  };
}
