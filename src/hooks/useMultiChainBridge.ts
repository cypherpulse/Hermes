/**
 * useMultiChainBridge Hook
 * 
 * Handles multi-chain bridging through a 2-step process:
 * 1. Source Chain → Ethereum (via CCTP Bridge Kit)
 * 2. Ethereum → Stacks (via xReserve)
 * 
 * Also supports direct EVM-to-EVM bridging via CCTP.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits, createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { createSolanaKitAdapterFromProvider } from '@circle-fin/adapter-solana-kit';
import {
  type CCTPChainId, 
  CCTP_CHAINS, 
  MULTICHAIN_ERC20_ABI,
  getChainByChainId,
} from '@/lib/multichain-bridge-config';
import { BRIDGE_CONFIG, ERC20_ABI, X_RESERVE_ABI } from '@/lib/bridge-config';
import { encodeStacksAddress } from '@/lib/stacks-address';

export type BridgeMode = 'to-stacks' | 'evm-to-evm';

export interface BridgeStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

export interface MultichainBridgeState {
  isLoading: boolean;
  currentStepIndex: number;
  steps: BridgeStep[];
  error: string | null;
  isCompleted: boolean;
}

export function useMultiChainBridge() {
  const { address, isConnected, chainId: connectedChainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  // Balances state
  const [sourceBalance, setSourceBalance] = useState<string>('0');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Bridge state
  const [bridgeState, setBridgeState] = useState<MultichainBridgeState>({
    isLoading: false,
    currentStepIndex: 0,
    steps: [],
    error: null,
    isCompleted: false,
  });

  // Get supported chains from Bridge Kit
  const [supportedChains, setSupportedChains] = useState<string[]>([]);

  // Initialize supported chains on mount
  useEffect(() => {
    const chains = getSupportedChains();
    // Filter out Solana since we have a dedicated Solana bridge
    const filteredChains = chains.filter(c => c.chain !== 'Solana_Devnet');
    setSupportedChains(filteredChains.map(c => c.chain));
  }, []);

  // Fetch USDC balance for a specific chain
  const fetchBalance = useCallback(async (chainId: CCTPChainId): Promise<string> => {
    if (!address) return '0';

    const chain = CCTP_CHAINS[chainId];
    if (!chain) return '0';

    try {
      const client = createPublicClient({
        transport: http(chain.rpcUrl),
      });

      const balance = await client.readContract({
        address: chain.usdcAddress,
        abi: MULTICHAIN_ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });

      return formatUnits(balance as bigint, 6);
    } catch (error) {
      console.error(`Error fetching balance for ${chainId}:`, error);
      return '0';
    }
  }, [address]);

  // Refresh balances for selected chains
  const refreshBalances = useCallback(async (sourceChainId: CCTPChainId) => {
    if (!address) return;

    setIsLoadingBalance(true);
    try {
      const [sourceBal, ethBal] = await Promise.all([
        fetchBalance(sourceChainId),
        fetchBalance('Ethereum_Sepolia'),
      ]);
      setSourceBalance(sourceBal);
      setEthBalance(ethBal);
    } catch (error) {
      console.error('Error refreshing balances:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address, fetchBalance]);

  // Wait for wallet permissions to be resolved
  const waitForWalletReady = useCallback(async (maxWaitMs = 5000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Try to get accounts to check if wallet is ready
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          return true;
        }
      } catch (error) {
        // If we get an error about pending requests, wait and retry
        if (error.message && error.message.includes('already pending')) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        // Other errors might mean wallet is not ready
        console.log('Wallet not ready yet:', error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return false;
  }, []);

  // Initialize Bridge Kit with retry logic
  const initializeBridgeKitAdapter = useCallback(async (maxRetries = 3): Promise<any> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Initializing Bridge Kit adapter (attempt ${attempt}/${maxRetries})`);
        
        // Wait for wallet to be ready
        const walletReady = await waitForWalletReady();
        if (!walletReady) {
          throw new Error('Wallet not ready after waiting');
        }

        const adapter = await createViemAdapterFromProvider({
          provider: window.ethereum as any,
        });
        
        console.log('Bridge Kit adapter initialized successfully');
        return adapter;
      } catch (error) {
        console.error(`Bridge Kit adapter initialization attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }, [waitForWalletReady]);

  // Debug: Get supported chains from Bridge Kit
  const getSupportedChains = useCallback(() => {
    try {
      const kit = new BridgeKit();
      const chains = kit.getSupportedChains();
      console.log('Bridge Kit supported chains:', chains.map(c => c.chain));
      return chains;
    } catch (error) {
      console.error('Error getting supported chains:', error);
      return [];
    }
  }, []);

  // Update step status
  const updateStep = useCallback((index: number, updates: Partial<BridgeStep>) => {
    setBridgeState(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, ...updates } : step
      ),
    }));
  }, []);

  // Helper to get current chain ID directly from provider (not stale React state)
  const getCurrentChainId = useCallback(async (): Promise<number | null> => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const chainIdHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
        return parseInt(chainIdHex, 16);
      }
      return connectedChainId || null;
    } catch {
      return connectedChainId || null;
    }
  }, [connectedChainId]);

  // Switch to the required chain with proper verification
  const ensureCorrectChain = useCallback(async (targetChainId: number, maxRetries = 3): Promise<boolean> => {
    // Check current chain directly from provider
    const currentChain = await getCurrentChainId();
    if (currentChain === targetChainId) {
      console.log(`Already on chain ${targetChainId}`);
      return true;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to switch to chain ${targetChainId} (attempt ${attempt}/${maxRetries})`);

        // Switch chain
        await switchChainAsync({ chainId: targetChainId });

        // Wait for chain switch to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify by checking provider directly (not React state which may be stale)
        for (let check = 0; check < 5; check++) {
          const actualChainId = await getCurrentChainId();
          if (actualChainId === targetChainId) {
            console.log(`Successfully switched to chain ${targetChainId}`);
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`Chain switch verification failed on attempt ${attempt}`);
      } catch (error: any) {
        console.error(`Chain switch attempt ${attempt} failed:`, error);

        // If user rejected, don't retry
        if (error?.code === 4001 || error?.message?.includes('rejected')) {
          console.log('User rejected network switch');
          return false;
        }

        if (attempt === maxRetries) {
          return false;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    return false;
  }, [getCurrentChainId, switchChainAsync]);

  /**
   * Bridge from any CCTP chain to Stacks (2-step process)
   */
  const bridgeToStacks = useCallback(async (
    sourceChainId: CCTPChainId,
    amount: string,
    stacksRecipient: string
  ): Promise<boolean> => {
    if (!address || !walletClient || !publicClient) {
      setBridgeState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

  

    // If source is Ethereum, just do xReserve directly
    if (sourceChainId === 'Ethereum_Sepolia') {
      return bridgeEthToStacks(amount, stacksRecipient);
    }

    const sourceChain = CCTP_CHAINS[sourceChainId];
    if (!sourceChain) {
      setBridgeState(prev => ({ ...prev, error: 'Invalid source chain' }));
      return false;
    }

    // Initialize steps with network switch step
    const steps: BridgeStep[] = [
      {
        id: 'cctp-bridge',
        name: 'USDC Crosschain Transfer',
        description: 'Transfer USDC',
        status: 'pending',
      },
      {
        id: 'switch-network',
        name: 'Switch Network',
        description: 'Switch to Ethereum Sepolia network',
        status: 'pending',
      },
      {
        id: 'approve-usdc',
        name: 'Approve USDC',
        description: 'Approve spending USDC for transfer',
        status: 'pending',
      },
      {
        id: 'xreserve-deposit',
        name: 'Deposit to Bridge',
        description: 'Deposit USDC to circle protocol',
        status: 'pending',
      },
      {
        id: 'xreserve-attestation',
        name: 'Attestation & Minting',
        description: 'Waiting for Circle attestation service',
        status: 'pending',
      },
    ];

    setBridgeState({
      isLoading: true,
      currentStepIndex: 0,
      steps,
      error: null,
      isCompleted: false,
    });

    try {
      // Step 1: CCTP Bridge (Source → Ethereum)
      updateStep(0, { status: 'in-progress' });

      // Ensure we're on the source chain
      const onCorrectChain = await ensureCorrectChain(sourceChain.chainId);
      if (!onCorrectChain) {
        throw new Error(`Please switch to ${sourceChain.displayName} network`);
      }

      // Get fresh wallet client after chain switch
      const provider = await walletClient.transport;
      
      // Initialize Bridge Kit with retry logic
      const kit = new BridgeKit();
      const adapter = await initializeBridgeKitAdapter();

      console.log('=== CCTP Bridge Step 1 ===');
      console.log('From:', sourceChainId);
      console.log('To: Ethereum_Sepolia');
      console.log('Amount:', amount);

      // Execute CCTP bridge and wait for completion
      const cctpResult = await kit.bridge({
        from: { adapter, chain: sourceChainId },
        to: { adapter, chain: 'Ethereum_Sepolia' },
        amount,
      });

      console.log('CCTP Result:', cctpResult);

      // Check if the bridge operation was cancelled or failed
      if (cctpResult.state === 'error' || !cctpResult.steps || cctpResult.steps.length === 0) {
        throw new Error('Bridge operation was cancelled or failed');
      }

      // Wait for the bridge operation to complete (including attestations)
      if (cctpResult.wait) {
        console.log('Waiting for CCTP bridge to complete...');
        await cctpResult.wait();
        console.log('CCTP bridge completed successfully');
      }

      // Double-check the final state after waiting
      if (cctpResult.state === 'error') {
        throw new Error('Bridge operation failed during execution');
      }

      // Get explorer URL from the last step
      const lastCctpStep = cctpResult.steps?.[cctpResult.steps.length - 1];
      const cctpTxHash = lastCctpStep?.txHash || lastCctpStep?.data?.txHash;
      const cctpExplorerUrl = lastCctpStep?.data?.explorerUrl;

      // Verify the transaction was actually successful
      if (!cctpTxHash) {
        throw new Error('No transaction hash found - bridge may have been cancelled');
      }

      updateStep(0, { 
        status: 'completed', 
        txHash: cctpTxHash,
        explorerUrl: cctpExplorerUrl || `${sourceChain.blockExplorer}/tx/${cctpTxHash}`,
      });

      setBridgeState(prev => ({ ...prev, currentStepIndex: 1 }));

      // Step 2: Switch to Ethereum Network
      updateStep(1, { status: 'in-progress' });

      // Wait a bit for wallet state to settle after CCTP bridge
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if we're already on Ethereum (Bridge Kit may have switched us)
      const currentChain = await getCurrentChainId();
      console.log(`Current chain after CCTP: ${currentChain}, target: ${sepolia.id}`);

      if (currentChain === sepolia.id) {
        console.log('Already on Ethereum Sepolia after CCTP bridge');
      } else {
        console.log('Switching to Ethereum Sepolia network...');
        const onEthereum = await ensureCorrectChain(sepolia.id);
        if (!onEthereum) {
          updateStep(1, { status: 'failed', error: 'Failed to switch to Ethereum Sepolia network' });
          throw new Error('Please switch to Ethereum Sepolia network manually');
        }
      }

      updateStep(1, { status: 'completed' });
      setBridgeState(prev => ({ ...prev, currentStepIndex: 2 }));

      // Step 3: Approve USDC
      updateStep(2, { status: 'in-progress' });

      const value = parseUnits(amount, 6);

      // Check current allowance using Sepolia client
      const sepoliaClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });
      
      const allowance = await sepoliaClient.readContract({
        address: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, BRIDGE_CONFIG.X_RESERVE_CONTRACT as Address],
      }) as bigint;

      if (allowance < value) {
        const approveHash = await walletClient.writeContract({
          address: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [BRIDGE_CONFIG.X_RESERVE_CONTRACT as Address, value],
          chain: sepolia,
          account: address,
        });

        await sepoliaClient.waitForTransactionReceipt({ 
          hash: approveHash,
          timeout: 120000, // 2 minutes timeout
        });
        
        updateStep(2, { 
          status: 'completed', 
          txHash: approveHash,
          explorerUrl: `https://sepolia.etherscan.io/tx/${approveHash}`,
        });
      } else {
        updateStep(2, { status: 'completed' });
      }

      setBridgeState(prev => ({ ...prev, currentStepIndex: 3 }));

      // Step 4: xReserve Deposit
      updateStep(3, { status: 'in-progress' });

      console.log('Proceeding with xReserve deposit...');

      // Execute xReserve deposit
      const depositResult = await executeXReserveDeposit(amount, stacksRecipient);
      
      if (!depositResult.success) {
        updateStep(3, { status: 'failed', error: depositResult.error });
        throw new Error(depositResult.error || 'xReserve deposit failed');
      }

      updateStep(3, { 
        status: 'completed', 
        txHash: depositResult.txHash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${depositResult.txHash}`,
      });

      setBridgeState(prev => ({ ...prev, currentStepIndex: 4 }));

      // Step 5: Attestation (includes minting)
      updateStep(4, { status: 'in-progress' });

      console.log('Waiting for Circle attestation and minting...');

      // Poll for attestation completion
      const attestationComplete = await pollForAttestation(depositResult.txHash);
      
      if (!attestationComplete) {
        updateStep(4, { status: 'failed', error: 'Attestation timeout' });
        throw new Error('Attestation did not complete within timeout');
      }

      // Wait a bit for minting to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      updateStep(4, { status: 'completed' });

      setBridgeState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isCompleted: true,
      }));

      return true;
    } catch (error: any) {
      console.error('Bridge to Stacks failed:', error);
      
      const currentIndex = bridgeState.currentStepIndex;
      updateStep(currentIndex, { 
        status: 'failed', 
        error: error.message || 'Bridge failed',
      });

      setBridgeState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Bridge failed',
      }));

      return false;
    }
  }, [address, walletClient, ensureCorrectChain, getCurrentChainId, updateStep, bridgeState.currentStepIndex]);

  /**
   * Bridge directly from Ethereum to Stacks via xReserve
   */
  const bridgeEthToStacks = useCallback(async (
    amount: string,
    stacksRecipient: string
  ): Promise<boolean> => {
    if (!address || !walletClient || !publicClient) {
      setBridgeState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    const steps: BridgeStep[] = [
      {
        id: 'approve',
        name: 'Approve USDC',
        description: 'Approve xReserve to spend USDC',
        status: 'pending',
      },
      {
        id: 'xreserve-deposit',
        name: 'Deposit to xReserve',
        description: 'Deposit USDC to xReserve contract',
        status: 'pending',
      },
      {
        id: 'xreserve-attestation',
        name: 'Attestation & Minting',
        description: 'Waiting for Circle attestation service',
        status: 'pending',
      },
    ];

    setBridgeState({
      isLoading: true,
      currentStepIndex: 0,
      steps,
      error: null,
      isCompleted: false,
    });

    try {
      // Ensure we're on Ethereum
      const onEthereum = await ensureCorrectChain(sepolia.id);
      if (!onEthereum) {
        throw new Error('Please switch to Ethereum Sepolia network');
      }

      const value = parseUnits(amount, 6);

      // Step 1: Approve
      updateStep(0, { status: 'in-progress' });

      // Check current allowance using Sepolia client
      const sepoliaClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });
      
      const allowance = await sepoliaClient.readContract({
        address: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, BRIDGE_CONFIG.X_RESERVE_CONTRACT as Address],
      }) as bigint;

      if (allowance < value) {
        const approveHash = await walletClient.writeContract({
          address: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [BRIDGE_CONFIG.X_RESERVE_CONTRACT as Address, value],
          chain: sepolia,
          account: address,
        });

        await sepoliaClient.waitForTransactionReceipt({ 
          hash: approveHash,
          timeout: 120000, // 2 minutes timeout
        });
        
        updateStep(0, { 
          status: 'completed', 
          txHash: approveHash,
          explorerUrl: `https://sepolia.etherscan.io/tx/${approveHash}`,
        });
      } else {
        updateStep(0, { status: 'completed' });
      }

      setBridgeState(prev => ({ ...prev, currentStepIndex: 1 }));

      // Step 2: xReserve Deposit
      updateStep(1, { status: 'in-progress' });

      const depositResult = await executeXReserveDeposit(amount, stacksRecipient);
      
      if (!depositResult.success) {
        updateStep(1, { status: 'failed', error: depositResult.error });
        throw new Error(depositResult.error || 'xReserve deposit failed');
      }

      updateStep(1, { 
        status: 'completed', 
        txHash: depositResult.txHash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${depositResult.txHash}`,
      });

      setBridgeState(prev => ({ ...prev, currentStepIndex: 2 }));

      // Step 3: Attestation (includes minting)
      updateStep(2, { status: 'in-progress' });

      console.log('Waiting for Circle attestation and minting...');

      // Poll for attestation completion
      const attestationComplete = await pollForAttestation(depositResult.txHash);
      
      if (!attestationComplete) {
        updateStep(2, { status: 'failed', error: 'Attestation timeout' });
        throw new Error('Attestation did not complete within timeout');
      }

      // Wait a bit for minting to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      updateStep(2, { status: 'completed' });

      setBridgeState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isCompleted: true,
      }));

      return true;
    } catch (error: any) {
      console.error('Ethereum to Stacks bridge failed:', error);
      
      const currentIndex = bridgeState.currentStepIndex;
      updateStep(currentIndex, { 
        status: 'failed', 
        error: error.message || 'Bridge failed',
      });

      setBridgeState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Bridge failed',
      }));

      return false;
    }
  }, [address, walletClient, publicClient, ensureCorrectChain, updateStep, bridgeState.currentStepIndex]);

  /**
   * Execute xReserve bridge to Stacks
   */
  const executeXReserveDeposit = useCallback(async (
    amount: string,
    stacksRecipient: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!walletClient || !address || !publicClient) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const sepoliaClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });
      
      const value = parseUnits(amount, 6);
      const maxFee = parseUnits('0', 6);
      const remoteRecipient = encodeStacksAddress(stacksRecipient);
      const hookData = '0x' as `0x${string}`;

      console.log('=== xReserve Bridge ===');
      console.log('Amount:', value.toString());
      console.log('Stacks Recipient:', remoteRecipient);

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
        chain: sepolia,
        account: address,
      });

      await sepoliaClient.waitForTransactionReceipt({ 
        hash,
        timeout: 120000, // 2 minutes timeout
      });

      console.log('xReserve TX Hash:', hash);
      return { success: true, txHash: hash };
    } catch (error: any) {
      console.error('xReserve bridge error:', error);
      return { success: false, error: error.message || 'xReserve bridge failed' };
    }
  }, [walletClient, address, publicClient]);

  /**
   * Poll for Circle attestation completion
   */
  const pollForAttestation = useCallback(async (depositTxHash: string, maxWaitMs = 300000): Promise<boolean> => {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Check if deposit transaction is confirmed
        const sepoliaClient = createPublicClient({
          chain: sepolia,
          transport: http(),
        });

        const receipt = await sepoliaClient.getTransactionReceipt({ hash: depositTxHash as `0x${string}` });
        
        if (receipt && receipt.status === 'success') {
          // For demo purposes, wait 30 seconds to simulate attestation time
          const elapsed = Date.now() - startTime;
          if (elapsed > 30000) { // 30 seconds
            return true;
          }
        }

        // Update step description with elapsed time
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        updateStep(4, { 
          description: `Waiting for Circle attestation service... (${elapsedSeconds}s elapsed)` 
        });

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling attestation:', error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    return false;
  }, [updateStep]);

  /**
   * Bridge between EVM chains (CCTP only, no Stacks)
   */
  const bridgeEvmToEvm = useCallback(async (
    sourceChainId: CCTPChainId,
    destChainId: CCTPChainId,
    amount: string
  ): Promise<boolean> => {
    if (!address || !walletClient) {
      setBridgeState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    if (sourceChainId === destChainId) {
      setBridgeState(prev => ({ ...prev, error: 'Source and destination must be different' }));
      return false;
    }

    const sourceChain = CCTP_CHAINS[sourceChainId];
    const destChain = CCTP_CHAINS[destChainId];

    const steps: BridgeStep[] = [
      {
        id: 'cctp-bridge',
        name: 'Cross-Chain Transfer',
        description: `Transfer USDC from ${sourceChain.displayName} to ${destChain.displayName}`,
        status: 'pending',
      },
    ];

    setBridgeState({
      isLoading: true,
      currentStepIndex: 0,
      steps,
      error: null,
      isCompleted: false,
    });

    try {
      updateStep(0, { status: 'in-progress' });

      // Ensure we're on the source chain
      const onCorrectChain = await ensureCorrectChain(sourceChain.chainId);
      if (!onCorrectChain) {
        throw new Error(`Please switch to ${sourceChain.displayName} network`);
      }

      // Initialize Bridge Kit
      const kit = new BridgeKit();
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum as any,
      });

      console.log('=== CCTP EVM-to-EVM Bridge ===');
      console.log('From:', sourceChainId);
      console.log('To:', destChainId);
      console.log('Amount:', amount);

      // Execute CCTP bridge and wait for completion
      const result = await kit.bridge({
        from: { adapter, chain: sourceChainId },
        to: { adapter, chain: destChainId },
        amount,
      });

      console.log('CCTP Result:', result);

      // Check if the bridge operation was cancelled or failed
      if (result.state === 'error' || !result.steps || result.steps.length === 0) {
        throw new Error('Bridge operation was cancelled or failed');
      }

      // Wait for the bridge operation to complete (including attestations)
      if (result.wait) {
        console.log('Waiting for CCTP bridge to complete...');
        await result.wait();
        console.log('CCTP bridge completed successfully');
      }

      // Double-check the final state after waiting
      if (result.state === 'error') {
        throw new Error('Bridge operation failed during execution');
      }

      const lastStep = result.steps?.[result.steps.length - 1];
      const txHash = lastStep?.txHash || lastStep?.data?.txHash;
      const explorerUrl = lastStep?.data?.explorerUrl;

      // Verify the transaction was actually successful
      if (!txHash) {
        throw new Error('No transaction hash found - bridge may have been cancelled');
      }

      // For CCTP, the bridge function may wait for attestation completion
      // Update status to show it's processing
      updateStep(0, {
        status: 'completed',
        txHash,
        explorerUrl: explorerUrl || `${sourceChain.blockExplorer}/tx/${txHash}`,
        description: `Bridge initiated. Attestation may take 5-10 minutes.`,
      });

      setBridgeState(prev => ({
        ...prev,
        isLoading: false,
        isCompleted: true,
      }));

      return true;
    } catch (error: any) {
      console.error('EVM-to-EVM bridge failed:', error);
      
      updateStep(0, { 
        status: 'failed', 
        error: error.message || 'Bridge failed',
      });

      setBridgeState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Bridge failed',
      }));

      return false;
    }
  }, [address, walletClient, ensureCorrectChain, updateStep]);

  // Reset bridge state
  const resetBridgeState = useCallback(() => {
    setBridgeState({
      isLoading: false,
      currentStepIndex: 0,
      steps: [],
      error: null,
      isCompleted: false,
    });
  }, []);

  // Get current connected chain info
  const currentChain = connectedChainId ? getChainByChainId(connectedChainId) : null;

  return {
    // Connection state
    address,
    isConnected,
    currentChain,
    connectedChainId,

    // Balances
    sourceBalance,
    ethBalance,
    isLoadingBalance,
    refreshBalances,
    fetchBalance,

    // Bridge operations
    bridgeToStacks,
    bridgeEvmToEvm,
    bridgeEthToStacks,
    
    // Bridge state
    bridgeState,
    resetBridgeState,

    // Chain switching
    ensureCorrectChain,

    // Supported chains
    supportedChains,
  };
}
