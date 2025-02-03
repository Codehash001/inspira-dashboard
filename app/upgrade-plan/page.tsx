'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/use-wallet';
import { ethers } from 'ethers';
import { useToast } from "@/hooks/use-toast"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json';

const SUBSCRIPTION_ADDRESS = '0xeb87cF1b3974c647f7D18a879e9EC863b5773337';
const TOKEN_ADDRESS = '0x74cAb5578a9E900a01F226E0A09c8F26039F0142';
const USDT_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';

const plans = [
  {
    name: 'Pro Plan',
    planType: 0, // PlanType.Pro
    features: ['500 Base Credits', 'Basic Support', '30 Days Validity'],
  },
  {
    name: 'Ultra Plan',
    planType: 1, // PlanType.Ultra
    features: ['1500 Base Credits', 'Priority Support', '30 Days Validity'],
  }
];

export default function UpgradePlan() {
  const { address, signer } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    planType: number;
    subscribedAt: number;
    credits: number;
  } | null>(null);
  const [planDetails, setPlanDetails] = useState<{
    [key: number]: {
      credits: number;
      inspiPrice: string;
      usdtPrice: string;
    };
  }>({});

  useEffect(() => {
    if (signer && address) {
      fetchSubscriptionDetails();
      fetchPlanDetails();
    }
  }, [signer, address]);

  const fetchSubscriptionDetails = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );
      const subscription = await contract.getUserSubscription(address);
      setCurrentSubscription({
        planType: Number(subscription[0]),
        subscribedAt: Number(subscription[1]),
        credits: Number(subscription[2]),
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchPlanDetails = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );
      
      const details: { [key: number]: any } = {};
      for (const plan of plans) {
        const planDetail = await contract.getPlanDetails(plan.planType);
        details[plan.planType] = {
          credits: Number(planDetail[0]),
          inspiPrice: ethers.formatUnits(planDetail[1], 18),
          usdtPrice: ethers.formatUnits(planDetail[2], 6),
        };
      }
      setPlanDetails(details);
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const handleSubscribe = async (planType: number, paymentToken: 'INSPI' | 'USDT') => {
    if (!signer || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
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

      // First approve the token spending
      const tokenContract = new ethers.Contract(
        paymentToken === 'INSPI' ? TOKEN_ADDRESS : USDT_ADDRESS,
        ['function approve(address spender, uint256 amount) public returns (bool)'],
        signer
      );

      const planDetail = planDetails[planType];
      const amount = ethers.parseUnits(
        paymentToken === 'INSPI' ? planDetail.inspiPrice : planDetail.usdtPrice,
        paymentToken === 'INSPI' ? 18 : 6
      );

      const approveTx = await tokenContract.approve(SUBSCRIPTION_ADDRESS, amount);
      await approveTx.wait();

      // Then subscribe
      const tx = await contract[paymentToken === 'INSPI' ? 'subscribeWithInspi' : 'subscribeWithUSDT'](planType);
      await tx.wait();

      toast({
        title: "Success!",
        description: "Your subscription has been updated successfully!",
      });

      // Refresh subscription details
      await fetchSubscriptionDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAdditionalCredits = async (paymentToken: 'INSPI' | 'USDT') => {
    if (!signer || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
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

      // First approve the token spending
      const tokenContract = new ethers.Contract(
        paymentToken === 'INSPI' ? TOKEN_ADDRESS : USDT_ADDRESS,
        ['function approve(address spender, uint256 amount) public returns (bool)'],
        signer
      );

      const amount = ethers.parseUnits(
        paymentToken === 'INSPI' ? '400' : '2',
        paymentToken === 'INSPI' ? 18 : 6
      );

      const approveTx = await tokenContract.approve(SUBSCRIPTION_ADDRESS, amount);
      await approveTx.wait();

      // Then buy additional credits
      const tx = await contract[paymentToken === 'INSPI' ? 'buyAdditionalCreditsWithInspi' : 'buyAdditionalCreditsWithUSDT']();
      await tx.wait();

      toast({
        title: "Success!",
        description: "Additional credits purchased successfully!",
      });

      // Refresh subscription details
      await fetchSubscriptionDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to purchase additional credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
        {currentSubscription && (
          <div className="mt-2 space-y-1">
            <p className="text-muted-foreground">Current Credits: {currentSubscription.credits}</p>
            <p className="text-muted-foreground">
              Current Plan: {plans[currentSubscription.planType].name}
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
          <TabsTrigger value="credits">Buy Additional Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card key={plan.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  {planDetails[plan.planType] && (
                    <CardDescription>
                      {planDetails[plan.planType].inspiPrice} INSPI / {planDetails[plan.planType].usdtPrice} USDT
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto space-x-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleSubscribe(plan.planType, 'INSPI')}
                    disabled={loading || (!!currentSubscription && currentSubscription.planType >= plan.planType)}
                  >
                    {loading ? 'Processing...' : 
                      currentSubscription && currentSubscription.planType >= plan.planType 
                        ? 'Current Plan or Lower' 
                        : 'Pay with INSPI'
                    }
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleSubscribe(plan.planType, 'USDT')}
                    disabled={loading || (!!currentSubscription && currentSubscription.planType >= plan.planType)}
                  >
                    {loading ? 'Processing...' : 
                      currentSubscription && currentSubscription.planType >= plan.planType 
                        ? 'Current Plan or Lower' 
                        : 'Pay with USDT'
                    }
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Additional Credits</CardTitle>
              <CardDescription>Get 20 additional credits</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Price:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>400 INSPI</li>
                <li>2 USDT</li>
              </ul>
            </CardContent>
            <CardFooter className="space-x-2">
              <Button
                className="flex-1"
                onClick={() => handleBuyAdditionalCredits('INSPI')}
                disabled={loading || !currentSubscription}
              >
                {loading ? 'Processing...' : 'Pay with INSPI'}
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleBuyAdditionalCredits('USDT')}
                disabled={loading || !currentSubscription}
              >
                {loading ? 'Processing...' : 'Pay with USDT'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
