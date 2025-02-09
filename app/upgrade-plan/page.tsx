'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';
import { ethers } from 'ethers';
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, Coins, Clock, HeadphonesIcon, CircleDollarSign, Gift, CircleStop } from "lucide-react";
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json';
import { Badge} from "@/components/ui/badge";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/use-credits';
import { Check } from "lucide-react";
import { formatCredits } from "@/lib/format-credits"

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS!;
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_INSPI_TOKEN_ADDRESS!;
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_TOKEN_ADDRESS!;

export default function UpgradePlan() {

  const [plans] = useState([
    {
      name: "Free Plan",
      planType: 0,
      features: ["50 Base Credits", "Basic Support", "30 Days Validity"],
      isFree: true
    },
    {
      name: "Pro Plan",
      planType: 1,
      features: ["500 Base Credits", "Basic Support", "30 Days Validity"],
      isFree: false
    },
    {
      name: "Ultra Plan",
      planType: 2,
      features: ["1500 Base Credits", "Priority Support", "30 Days Validity"],
      isFree: false
    }
  ]);
  
  const [planDetails, setPlanDetails] = useState<{
    [key: number]: {
      credits: string;
      inspiPrice: bigint;
      usdtPrice: bigint;
    };
  }>({});
  
  const { address, signer } = useWallet();
  const { credits, loading: creditsLoading, refetchCredits } = useCredits();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    planType: number;
    subscribedAt: number;
    credits: number;
  } | null>(null);

  useEffect(() => {
    if (signer) {
      fetchPlanDetails();
    }
  }, [signer]);

  useEffect(() => {
    if (signer && address) {
      fetchSubscriptionDetails();
    }
  }, [signer, address]);

  const fetchPlanDetails = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      const details = await Promise.all(
        plans.map(async (plan) => {
          const detail = await contract.getPlanDetails(plan.planType);
          return {
            planType: plan.planType,
            credits: detail.credits.toString(),
            inspiPrice: detail.inspiPrice,
            usdtPrice: detail.usdtPrice,
          };
        })
      );

      const detailsMap = details.reduce((acc, detail) => {
        acc[detail.planType] = detail;
        return acc;
      }, {} as any);

      setPlanDetails(detailsMap);
    } catch (error) {
      console.error('Error fetching plan details:', error);
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
      console.log('Raw subscription details in upgrade page:', sub);
      
      // Convert BigInts to numbers properly
      const planType = Number(sub.planType || sub[0]);
      const subscribedAt = Number(sub.subscribedAt || sub[1]);
      const credits = Number(sub.credits || sub[2]);
      
      console.log('Converted subscription values:', { planType, subscribedAt, credits });
      
      setCurrentSubscription({
        planType,
        subscribedAt,
        credits,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (planType: number, paymentToken: 'INSPI' | 'USDT') => {
    if (!address || !signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to subscribe",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Initialize contract with proper interface
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      // Get plan details to know how many tokens to approve
      const planDetail = await contract.getPlanDetails(planType);
      const requiredAmount = paymentToken === 'INSPI' ? planDetail.inspiPrice : planDetail.usdtPrice;
      const credits = planDetail.credits;

      // Initialize token contract
      const tokenContract = new ethers.Contract(
        paymentToken === 'INSPI' ? TOKEN_ADDRESS : USDT_ADDRESS,
        [
          'function balanceOf(address) view returns (uint256)',
          'function allowance(address,address) view returns (uint256)',
          'function approve(address,uint256) returns (bool)'
        ],
        signer
      );

      // Check balance
      const balance = await tokenContract.balanceOf(address);
      if (balance < requiredAmount) {
        throw new Error(`Insufficient ${paymentToken} balance. Required: ${ethers.formatUnits(requiredAmount, paymentToken === 'INSPI' ? 18 : 6)} ${paymentToken}`);
      }

      // Check allowance
      const currentAllowance = await tokenContract.allowance(address, SUBSCRIPTION_ADDRESS);

      // If allowance is insufficient, request approval
      if (currentAllowance < requiredAmount) {
        toast({
          title: "Approval Required",
          description: `Please approve ${paymentToken} token spending to continue...`,
        });

        const approveTx = await tokenContract.approve(SUBSCRIPTION_ADDRESS, requiredAmount);
        await approveTx.wait();

        toast({
          title: "Approval Successful",
          description: "Token spending approved. Proceeding with subscription...",
        });
      }

      // Handle subscription
      let subscriptionTx;
      if (!currentSubscription || currentSubscription.planType === 0) {
        // Subscribe directly if no active subscription or on free plan
        subscriptionTx = await contract[paymentToken === 'INSPI' ? 'subscribeWithInspi' : 'subscribeWithUSDT'](planType);
      } else {
        // Unsubscribe first, then subscribe
        const unsubTx = await contract.unsubscribe();
        await unsubTx.wait();
        
        // Get new subscription transaction
        subscriptionTx = await contract[paymentToken === 'INSPI' ? 'subscribeWithInspi' : 'subscribeWithUSDT'](planType);
      }

      console.log('Subscription transaction:', subscriptionTx);

      // Update database
      const requestBody = {
        action: 'subscribe',
        walletId: address,
        plan: planType === 1 ? 'pro' : 'ultra',
        transactionHash: subscriptionTx.hash, // Get hash directly from transaction
        paymentToken,
        credits: Number(credits)
      };

      console.log('Sending request to API:', requestBody);

      // Wait for transaction confirmation in parallel with API call
      const [response] = await Promise.all([
        fetch('/api/subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }),
        subscriptionTx.wait() // Wait for confirmation in parallel
      ]);

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update subscription');
      }

      toast({
        title: "Successfully subscribed!",
        description: `You are now subscribed to the ${planType === 1 ? 'Pro' : 'Ultra'} plan.`,
      });

      // Refresh subscription status
      await fetchSubscriptionDetails();
      await refetchCredits();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Error subscribing",
        description: error instanceof Error ? error.message : "There was an error while subscribing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!address || !signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to unsubscribe",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      // Get free credits from plan details (plan type 0 is free plan)
      const freePlanDetails = await contract.getPlanDetails(0);
      const freeCredits = Number(freePlanDetails.credits);

      // Unsubscribe transaction
      const tx = await contract.unsubscribe();
      console.log('Unsubscribe transaction:', tx);

      // Update database
      const requestBody = {
        action: 'unsubscribe',
        walletId: address,
        transactionHash: tx.hash,
        freeCredits
      };

      console.log('Sending unsubscribe request:', requestBody);

      // Wait for transaction confirmation in parallel with API call
      const [response] = await Promise.all([
        fetch('/api/subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }),
        tx.wait() // Wait for confirmation in parallel
      ]);

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update subscription');
      }

      toast({
        title: "Successfully unsubscribed",
        description: "You have been unsubscribed from the plan.",
      });

      // Refresh subscription status
      await fetchSubscriptionDetails();
      await refetchCredits();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error unsubscribing",
        description: error instanceof Error ? error.message : "There was an error while unsubscribing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFreeCredits = async () => {
    if (!address || !signer) return

    try {
      setLoading(true)
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      )

      // Get free plan details
      const freePlanDetails = await contract.getPlanDetails(0)
      const freeCredits = Number(freePlanDetails.credits)

      const tx = await contract.claimFreePlan()
      const receipt = await tx.wait()

      // Update database
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'claim_free_credits',
          walletId: address,
          transactionHash: receipt.transactionHash,
          freeCredits
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast({
        title: "Free credits claimed!",
        description: "You have successfully claimed your free credits.",
      })

      // Refresh subscription status
      await fetchSubscriptionDetails();
      await refetchCredits();
    } catch (error) {
      console.error('Error claiming free credits:', error)
      toast({
        title: "Error claiming free credits",
        description: error instanceof Error ? error.message : "There was an error while claiming free credits. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  };

  const handleBuyAdditionalCredits = async () => {
    if (!address || !signer) return

    try {
      setLoading(true)
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      )

      const tx = await contract.buyAdditionalCreditsWithInspi()
      const receipt = await tx.wait()

      // Update database
      await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'buy_credits',
          walletId: address,
          transactionHash: receipt.transactionHash,
        }),
      })

      toast({
        title: "Credits purchased!",
        description: "You have successfully purchased additional credits.",
      })

      // Refresh subscription status
      await fetchSubscriptionDetails();
      await refetchCredits();
    } catch (error) {
      console.error('Error buying credits:', error)
      toast({
        title: "Error buying credits",
        description: "There was an error while buying additional credits. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-[hsl(var(--theme-fg))]">Upgrade Plan</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[hsl(var(--theme-primary))]" />
            <span className="text-sm text-[hsl(var(--theme-muted-foreground))]">
              {creditsLoading ? 'Loading...' : `${formatCredits(credits)} Credits Available`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentSubscription && currentSubscription.planType > 0 && (
              <Button
                variant="outline"
                onClick={handleUnsubscribe}
                disabled={loading}
                className="border-[hsl(var(--theme-border))] text-[hsl(var(--theme-fg))] hover:bg-[hsl(var(--theme-primary))]/5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <CircleStop className="h-4 w-4" />
                    <span>Unsubscribe</span>
                  </div>
                )}
              </Button>
            )}
            {(!currentSubscription || currentSubscription.planType === 0) && (
              <Button
                variant="outline"
                onClick={handleClaimFreeCredits}
                disabled={loading}
                className="border-[hsl(var(--theme-border))] text-[hsl(var(--theme-fg))] hover:bg-[hsl(var(--theme-primary))]/5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    <span>Claim Free Credits</span>
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <div
            key={plan.name}
            className={cn(
              "relative rounded-lg border p-6",
              "border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))]",
              currentSubscription?.planType === index && "ring-2 ring-[hsl(var(--theme-primary))]"
            )}
          >
            {currentSubscription?.planType === index && (
              <Badge
                className="absolute -top-2.5 left-4 bg-[hsl(var(--theme-primary))] hover:bg-[hsl(var(--theme-primary))]"
              >
                Current Plan
              </Badge>
            )}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[hsl(var(--theme-fg))]">{plan.name}</h3>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-[hsl(var(--theme-fg))]">
                  {plan.isFree ? "0" : ethers.formatUnits(planDetails[plan.planType]?.inspiPrice || '0', 18)} INSPI
                  <span className="text-sm font-normal text-[hsl(var(--theme-muted-foreground))]">/month</span>
                </div>
                {!plan.isFree && planDetails[plan.planType] && (
                  <div className="text-sm text-[hsl(var(--theme-muted-foreground))]">
                    or {ethers.formatUnits(planDetails[plan.planType].usdtPrice, 6)} USDT
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {plan.planType === 0 ? (
                  <Button
                    className="w-full bg-[hsl(var(--theme-primary))] text-[hsl(var(--theme-bg))] hover:bg-[hsl(var(--theme-primary))]/90"
                    onClick={handleClaimFreeCredits}
                    disabled={loading || currentSubscription?.planType === index}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        <span>Claim Free Credits</span>
                      </div>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-[hsl(var(--theme-primary))] text-[hsl(var(--theme-bg))] hover:bg-[hsl(var(--theme-primary))]/90"
                      onClick={() => handleSubscribe(index, 'INSPI')}
                      disabled={loading || currentSubscription?.planType === index}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4" />
                          <span>Subscribe with INSPI</span>
                        </div>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-[hsl(var(--theme-border))] text-[hsl(var(--theme-fg))] hover:bg-[hsl(var(--theme-primary))]/5"
                      onClick={() => handleSubscribe(index, 'USDT')}
                      disabled={loading || currentSubscription?.planType === index}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="h-4 w-4" />
                          <span>Subscribe with USDT</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <ul className="space-y-2 text-sm text-[hsl(var(--theme-muted-foreground))]">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-[hsl(var(--theme-primary))] mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <Button
        className="w-full"
        onClick={handleBuyAdditionalCredits}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Buy Additional Credits'
        )}
      </Button>
    </div>
  );
}
