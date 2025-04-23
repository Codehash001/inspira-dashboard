import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';

export function useSubscriptionPlan() {
  const { address } = useWallet();
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSubscriptionPlan = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/plan?walletId=${address}`);
      const data = await response.json();

      if (data.success) {
        setPlan(data.data.plan); // Assuming the plan is in data.data.plan
      } else {
        console.error('Error fetching subscription plan:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch subscription plan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription plan when wallet connects
  useEffect(() => {
    fetchSubscriptionPlan();
  }, [address]);

  // Refresh subscription plan every minute
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(fetchSubscriptionPlan, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [address]);

  return { plan, loading, refetchPlan: fetchSubscriptionPlan };
}
