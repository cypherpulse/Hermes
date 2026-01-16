import { useCallback, useState } from 'react';
import { useAccount, useBalance, usePublicClient, useWalletClient, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, type Address, type Hex } from 'viem';
import { sepolia } from 'viem/chains';
import { BRIDGE_CONFIG, ERC20_ABI, X_RESERVE_ABI } from '@/lib/bridge-config';
import { encodeStacksAddress } from '@/lib/stacks-address';

export function useBridge() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [lastDepositTx, setLastDepositTx] = useState<string | null>(null);

  // ETH balance
  const { data: ethBalanceData, refetch: refetchEth } = useBalance({
    address,
  });

  // USDC balance using useReadContract
  const { data: usdcBalanceRaw, refetch: refetchUsdc } = useReadContract({
    address: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const ethBalance = ethBalanceData ? formatUnits(ethBalanceData.value, ethBalanceData.decimals) : '0';
  const usdcBalance = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 6) : '0';

  const refreshBalances = useCallback(() => {
    refetchEth();
    refetchUsdc();
  }, [refetchEth, refetchUsdc]);

  // Check current USDC allowance for xReserve
  const checkAllowance = useCallback(async (): Promise<bigint> => {
    if (!publicClient || !address) return 0n;
    
    const allowance = await publicClient.readContract({
      address: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, BRIDGE_CONFIG.X_RESERVE_CONTRACT as Address],
    });
    
    return allowance as bigint;
  }, [publicClient, address]);

  const approveUSDC = useCallback(async (amount: string): Promise<string | null> => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    const value = parseUnits(amount, 6);

    const hash = await walletClient.writeContract({
      address: BRIDGE_CONFIG.ETH_USDC_CONTRACT as Address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [BRIDGE_CONFIG.X_RESERVE_CONTRACT as Address, value],
      chain: sepolia,
      account: address,
    });

    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }, [walletClient, address, publicClient]);

  const depositToStacks = useCallback(async (
    amount: string,
    stacksRecipient: string
  ): Promise<string | null> => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    const value = parseUnits(amount, 6);
    const maxFee = parseUnits('0', 6);
    const remoteRecipient = encodeStacksAddress(stacksRecipient);
    const hookData = '0x' as Hex;

    // Log for debugging
    console.log('=== Bridge Deposit Debug ===');
    console.log('Amount (raw):', value.toString());
    console.log('Stacks Domain:', BRIDGE_CONFIG.STACKS_DOMAIN);
    console.log('Remote Recipient (encoded):', remoteRecipient);
    console.log('Local Token:', BRIDGE_CONFIG.ETH_USDC_CONTRACT);
    console.log('Max Fee:', maxFee.toString());
    console.log('xReserve Contract:', BRIDGE_CONFIG.X_RESERVE_CONTRACT);

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

    await publicClient.waitForTransactionReceipt({ hash });
    await refreshBalances();
    
    setLastDepositTx(hash);
    console.log('=== Deposit TX Confirmed ===');
    console.log('TX Hash:', hash);
    console.log('View on Etherscan:', `https://sepolia.etherscan.io/tx/${hash}`);

    return hash;
  }, [walletClient, address, publicClient, refreshBalances]);

  return {
    address: address ?? null,
    isConnected,
    ethBalance,
    usdcBalance,
    refreshBalances,
    checkAllowance,
    approveUSDC,
    depositToStacks,
    lastDepositTx,
  };
}
