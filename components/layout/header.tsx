"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sun, Moon, Wallet, Plus, Bell, Coins, Wallet2, LogOut, Menu } from "lucide-react"
import { useWallet } from "@/lib/use-wallet"
import { ethers } from 'ethers'
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json'
import { useCredits } from "@/hooks/use-credits"
import { formatCredits } from "@/lib/format-credits"

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS!;

export function Header({
  isOpen,
  setIsOpen
}: {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}) {
  const { theme, setTheme } = useTheme()
  const { connectWallet, disconnectWallet, isConnected, address, signer } = useWallet()
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    planType: number;
    subscribedAt: number;
    credits: number;
  } | null>(null);

  useEffect(() => {
    if (signer && address) {
      fetchSubscriptionDetails();
      setupEventListeners();
    }
  }, [signer, address]);

  const setupEventListeners = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      // Listen for subscription purchase events
      contract.on("SubscriptionPurchased", (user, planType, credits, timestamp) => {
        if (user.toLowerCase() === address?.toLowerCase()) {
          console.log('Subscription purchased event:', { planType, credits });
          setSubscription(prev => ({
            ...prev!,
            planType: Number(planType),
            credits: Number(credits),
          }));
        }
      });

      // Listen for additional credits purchase events
      contract.on("AdditionalCreditsPurchased", (user, credits, paymentToken) => {
        if (user.toLowerCase() === address?.toLowerCase()) {
          console.log('Additional credits purchased:', credits.toString());
          setSubscription(prev => prev ? {
            ...prev,
            credits: Number(credits) + prev.credits,
          } : null);
        }
      });

      // Listen for unsubscribe events
      contract.on("SubscriptionUnsubscribed", (user, planType) => {
        if (user.toLowerCase() === address?.toLowerCase()) {
          console.log('Subscription unsubscribed event');
          fetchSubscriptionDetails(); // Fetch full details as plan type changes
        }
      });

      // Listen for free plan claims
      contract.on("FreePlanClaimed", (user, credits, expiresAt) => {
        if (user.toLowerCase() === address?.toLowerCase()) {
          console.log('Free plan claimed:', { credits, expiresAt });
          setSubscription(prev => ({
            ...prev!,
            planType: 0, // Free plan
            credits: Number(credits),
          }));
        }
      });

      // Cleanup function to remove event listeners
      return () => {
        contract.removeAllListeners();
      };
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  };

  const fetchSubscriptionDetails = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );
      
      const sub = await contract.getUserSubscription(address);
      console.log('Subscription details:', sub);
      
      setSubscription({
        planType: Number(sub.planType),
        subscribedAt: Number(sub.subscribedAt),
        credits: Number(sub.credits),
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  const getPlanName = (planType: number) => {
    switch(planType) {
      case 0:
        return 'Free Plan';
      case 1:
        return 'Pro Plan';
      case 2:
        return 'Ultra Plan';
      default:
        return 'Unknown Plan';
    }
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      console.log('Starting wallet connection...');
      await connectWallet();
      console.log('Wallet connected successfully');
    } catch (error: any) {
      console.error('Error in handleConnect:', error);
      if (error.code === 4001) {
        alert('Please accept the connection request in MetaMask');
      } else if (error.message?.includes('user rejected')) {
        alert('Please accept the network switch request in MetaMask');
      } else {
        alert('Error connecting wallet. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await disconnectWallet();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setLoading(false);
    }
  };


  const { credits } = useCredits();



 

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))]/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 max-w-full overflow-x-hidden">
        <div className="flex items-center gap-4 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-[hsl(var(--theme-primary))]/5 lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Credits */}
          {isConnected && subscription && (
            <div className="relative hidden sm:block">
              {/* Gradient Border */}
              <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-[hsl(var(--theme-primary))] via-[hsl(var(--theme-secondary))] to-[hsl(var(--theme-primary))] animate-gradient-x" />
              
              {/* Content */}
              <div className="relative flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--theme-bg))]">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[hsl(var(--theme-primary))]" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">
                    {loading ? 'Loading...' : formatCredits(credits)}
                    </span>
                    <span className="text-sm text-[hsl(var(--theme-muted-foreground))]">credits</span>
                  </div>
                </div>
                <div className="h-4 w-[1px] bg-[hsl(var(--theme-border))]" />
                <Badge variant="secondary" className="font-normal">
                  {getPlanName(subscription.planType)}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-[hsl(var(--theme-primary))]/5"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Wallet Connect/Disconnect */}
          {isConnected ? (
            <Button
              variant="ghost"
              className="rounded-lg hover:bg-[hsl(var(--theme-primary))]/5 border"
              onClick={handleDisconnect}
              disabled={loading}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">{shortenAddress(address!)}</span>
            </Button>
          ) : (
            <Button
              variant="default"
              className="rounded-lg"
              onClick={handleConnect}
              disabled={loading}
            >
              <Wallet2 className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">{loading ? "Connecting..." : "Connect Wallet"}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
