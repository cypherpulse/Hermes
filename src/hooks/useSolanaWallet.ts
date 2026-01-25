import { useState, useCallback, useEffect, useMemo } from 'react';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createSolanaKitAdapterFromProvider } from '@circle-fin/adapter-solana-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { useWallet } from '@solana/wallet-adapter-react';
import { useStacksWallet } from './useStacksWallet';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';

declare global {
  interface Window {
    solana?: any;
    ethereum?: any;
  }
}

export function useSolanaWallet() {
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const { publicKey, connected, wallet, signTransaction } = useWallet();
  const { transferUsdcx } = useStacksWallet();

  // DEVNET USDC MINT ADDRESS
  const USDC_MINT = useMemo(() => 
    new PublicKey(import.meta.env.VITE_SOLANA_USDC_MINT), // Devnet USDC
    []
  );

  // Use devnet connection
  const devnetConnection = useMemo(() => 
    new Connection(clusterApiUrl('devnet'), 'confirmed'),
    []
  );

  useEffect(() => {
    if (connected && publicKey) {
      setSolanaAddress(publicKey.toString());
    } else {
      setSolanaAddress(null);
    }
  }, [connected, publicKey]);

  // Override Connection.simulateTransaction to sign tx if not signed
  useEffect(() => {
    const originalSimulate = Connection.prototype.simulateTransaction;
    Connection.prototype.simulateTransaction = async function(tx, config) {
      if (tx.signatures.some(s => s !== null)) {
        // Already signed
        return originalSimulate.call(this, tx, config);
      } else {
        // Sign first
        console.log('Global simulate: signing tx');
        const signFunction = (window as any).solanaSignFunction;
        if (signFunction) {
          const signedTx = await signFunction(tx);
          return originalSimulate.call(this, signedTx, config);
        } else {
          return originalSimulate.call(this, tx, config);
        }
      }
    };
    return () => {
      Connection.prototype.simulateTransaction = originalSimulate;
    };
  }, []);

  useEffect(() => {
    (window as any).solanaSignFunction = signTransaction;
  }, [signTransaction]);

  const fetchUsdcBalance = useCallback(async () => {
    if (!solanaAddress) return;

    try {
      const ownerPublicKey = new PublicKey(solanaAddress);
      const tokenAccounts = await devnetConnection.getTokenAccountsByOwner(ownerPublicKey, {
        mint: USDC_MINT,
      });

      if (tokenAccounts.value.length > 0) {
        const tokenAccountInfo = await devnetConnection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
        setUsdcBalance(tokenAccountInfo.value.uiAmount || 0);
      } else {
        setUsdcBalance(0);
      }
    } catch (error) {
      console.error('Failed to fetch USDC balance:', error);
      setUsdcBalance(null);
    }
  }, [solanaAddress, USDC_MINT, devnetConnection]);

  const fetchSolBalance = useCallback(async () => {
    if (!solanaAddress) return;

    try {
      const ownerPublicKey = new PublicKey(solanaAddress);
      const balance = await devnetConnection.getBalance(ownerPublicKey);
      // Convert lamports to SOL (1 SOL = 1e9 lamports)
      setSolBalance(balance / 1e9);
    } catch (error) {
      console.error('Failed to fetch SOL balance:', error);
      setSolBalance(null);
    }
  }, [solanaAddress, devnetConnection]);

  useEffect(() => {
    if (solanaAddress) {
      fetchUsdcBalance();
      fetchSolBalance();
    } else {
      setUsdcBalance(null);
      setSolBalance(null);
    }
  }, [solanaAddress, fetchUsdcBalance, fetchSolBalance]);

  const bridgeToStacks = useCallback(async (amount: string, stacksRecipient: string): Promise<boolean> => {
    console.log('=== Bridge Debug Info ===');
    console.log('Wallet connected:', connected);
    console.log('Solana address:', solanaAddress);
    console.log('Amount:', amount);
    console.log('Stacks recipient:', stacksRecipient);
    console.log('Wallet adapter:', wallet?.adapter.name);

    if (!connected || !solanaAddress || !wallet) {
      alert('Solana wallet must be connected');
      return false;
    }

    if (!publicKey) {
      alert('Solana public key not found');
      return false;
    }

    if (!window.ethereum) {
      alert('Ethereum wallet (MetaMask, etc.) is required for the bridge. Please install and connect an Ethereum wallet.');
      return false;
    }

    // Check if Ethereum wallet is connected
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        alert('Please connect your Ethereum wallet (MetaMask, etc.) to Sepolia testnet');
        return false;
      }
      console.log('Ethereum wallet connected:', accounts[0]);
    } catch (error) {
      console.error('Error checking Ethereum wallet:', error);
      alert('Error connecting to Ethereum wallet. Please make sure MetaMask is connected to Sepolia testnet.');
      return false;
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('Invalid amount:', amount);
      alert('Please enter a valid amount');
      return false;
    }

    try {
      console.log('Starting Solana DEVNET to Stacks bridge using Circle Bridge Kit...');

      // Check for window.solana
      if (!window.solana) {
        alert('Please install a Solana wallet like Phantom');
        return false;
      }

      if (!window.solana.isConnected) {
        try {
          await window.solana.connect();
        } catch (error) {
          alert('Failed to connect to Solana wallet');
          return false;
        }
      }

      // Ensure publicKey is available
      if (!window.solana.publicKey) {
        alert('Wallet not connected properly. Please try again.');
        return false;
      }

      // Use window.solana directly as provider
      const solanaProvider = {
        ...window.solana,
        isConnected: window.solana.isConnected || true,
        address: window.solana.publicKey?.toString(),
      };

      console.log('Creating Solana adapter from window.solana...');
      
      const solanaAdapterKit = await createSolanaKitAdapterFromProvider({
        provider: solanaProvider,  // Use the wrapped provider
        connection: devnetConnection,
      }) as any;

      console.log('Creating EVM adapter...');

      const evmAdapter = await createViemAdapterFromProvider({
        provider: (window as any).ethereum,
      });

      console.log('✅ Adapters created successfully');
      console.log('✅ Solana DEVNET adapter ready');
      console.log('✅ EVM adapter ready');

      const kit = new BridgeKit();

      console.log('🚀 Bridging from Solana DEVNET to Ethereum Sepolia...');
      console.log('Amount:', amount, 'USDC');
      console.log('From:', solanaAddress);

      // Check balance
      if (usdcBalance !== null && parseFloat(amount) > usdcBalance) {
        alert(`Insufficient balance. You have ${usdcBalance} USDC but trying to bridge ${amount} USDC`);
        return false;
      }

      console.log('Initiating CCTP bridge...');

      // Step 1: Bridge from Solana DEVNET to Ethereum SEPOLIA using CCTP
      const cctpResult = await kit.bridge({
        from: { adapter: solanaAdapterKit, chain: 'Solana_Devnet' },
        to: { adapter: evmAdapter, chain: 'Ethereum_Sepolia' },
        amount: amount,
      });

      console.log('CCTP Result:', JSON.stringify(cctpResult, null, 2));

      // Check if the bridge was successful by examining the steps
      if (!cctpResult || !cctpResult.steps || cctpResult.steps.length === 0) {
        throw new Error('CCTP bridge failed: No result or steps returned');
      }

      const failedSteps = cctpResult.steps.filter((step: any) => step.state === 'error' || step.state === 'failed');
      if (failedSteps.length > 0) {
        console.error('Failed steps:', failedSteps);
        const errorDetails = failedSteps.map((s: any) => `${s.name}: ${s.errorMessage || 'Unknown error'}`).join('\n');
        throw new Error(`CCTP bridge failed:\n${errorDetails}`);
      }

      console.log('✅ All CCTP steps successful!');
      console.log('🚀 Bridging from Ethereum Sepolia to Stacks...');

      // Step 2: Bridge from Ethereum to Stacks
      const stacksSuccess = await transferUsdcx(stacksRecipient, amount);

      if (stacksSuccess) {
        console.log('✅ Complete Solana Devnet to Stacks bridge successful!');
        return true;
      } else {
        throw new Error('Stacks transfer failed');
      }
    } catch (error: any) {
      console.error('❌ Solana bridge failed:', error);
      
      // Better error messaging
      if (error.message?.includes('signature')) {
        alert('Transaction signing failed. Please make sure your wallet is unlocked and try again.');
      } else if (error.message?.includes('Simulation failed')) {
        alert('Transaction simulation failed. Please check your USDC balance and try again.');
      } else {
        alert(`Bridge failed: ${error.message || 'Unknown error'}`);
      }
      
      return false;
    }
  }, [solanaAddress, connected, wallet, publicKey, signTransaction, transferUsdcx, usdcBalance, devnetConnection, fetchUsdcBalance]);

  return {
    solanaAddress,
    usdcBalance,
    solBalance,
    fetchUsdcBalance,
    fetchSolBalance,
    bridgeToStacks,
  };
}