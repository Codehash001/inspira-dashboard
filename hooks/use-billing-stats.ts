import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';

type PlanPrice = {
  inspi: number;
  usdt: number;
}

type Plan = {
  credits: number;
  price: PlanPrice;
}

type CreditBalance = {
  credits: number;
  remaining: number;
  used: number;
  expiredDate: string;
}

type BillingStats = {
  currentPlan: string;
  lastFreeClaim: string | null;
  creditBalance: CreditBalance | null;
  totalCreditsUsed: number;
  plans: {
    free: Plan;
    pro: Plan;
    ultra: Plan;
  };
  additionalCredits: {
    amount: number;
    price: PlanPrice;
  };
  recentTransactions: any[];
}

const defaultStats: BillingStats = {
  currentPlan: 'none',
  lastFreeClaim: null,
  creditBalance: null,
  totalCreditsUsed: 0,
  plans: {
    free: { credits: 0, price: { inspi: 0, usdt: 0 } },
    pro: { credits: 0, price: { inspi: 0, usdt: 0 } },
    ultra: { credits: 0, price: { inspi: 0, usdt: 0 } }
  },
  additionalCredits: {
    amount: 0,
    price: { inspi: 0, usdt: 0 }
  },
  recentTransactions: []
};

export function useBillingStats() {
  const { address } = useWallet();
  const [stats, setStats] = useState<BillingStats>(defaultStats);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/stats?walletId=${address}`);
      const data = await response.json();
      
      if (!data.error) {
        setStats(data);
      } else {
        console.error('Error fetching billing stats:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch billing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats when wallet connects
  useEffect(() => {
    fetchStats();
  }, [address]);

  // Refresh stats every minute
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(fetchStats, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [address]);

  return { ...stats, loading, refetchStats: fetchStats };
}
