import { useState, useCallback, useRef, useEffect } from 'react';

export type BridgeStatus = 
  | 'idle'
  | 'depositing'        // Ethereum tx pending
  | 'eth_confirmed'     // Ethereum tx confirmed, waiting for attestation
  | 'attesting'         // Attestation in progress
  | 'minting'           // Stacks mint tx detected
  | 'completed'         // USDCx received
  | 'error';

interface BridgeStatusState {
  status: BridgeStatus;
  ethTxHash: string | null;
  stacksTxHash: string | null;
  errorMessage: string | null;
  startTime: number | null;
  elapsedTime: number;
}

// USDCx contract on testnet
const USDCX_CONTRACT = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx';
const USDCX_V1_CONTRACT = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1';

export function useBridgeStatus() {
  const [state, setState] = useState<BridgeStatusState>({
    status: 'idle',
    ethTxHash: null,
    stacksTxHash: null,
    errorMessage: null,
    startTime: null,
    elapsedTime: 0,
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialBalanceRef = useRef<string | null>(null);

  // Update elapsed time every second
  useEffect(() => {
    if (state.startTime && state.status !== 'completed' && state.status !== 'error' && state.status !== 'idle') {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000)
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.startTime, state.status]);

  // Check if USDCx balance has increased for a specific address
  const checkUsdcxBalance = useCallback(async (stacksAddress: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${stacksAddress}/balances`
      );
      const data = await response.json();
      
      const usdcxKey = `${USDCX_CONTRACT}::usdcx-token`;
      const balance = data.fungible_tokens?.[usdcxKey]?.balance || '0';
      return balance;
    } catch (error) {
      console.error('Error checking USDCx balance:', error);
      return '0';
    }
  }, []);

  // Check recent transactions on Stacks for mint events
  const checkStacksMintTx = useCallback(async (stacksAddress: string): Promise<string | null> => {
    try {
      // Check recent transactions to the usdcx-v1 contract
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${stacksAddress}/transactions?limit=10`
      );
      const data = await response.json();
      
      // Look for recent mint transactions
      for (const tx of data.results || []) {
        if (tx.tx_type === 'contract_call' && 
            tx.contract_call?.contract_id === USDCX_V1_CONTRACT &&
            tx.contract_call?.function_name === 'mint') {
          return tx.tx_id;
        }
      }
      
      // Also check pending transactions
      const pendingResponse = await fetch(
        `https://api.testnet.hiro.so/extended/v1/tx/mempool?recipient_address=${stacksAddress}&limit=20`
      );
      const pendingData = await pendingResponse.json();
      
      for (const tx of pendingData.results || []) {
        if (tx.contract_call?.contract_id === USDCX_V1_CONTRACT) {
          return tx.tx_id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking Stacks mint tx:', error);
      return null;
    }
  }, []);

  // Start monitoring bridge status
  const startMonitoring = useCallback(async (
    ethTxHash: string,
    stacksAddress: string,
    expectedAmount: string
  ) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Get initial balance
    initialBalanceRef.current = await checkUsdcxBalance(stacksAddress);
    
    setState({
      status: 'eth_confirmed',
      ethTxHash,
      stacksTxHash: null,
      errorMessage: null,
      startTime: Date.now(),
      elapsedTime: 0,
    });

    // Start polling for Stacks transaction/balance
    let pollCount = 0;
    const maxPolls = 120; // Poll for up to 20 minutes (10 second intervals)
    
    pollingRef.current = setInterval(async () => {
      pollCount++;
      
      // Check for mint transaction
      const mintTxHash = await checkStacksMintTx(stacksAddress);
      if (mintTxHash) {
        setState(prev => ({
          ...prev,
          status: 'minting',
          stacksTxHash: mintTxHash,
        }));
      }
      
      // Check if balance increased
      const currentBalance = await checkUsdcxBalance(stacksAddress);
      const initialBalance = initialBalanceRef.current || '0';
      
      if (BigInt(currentBalance) > BigInt(initialBalance)) {
        // Bridge completed!
        setState(prev => ({
          ...prev,
          status: 'completed',
          stacksTxHash: mintTxHash || prev.stacksTxHash,
        }));
        
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }
      
      // Update status based on elapsed time
      setState(prev => {
        if (prev.status === 'eth_confirmed' && prev.elapsedTime > 30) {
          return { ...prev, status: 'attesting' };
        }
        return prev;
      });
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        setState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: 'Bridge timeout - please check Stacks explorer manually',
        }));
        
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 10000); // Poll every 10 seconds
    
  }, [checkUsdcxBalance, checkStacksMintTx]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset status
  const reset = useCallback(() => {
    stopMonitoring();
    setState({
      status: 'idle',
      ethTxHash: null,
      stacksTxHash: null,
      errorMessage: null,
      startTime: null,
      elapsedTime: 0,
    });
    initialBalanceRef.current = null;
  }, [stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Format elapsed time
  const formatElapsedTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    formatElapsedTime,
    startMonitoring,
    stopMonitoring,
    reset,
  };
}
