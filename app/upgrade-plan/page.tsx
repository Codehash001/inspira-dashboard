'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';
import { ethers } from 'ethers';
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, Coins, Clock, HeadphonesIcon, CircleDollarSign, Gift, CircleStop, Star, Wallet } from "lucide-react";
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json';
import { Badge} from "@/components/ui/badge";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/use-credits';
import { Check } from "lucide-react";
import { formatCredits } from "@/lib/format-credits"
import Footer from "@/components/footer"
import { formatEther, formatUnits, parseEther, parseUnits } from 'ethers';
import { format } from 'date-fns';

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
  
  const [additionalCreditsInfo, setAdditionalCreditsInfo] = useState<{
    credits: number;
    inspiPrice: string;
    usdtPrice: string;
  } | null>(null);

  const { address, signer } = useWallet();
  const { credits, expiryDate, loading: creditsLoading, refetchCredits } = useCredits();
  const [hasClaimedFree, setHasClaimedFree] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    planType: number;
    subscribedAt: number;
    credits: number;
  } | null>(null);
  const [canClaimFree, setCanClaimFree] = useState(false);

  useEffect(() => {
    if (signer) {
      fetchPlanDetails();
      checkFreeClaimEligibility();
      fetchAdditionalCreditsInfo();
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

  const fetchAdditionalCreditsInfo = async () => {
    if (!signer) return;

    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      // These are immutable values in the contract
      const [credits, inspiPrice, usdtPrice] = await Promise.all([
        contract.ADDITIONAL_CREDITS(),
        contract.ADDITIONAL_CREDITS_INSPI_PRICE(),
        contract.ADDITIONAL_CREDITS_USDT_PRICE()
      ]);

      setAdditionalCreditsInfo({
        credits: Number(credits),
        inspiPrice: formatEther(inspiPrice), // 18 decimals for INSPI
        usdtPrice: formatUnits(usdtPrice, 6) // 6 decimals for USDT
      });
    } catch (error) {
      console.error('Error fetching additional credits info:', error);
    }
  };

  const fetchSubscriptionDetails = async () => {
    if (!address || !signer) return;

    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      const sub = await contract.getUserSubscription(address);
      console.log('Current subscription:', {
        planType: Number(sub.planType),
        subscribedAt: Number(sub.subscribedAt),
        expiresAt: Number(sub.expiresAt),
        isActive: sub.isActive,
        credits: Number(sub.credits)
      });

      setCurrentSubscription({
        planType: Number(sub.planType),
        subscribedAt: Number(sub.subscribedAt),
        credits: Number(sub.credits)
      });

      // Log button state variables
      console.log('Button state variables:', {
        loading,
        canClaimFree,
        currentSubscriptionPlanType: Number(sub.planType),
        buttonDisabled: loading || !canClaimFree || Number(sub.planType) === 0
      });
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };

  const checkFreeClaimEligibility = async () => {
    if (!signer || !address) {
      console.log('No signer or address available');
      return;
    }

    try {
      console.log('Checking eligibility for address:', address);
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      console.log('Contract instance created');
      
      // Get both subscription details and claimed status
      const [sub, claimed] = await Promise.all([
        contract.getUserSubscription(address),
        contract.hasClaimedFree(address)
      ]);

      const canClaimFree = !sub.isActive && 
        (!claimed || (Number(sub.planType) === 0 && Number(sub.expiresAt) * 1000 <= Date.now()));

      setHasClaimedFree(claimed);
      setCanClaimFree(canClaimFree);

      console.log('Free claim eligibility:', {
        hasActiveSubscription: sub.isActive,
        hasClaimedFree: claimed,
        planType: Number(sub.planType),
        expiresAt: new Date(Number(sub.expiresAt) * 1000).toISOString(),
        currentTime: new Date().toISOString(),
        canClaimFree
      });

    } catch (error) {
      console.error('Error checking free claim eligibility:', error);
      setCanClaimFree(false);
    }
  };

  const refreshUserState = async () => {
    if (!address) return;
    
    // Fetch latest credits
    const creditsResponse = await fetch(`/api/credits?walletId=${address}`);
    const creditsData = await creditsResponse.json();
    console.log('Latest credits data:', creditsData);

    // Refresh other states
    await fetchSubscriptionDetails();
    await refetchCredits();
    await checkFreeClaimEligibility();
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

      // Validate plan type first
      if (planType === 0) {
        toast({
          title: "Invalid plan",
          description: "Cannot subscribe to free plan. Please select Pro or Ultra plan.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Initialize contract just for checking subscription status
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      // Check subscription status from smart contract
      const subscription = await contract.getUserSubscription(address);
      console.log('Current subscription from contract:', subscription);
      
      if (subscription.isActive && subscription.planType !== 0) {
        toast({
          title: "Active Subscription",
          description: "Please unsubscribe from your current plan before subscribing to a different plan.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Get plan details to know how many tokens to approve
      const planDetail = await contract.getPlanDetails(planType);
      const requiredAmount = paymentToken === 'INSPI' ? planDetail.inspiPrice : planDetail.usdtPrice;
      const credits = planDetail.credits;
      
      // Calculate actual payment amount in user's chosen currency
      const paymentAmount = paymentToken === 'INSPI' ? 
        Number(formatEther(requiredAmount)) :  // Convert from wei to INSPI
        Number(formatUnits(requiredAmount, 6));  // Convert from smallest USDT unit to USDT

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
        throw new Error(`Insufficient ${paymentToken} balance. Required: ${formatUnits(requiredAmount, paymentToken === 'INSPI' ? 18 : 6)} ${paymentToken}`);
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
        transactionHash: subscriptionTx.hash,
        paymentToken,
        paymentAmount,
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

      // Update credits with the new value from the API response
      if (responseData.credits) {
        refetchCredits();
      }

      // Refresh all user state
      await refreshUserState();
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

      // Unsubscribe transaction
      const tx = await contract.unsubscribe();
      console.log('Unsubscribe transaction:', tx);

      // Update database
      const requestBody = {
        action: 'unsubscribe',
        walletId: address,
        transactionHash: tx.hash,
        freeCredits: 0  // Explicitly set to 0 for unsubscribe
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
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      toast({
        title: "Successfully unsubscribed",
        description: "You have been unsubscribed from the plan.",
      });

      // Update credits with the new value from the API response
      if (responseData.credits) {
        refetchCredits();
      }

      // Refresh all user state
      await refreshUserState();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error unsubscribing",
        description: error instanceof Error ? error.message : "There was an error while unsubscribing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFreeCredits = async () => {
    if (!address || !signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to claim free credits",
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

      // Check eligibility first
      const sub = await contract.getUserSubscription(address);
      setHasClaimedFree(await contract.hasClaimedFree(address));
      
      if (sub.isActive) {
        toast({
          title: "Active subscription exists",
          description: "You cannot claim free credits while having an active subscription",
          variant: "destructive"
        });
        return;
      }

      if (hasClaimedFree && (Number(sub.planType) !== 0 || Number(sub.expiresAt) * 1000 > Date.now())) {
        toast({
          title: "Not eligible",
          description: "You have already claimed free credits. Please wait for the current plan to expire.",
          variant: "destructive"
        });
        return;
      }

      // Get free plan details
      const freePlanDetails = await contract.getPlanDetails(0);
      const freeCredits = Number(freePlanDetails.credits);

      // Initiate the claim transaction
      const tx = await contract.claimFreePlan();
      console.log('Claim transaction initiated:', tx);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);

      if (!receipt?.hash) {
        throw new Error('Transaction failed - no hash received');
      }

      // Update database
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'claim_free_credits',
          walletId: address,
          transactionHash: receipt.hash, // Using receipt.hash directly
          freeCredits
        }),
      });

      const responseData = await response.json();

      toast({
        title: "Free credits claimed!",
        description: "You have successfully claimed your free credits.",
      });

      // Update credits with the new value from the API response
      if (responseData.credits) {
        refetchCredits();
      }

      // Refresh all user state
      await refreshUserState();
    } catch (error) {
      console.error('Error claiming free credits:', error);
      toast({
        title: "Error claiming free credits",
        description: error instanceof Error ? error.message : "There was an error while claiming free credits. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAdditionalCreditsWithInspi = async () => {
    if (!address || !signer) return;

    try {
      setLoading(true);
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      // Initialize INSPI token contract
      const inspiContract = new ethers.Contract(
        TOKEN_ADDRESS,
        [
          'function balanceOf(address) view returns (uint256)',
          'function allowance(address,address) view returns (uint256)',
          'function approve(address,uint256) returns (bool)'
        ],
        signer
      );

      const inspiPrice = await contract.ADDITIONAL_CREDITS_INSPI_PRICE();

      // Check allowance
      const currentAllowance = await inspiContract.allowance(address, SUBSCRIPTION_ADDRESS);

      // If allowance is insufficient, request approval
      if (currentAllowance < inspiPrice) {
        toast({
          title: "Approval Required",
          description: `Please approve INSPI token spending to continue...`,
        });

        const approveTx = await inspiContract.approve(SUBSCRIPTION_ADDRESS, inspiPrice);
        await approveTx.wait();

        toast({
          title: "Approval Successful",
          description: "Token spending approved. Proceeding with purchase...",
        });
      }

      const tx = await contract.buyAdditionalCreditsWithInspi();
      const receipt = await tx.wait();

      console.log('Transaction Hash:', receipt.hash);

      // Update database
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'buy_credits',
          walletId: address,
          transactionHash: receipt.hash,
          additionalCredits: additionalCreditsInfo?.credits || 20,
          paymentAmount : Number(formatEther(inspiPrice)),
        }),
      });

      const responseData = await response.json();

      toast({
        title: "Credits purchased!",
        description: "You have successfully purchased additional credits with INSPI.",
      });

      // Update credits with the new value from the API response
      if (responseData.credits) {
        refetchCredits();
      }

      // Refresh all user state
      await refreshUserState();
    } catch (error) {
      console.error('Error buying credits with INSPI:', error);
      toast({
        title: "Error buying credits",
        description: "There was an error while buying additional credits with INSPI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleBuyAdditionalCreditsWithUsdt = async () => {
    if (!address || !signer) return;

    try {
      setLoading(true);
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      // Initialize USDT token contract
      const usdtContract = new ethers.Contract(
        USDT_ADDRESS,
        [
          'function balanceOf(address) view returns (uint256)',
          'function allowance(address,address) view returns (uint256)',
          'function approve(address,uint256) returns (bool)'
        ],
        signer
      );

      const usdtPrice = await contract.ADDITIONAL_CREDITS_USDT_PRICE();

      // Check allowance
      const currentAllowance = await usdtContract.allowance(address, SUBSCRIPTION_ADDRESS);

      // If allowance is insufficient, request approval
      if (currentAllowance < usdtPrice) {
        toast({
          title: "Approval Required",
          description: `Please approve USDT token spending to continue...`,
        });

        const approveTx = await usdtContract.approve(SUBSCRIPTION_ADDRESS, usdtPrice);
        await approveTx.wait();

        toast({
          title: "Approval Successful",
          description: "USDT spending approved. Proceeding with purchase...",
        });
      }

      const tx = await contract.buyAdditionalCreditsWithUSDT();
      const receipt = await tx.wait();

      console.log('Transaction Hash:', receipt.hash);

      // Update database
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'buy_credits',
          walletId: address,
          transactionHash: receipt.hash,
          additionalCredits: additionalCreditsInfo?.credits || 20,
          paymentToken: 'USDT',
          paymentAmount: Number(formatUnits(usdtPrice, 6))
        }),
      });

      const responseData = await response.json();

      toast({
        title: "Credits purchased!",
        description: "You have successfully purchased additional credits with USDT.",
      });

      // Update credits with the new value from the API response
      if (responseData.credits) {
        refetchCredits();
      }

      // Refresh all user state
      await refreshUserState();
    } catch (error) {
      console.error('Error buying credits with USDT:', error);
      toast({
        title: "Error buying credits",
        description: "There was an error while buying additional credits with USDT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container w-full py-6 space-y-8">
      <div className="flex-1">
        <div className="flex flex-col gap-4">
          <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--theme-fg))]">Upgrade Plan</h1>
          <p className="text-muted-foreground">
                Upgrade your subscription plan to get more features and benefits.
              </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start justify-center p-3 rounded-lg border-2 border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))]">
              <div className="text-[hsl(var(--theme-fg))] font-semibold text-xl">
                {creditsLoading ? (
                  <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-5 w-5 text-[hsl(var(--theme-primary))]" />
                  {formatCredits(credits)} Credits available
                </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-5 w-5 text-[hsl(var(--theme-primary))]" />
                    {formatCredits(credits)} Credits available
                  </div>
                )}
              </div>
              {expiryDate && (
                <div className="text-[hsl(var(--theme-muted-foreground))] font-medium mt-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Expires at {format(expiryDate, 'MMM d, yyyy')}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 space-y-2">
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
                  disabled={loading || !canClaimFree}
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

        <div className="grid gap-6 lg:grid-cols-3 my-6">
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
                    {plan.isFree ? "0" : formatEther(planDetails[plan.planType]?.inspiPrice || '0')} INSPI
                    <span className="text-sm font-normal text-[hsl(var(--theme-muted-foreground))]">/month</span>
                  </div>
                  {!plan.isFree && planDetails[plan.planType] && (
                    <div className="text-sm text-[hsl(var(--theme-muted-foreground))]">
                      or {formatUnits(planDetails[plan.planType].usdtPrice, 6)} USDT
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {plan.planType === 0 ? (
                    <Button
                      className="w-full bg-[hsl(var(--theme-primary))] text-[hsl(var(--theme-bg))] hover:bg-[hsl(var(--theme-primary))]/90"
                      onClick={handleClaimFreeCredits}
                      disabled={loading || !canClaimFree}
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
        {/* Additional Credits Section */}
        <div className="space-y-4 rounded-lg border border-[hsl(var(--theme-border))] p-6 mt-6">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-semibold text-[hsl(var(--theme-fg))]">Buy Additional Credits</h3>
            <p className="text-sm text-[hsl(var(--theme-fg-subtle))]">Purchase additional credits using INSPI or USDT tokens</p>
          </div>

          {additionalCreditsInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* INSPI Option */}
              <div className="relative space-y-4 p-6 rounded-lg border border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))] hover:border-[hsl(var(--theme-primary))] transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[hsl(var(--theme-primary))]/10">
                      <Coins className="h-5 w-5 text-[hsl(var(--theme-primary))]" />
                    </div>
                    <h4 className="font-semibold text-[hsl(var(--theme-fg))]">Pay with INSPI</h4>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-[hsl(var(--theme-border))]">
                    <div className="flex items-center gap-2 text-[hsl(var(--theme-muted-foreground))]">
                      <Star className="h-4 w-4" />
                      <span>Credits: {additionalCreditsInfo.credits}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[hsl(var(--theme-muted-foreground))]">
                      <Wallet className="h-4 w-4" />
                      <span>Cost: {additionalCreditsInfo.inspiPrice} INSPI</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-[hsl(var(--theme-primary))] text-[hsl(var(--theme-bg))] hover:bg-[hsl(var(--theme-primary))]/90"
                  onClick={handleBuyAdditionalCreditsWithInspi}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Buy with INSPI
                    </div>
                  )}
                </Button>
              </div>

              {/* USDT Option */}
              <div className="relative space-y-4 p-6 rounded-lg border border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))] hover:border-[hsl(var(--theme-primary))] transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[hsl(var(--theme-primary))]/10">
                      <CircleDollarSign className="h-5 w-5 text-[hsl(var(--theme-primary))]" />
                    </div>
                    <h4 className="font-semibold text-[hsl(var(--theme-fg))]">Pay with USDT</h4>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-[hsl(var(--theme-border))]">
                    <div className="flex items-center gap-2 text-[hsl(var(--theme-muted-foreground))]">
                      <Star className="h-4 w-4" />
                      <span>Credits: {additionalCreditsInfo.credits}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[hsl(var(--theme-muted-foreground))]">
                      <Wallet className="h-4 w-4" />
                      <span>Cost: {additionalCreditsInfo.usdtPrice} USDT</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-[hsl(var(--theme-primary))] text-[hsl(var(--theme-bg))] hover:bg-[hsl(var(--theme-primary))]/90"
                  onClick={handleBuyAdditionalCreditsWithUsdt}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4" />
                      Buy with USDT
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
