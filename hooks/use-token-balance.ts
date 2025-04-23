import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';
import { ethers } from 'ethers';

export function useTokenBalance() {
  const { address, signer } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!address || !signer) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/blockchain/balance?walletId=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.data.balance);
      } else {
        console.error('Error fetching INSPI balance:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch INSPI balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch balance when wallet connects
  useEffect(() => {
    fetchBalance();
  }, [address, signer]);

  // Refresh balance every minute
  useEffect(() => {
    if (!address || !signer) return;

    const interval = setInterval(fetchBalance, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [address, signer]);

  return { balance, loading, refetchBalance: fetchBalance };
}
