import { Connection } from '@solana/web3.js';

// Create a Connection instance for RPC calls
export const connection = new Connection(`https://devnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY}`, 'confirmed');