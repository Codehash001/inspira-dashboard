import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';

export function useCredits() {
  const { address } = useWallet();
  const [credits, setCredits] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCredits = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/credits?walletId=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setCredits(data.data.totalCredits);
        // Get the earliest expiry date from active balances
        if (data.data.activeBalances.length > 0) {
          const earliestExpiry = new Date(data.data.activeBalances[0].expiredDate);
          setExpiryDate(earliestExpiry);
        } else {
          setExpiryDate(null);
        }
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

    const interval = setInterval(fetchCredits, 10000); // 1 minute
    return () => clearInterval(interval);
  }, [address]);

  return { credits, expiryDate, loading, refetchCredits: fetchCredits };
}
