"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mail, MessageCircle, Phone, Globe } from "lucide-react";

const faqs = [
  {
    question: "What is Inspira?",
    answer:
      "Inspira is an AI-powered platform that offers various creative services including AI chat, book grading, image generation, and video generation. Our platform is designed to help users leverage artificial intelligence for their creative and professional needs.",
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
    link: "https://docs.inspira.ai",
  },
  {
    title: "Discord Community",
    description: "Join our community for real-time support",
    icon: MessageCircle,
    link: "https://discord.gg/inspira",
  },
  {
    title: "Email Support",
    description: "Get help via email",
    icon: Mail,
    link: "mailto:support@inspira.ai",
  },
  {
    title: "Phone Support",
    description: "Available during business hours",
    icon: Phone,
    link: "tel:+1-800-INSPIRA",
  },
];

const SupportPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Here you would typically send the support request to your backend
      // For now, we'll just show a success message
      toast({
        title: "Support request sent",
        description: "We'll get back to you as soon as possible.",
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send support request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col">
      <div className="container mx-auto py-8 max-w-7xl flex-1 overflow-hidden flex flex-col">
        <div className="flex-none">
          {/* Header */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
              <p className="text-muted-foreground">
                Get help with your account and find answers to common questions
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto min-h-0">
          <div className="space-y-6">
            {/* Resources Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {resources.map((resource) => (
                <a
                  key={resource.title}
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-border/40 hover:border-border/80">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <resource.icon className="h-5 w-5 text-primary/80" />
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                      </div>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              ))}
            </div>

            {/* FAQ Section */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about Inspira
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Send us a message.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                        disabled={isLoading}
                        className="bg-background border-border/40 hover:border-border/80 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                        required
                        disabled={isLoading}
                        className="bg-background border-border/40 hover:border-border/80 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help?"
                      required
                      disabled={isLoading}
                      rows={5}
                      className="bg-background border-border/40 hover:border-border/80 transition-colors"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
