"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Phone, Globe } from "lucide-react";
import Footer from "@/components/footer";
import { useWallet } from "@/lib/use-wallet";
import { ethers } from "ethers";
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json';
import { cn } from "@/lib/utils";

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS!;

const faqs = [
  {
    question: "What is Inspira?",
    answer:
      "Inspira is a decentralized EduFi platform that merges AI and blockchain to revolutionize learning. It offers AI-driven educational tools, crypto rewards for learning, NFT certifications, and DAO governance, empowering users with accessible, interactive, and financially rewarding education in Web3.",
  },
  {
    question: "How do credits work?",
    answer:
      "Credits are our platform's currency for using AI services. Different services require different amounts of credits. You can view your credit balance in your dashboard and purchase more credits through our subscription plans.",
  },
  {
    question: "What subscription plans are available?",
    answer:
      "We offer three subscription tiers: Free Plan, Pro Plan, and Ultra Plan. Each plan comes with different credit allocations and features. Visit our pricing page to learn more about each plan's benefits.",
  },
  {
    question: "How do I connect my wallet?",
    answer:
      "To connect your wallet, click the 'Connect Wallet' button in the top right corner. We support MetaMask and other popular Web3 wallets. Your wallet is used for authentication and managing your subscription.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, we take data security seriously. All user data is encrypted and stored securely. We never share your personal information with third parties without your consent.",
  },
  {
    question: "How can I get help if I have technical issues?",
    answer:
      "You can reach out to our support team through the contact form below, or join our community Discord server for real-time assistance. We also maintain detailed documentation for common issues.",
  },
];

const resources = [
  {
    title: "Documentation",
    description: "Detailed guides and API documentation",
    icon: Globe,
    link: "https://docs.inspirahub.net",
    requiresSubscription: false,
    buttonText: "View Docs",
  },
  {
    title: "Telegram Community",
    description: "Join our community for real-time support",
    icon: MessageCircle,
    link: "https://t.me/InspiraPortal",
    requiresSubscription: false,
    buttonText: "Join Community",
  },
  {
    title: "Email Support",
    description: "Priority email support",
    icon: Mail,
    link: "mailto:support@inspirahub.net",
    requiresSubscription: true,
    buttonText: "Send Email",
  },
  {
    title: "Direct Support",
    description: "Subscriptions Only & Available during business hours",
    icon: Phone,
    link: "https://t.me/LeoLionMane",
    requiresSubscription: true,
    buttonText: "Chat Now",
  },
];

export default function SupportPage() {
  const { address } = useWallet();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!address) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          SUBSCRIPTION_ADDRESS,
          InspiraSubscriptionABI.abi,
          provider
        );

        const sub = await contract.getUserSubscription(address);
        setHasSubscription(Number(sub.planType) > 0);
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [address]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="text-start space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
        <p className="text-muted-foreground">Get help with any question or concern you may have.</p>
      </div>

      <div className="space-y-4">
        {/* Support Resources */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource, index) => (
            <Card 
              key={index} 
              className={cn(
                "relative overflow-hidden transition-all duration-300 bg-[hsl(var(--theme-bg))] border-[hsl(var(--theme-border))]",
                "flex flex-col h-full",
                (!resource.requiresSubscription || hasSubscription) && 
                "hover:border-[hsl(var(--theme-primary))] hover:shadow-[0_0_15px_rgba(0,255,209,0.1)]"
              )}
            >
              <CardHeader className="pb-4 flex-1">
                <div className="flex items-center gap-3 min-h-[40px]">
                  <div className={cn(
                    "p-3 rounded-xl shrink-0",
                    "bg-gradient-to-br from-[hsl(var(--theme-primary))] to-[hsl(var(--theme-secondary))] bg-opacity-10",
                  )}>
                    <resource.icon className="h-5 w-5 text-black dark:text-white" />
                  </div>
                  <CardTitle className="text-lg text-[hsl(var(--theme-fg))]">{resource.title}</CardTitle>
                </div>
                <CardDescription className="pt-3 text-[hsl(var(--theme-muted))] min-h-[48px]">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {(!resource.requiresSubscription || hasSubscription) ? (
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full transition-all duration-300",
                      "border-[hsl(var(--theme-border))] text-[hsl(var(--theme-fg))]",
                      "hover:bg-gradient-to-r hover:from-[hsl(var(--theme-primary))] hover:to-[hsl(var(--theme-secondary))]",
                      "hover:text-[hsl(var(--theme-bg))] hover:border-transparent"
                    )}
                    onClick={() => window.open(resource.link, '_blank')}
                  >
                    {resource.buttonText}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full opacity-50 cursor-not-allowed border-[hsl(var(--theme-border))] text-[hsl(var(--theme-muted))]"
                    disabled
                  >
                    Upgrade Subscription for priority support
                  </Button>
                )}
              </CardContent>
              {resource.requiresSubscription && !hasSubscription && (
                <div className="absolute inset-0 bg-[hsl(var(--theme-bg))]/95 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="text-center px-4 py-2 rounded-lg border border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))]/50">
                    <p className="text-sm font-medium text-[hsl(var(--theme-muted))]">
                      Available with Pro & Ultra Plans
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="space-y-4 pt-4">
          <div className="text-start space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Common questions about Inspira and its features</p>
          </div>
          <Card className="border-primary/5">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
