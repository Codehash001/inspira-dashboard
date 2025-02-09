"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Header } from "./header"
import {
  Home,
  Bot,
  BookOpen,
  Image as ImageIcon,
  Video,
  Settings,
  CreditCard,
  HelpCircle,
  History,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User2,
  Sparkle,
} from "lucide-react"
import { useWallet } from "@/lib/use-wallet"
import { ethers } from "ethers"
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json'
import { useCredits } from '@/hooks/use-credits';
import { formatCredits } from "@/lib/format-credits"

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS!;

const plans = [
  { name: "Free Plan", type: 0 },
  { name: "Pro Plan", type: 1 },
  { name: "Ultra Plan", type: 2 },
];

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "AI Chat",
    href: "/chat",
    icon: Bot,
  },
  {
    name: "Book Grading",
    href: "/book-grading",
    icon: BookOpen,
  },
  {
    name: "Image Generation",
    href: "/image-generation",
    icon: ImageIcon,
  },
  {
    name: "Video Generation",
    href: "/video-generation",
    icon: Video,
    comingSoon: false,
  },
]

const secondaryNavigation = [
  {
    name: "Usage History",
    href: "/history",
    icon: History,
  },
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Help & Support",
    href: "/support",
    icon: HelpCircle,
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const { theme } = useTheme()
  const { address, signer } = useWallet()
  const { credits, loading } = useCredits();
  const [subscription, setSubscription] = useState<{
    planType: number;
    subscribedAt: number;
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
          }));
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
      setSubscription({
        planType: Number(sub.planType),
        subscribedAt: Number(sub.subscribedAt),
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--theme-bg))] overflow-x-hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-[100dvh] border-r backdrop-blur-xl transition-all duration-300",
          "border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))]/95",
          isOpen ? "w-[280px]" : "w-[68px]",
          "lg:translate-x-0",
          !isOpen && "lg:w-[68px]",
          !isOpen && "w-[280px]",
          "translate-x-[-100%]",
          isOpen && "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-[hsl(var(--theme-border))] px-4">
            <div className={cn(
              "flex items-center justify-center rounded-lg overflow-hidden transition-all duration-300",
              
            )}>
              <Image
                src="/logo.png"
                alt="Inspira Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <span
              className={cn(
                "ml-3 text-xl font-semibold transition-all duration-300 text-[hsl(var(--theme-fg))]",
                !isOpen && "hidden opacity-0 scale-0"
              )}
            >
              Inspira
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {/* Primary Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name} className="relative group">
                  {item.comingSoon ? (
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors opacity-50 cursor-not-allowed",
                        !isOpen && "justify-center"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", !isOpen && "h-5 w-5")} />
                      <span className={cn("transition-opacity duration-300", !isOpen && "hidden")}>
                        {item.name}
                      </span>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        "hover:bg-[hsl(var(--theme-primary))]/5 hover:text-[hsl(var(--theme-primary))]",
                        pathname === item.href
                          ? "bg-[hsl(var(--theme-primary))]/5 text-[hsl(var(--theme-primary))]"
                          : "text-[hsl(var(--theme-muted))]",
                        !isOpen && "justify-center"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", !isOpen && "h-5 w-5")} />
                      <span className={cn("transition-opacity duration-300", !isOpen && "hidden")}>
                        {item.name}
                      </span>
                    </Link>
                  )}
                  {item.comingSoon && (
                    <div className="absolute right-0 ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-[hsl(var(--theme-fg))]/80 text-[hsl(var(--theme-bg))] rounded text-xs whitespace-nowrap opacity-0 pointer-events-none transition-opacity group-hover:opacity-100">
                      Coming Soon
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Secondary Navigation */}
            <div className="mt-6 pt-6 border-t border-[hsl(var(--theme-border))] space-y-1">
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2  text-sm transition-colors",
                    "hover:bg-[hsl(var(--theme-primary))]/5 hover:text-[hsl(var(--theme-primary))]",
                    pathname === item.href
                      ? "bg-[hsl(var(--theme-primary))]/5 text-[hsl(var(--theme-primary))]"
                      : "text-[hsl(var(--theme-muted))]",
                    !isOpen && "justify-center"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", !isOpen && "h-5 w-5")} />
                  <span className={cn("transition-opacity duration-300", !isOpen && "hidden")}>
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Free Plan */}
          <div className="border-t border-[hsl(var(--theme-border))] p-4 mt-auto">
            {isOpen && (
              <div className="my-1 flex flex-col space-y-1">
                <p className="text-xs font-medium text-[hsl(var(--theme-fg))]">
                  {subscription ? plans[subscription.planType].name : 'Loading...'}
                </p>
                <p className="text-xs text-[hsl(var(--theme-muted))]">
                  {loading ? 'Loading...' : `${formatCredits(credits)} Credits Available`}
                </p>
              </div>
            )}
            {isOpen ? (
              <Link
                href="/upgrade-plan"
                className="block"
              >
                <Button
                  size="sm"
                  className={cn(
                    "w-full",
                    (!subscription || subscription.planType === 0)
                      ? "bg-gradient-to-r from-[hsl(var(--theme-primary))] to-[hsl(var(--theme-secondary))] text-[hsl(var(--theme-bg))] hover:opacity-90"
                      : "border border-[hsl(var(--theme-border))]  hover:opacity-90"
                  )}
                >
                  {(!subscription || subscription.planType === 0) ? 'Upgrade Plan' : 'Manage Plan'}
                </Button>
              </Link>
            )
          
          :

          <Link
                href="/upgrade-plan"
                className="block"
              >
                <Button
                  size="sm"
                  className={cn(
                    "w-full",
                    (!subscription || subscription.planType === 0)
                      ? "bg-gradient-to-r from-[hsl(var(--theme-primary))] to-[hsl(var(--theme-secondary))] text-[hsl(var(--theme-bg))] hover:opacity-90"
                      : "border border-[hsl(var(--theme-border))]  hover:opacity-90"
                  )}
                >
                  <Sparkle className="h-4 w-4 shrink-0" />
                </Button>
              </Link>
          
          }
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "absolute md:-right-3 md:top-12 top-6 right-3 z-[51]  flex items-center justify-center rounded-full transition-all",
              "border bg-[hsl(var(--theme-bg))] border-[hsl(var(--theme-border))]",
              "text-[hsl(var(--theme-muted))] hover:text-[hsl(var(--theme-primary))] hover:border-[hsl(var(--theme-primary))]/30",
              isOpen ? "h-6 w-6" : "h-8 w-8 md:-right-4 -right-12 top-4"
            )}
          >
            {isOpen ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 h-screen flex flex-col",
          "pl-0",
          "lg:pl-[280px]",
          !isOpen && "lg:pl-[68px]"
        )}
      >
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />
        <main className="flex-1 overflow-auto">
          <div className="px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
