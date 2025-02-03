"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sun, Moon, Wallet, Plus, Bell, Coins, Wallet2, LogOut, Menu } from "lucide-react"
import { useWallet } from "@/lib/use-wallet"
import { ethers } from 'ethers'
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json'

const SUBSCRIPTION_ADDRESS = '0xeb87cF1b3974c647f7D18a879e9EC863b5773337'

interface HeaderProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export function Header({
  isOpen,
  setIsOpen
}: {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}) {
  const { theme, setTheme } = useTheme()
  const { connect, disconnect, isConnected, shortenAddress, address, signer } = useWallet()
  const [subscription, setSubscription] = useState<{
    planType: number;
    subscribedAt: number;
    credits: number;
  } | null>(null);

  useEffect(() => {
    if (signer && address) {
      fetchSubscriptionDetails();
    }
  }, [signer, address]);

  const fetchSubscriptionDetails = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );
      const sub = await contract.getUserSubscription(address);
      setSubscription({
        planType: Number(sub[0]),
        subscribedAt: Number(sub[1]),
        credits: Number(sub[2]),
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const getPlanName = (planType: number) => {
    return planType === 0 ? 'Pro Plan' : 'Ultra Plan';
  };

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
                    <span className="text-xs text-[hsl(var(--theme-muted))]">Credits:</span>
                    <span className="text-sm font-medium bg-gradient-to-r from-[hsl(var(--theme-primary))] to-[hsl(var(--theme-secondary))] bg-clip-text text-transparent">
                      {subscription.credits}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {getPlanName(subscription.planType)}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notification */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-lg hover:bg-[hsl(var(--theme-primary))]/5 hidden sm:inline-flex"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--theme-primary))] text-[10px] font-medium text-[hsl(var(--theme-bg))]">
              3
            </span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-[hsl(var(--theme-primary))]/5"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Connect Wallet */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[hsl(var(--theme-primary))]/20 text-[hsl(var(--theme-primary))] truncate max-w-[140px] sm:max-w-none"
              >
                <Wallet2 className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{shortenAddress}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg hover:bg-red-500/10 hover:text-red-500"
                onClick={() => disconnect()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => connect()}
              className="bg-gradient-to-r from-[hsl(var(--theme-primary))] to-[hsl(var(--theme-secondary))] text-[hsl(var(--theme-bg))] hover:opacity-90"
              size="sm"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
