import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';

interface CreditUsageData {
  name: string;
  credits: number;
}

interface DashboardAnalytics {
  totalUsers: number;
  creditUsageData: CreditUsageData[];
  monthlyCreditsUsed: number;
  userPlan: string;
  loading: boolean;
}

export function useDashboardAnalytics() {
  const { address } = useWallet();
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalUsers: 0,
    creditUsageData: [],
    monthlyCreditsUsed: 0,
    userPlan: 'Free',
    loading: true
  });

  const fetchAnalytics = async () => {
    if (!address) {
      setAnalytics(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/analytics?walletId=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard analytics');
      }
      
      const data = await response.json();
      setAnalytics({
        totalUsers: data.totalUsers,
        creditUsageData: data.creditUsageData,
        monthlyCreditsUsed: data.monthlyCreditsUsed,
        userPlan: data.userPlan,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      setAnalytics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (address) {
      fetchAnalytics();
    }
  }, [address]);

  return analytics;
}
