import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';

export function useCredits() {
  const { address } = useWallet();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchCredits = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/credits?walletId=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setCredits(data.data.totalCredits);
      } else {
        console.error('Error fetching credits:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch credits when wallet connects
  useEffect(() => {
    fetchCredits();
  }, [address]);

  // Refresh credits every minute
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(fetchCredits, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [address]);

  return { credits, loading, refetchCredits: fetchCredits };
}
