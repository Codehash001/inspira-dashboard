"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Coins,
  Wallet,
  Users,
  Zap,
  MessageSquare,
  BookOpen,
  Image as ImageIcon,
  Video,
  CreditCard
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { formatCredits } from "@/lib/format-credits"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useCredits } from "@/hooks/use-credits"
import { useDashboardAnalytics } from "@/hooks/use-dashboard-analytics"
import Footer from "@/components/footer"

const features = [
  {
    title: "AI Chat",
    description: "Engage in intelligent conversations",
    icon: MessageSquare,
    href: "/chat",
    color: "text-[#1AD9A3]",
    stats: "2.5k chats today"
  },
  {
    title: "Book Grading",
    description: "Automated book analysis system",
    icon: BookOpen,
    href: "/book-grading",
    color: "text-[#188FD9]",
    stats: "500+ books graded"
  },
  {
    title: "Image Generation",
    description: "Create AI-powered visuals",
    icon: ImageIcon,
    href: "/image-generation",
    color: "text-[#1AD9A3]",
    stats: "10k+ images created"
  },
  {
    title: "Video Generation",
    description: "Transform ideas into videos",
    icon: Video,
    href: "/video-generation",
    color: "text-[#188FD9]",
    stats: "1k+ videos rendered"
  }
]

const stats = [
  {
    name: "Available Credits",
    value: ``,
    link: "/transactions",
    linkText: "View Transactions",
    icon: Coins
  },
  {
    name: "INSPI Token",
    value: "$0.85",
    link: "https://etherscan.io/address/0xEB22e60a770b913EB47D6aE9A25a2C36b6876c56",
    linkText: "View on Etherscan",
    icon: Wallet
  },
  {
    name: "Monthly Credits Used",
    value: "",
    link: "/history",
    linkText: "View Usage",
    icon: Zap
  },
  {
    name: "Subscription Plan",
    value: "",
    link: "/upgrade-plan",
    linkText: "Upgrade Plan",
    icon: CreditCard
  }
]

const activityData = [
  { name: 'Mon', credits: 400 },
  { name: 'Tue', credits: 300 },
  { name: 'Wed', credits: 200 },
  { name: 'Thu', credits: 278 },
  { name: 'Fri', credits: 189 },
  { name: 'Sat', credits: 239 },
  { name: 'Sun', credits: 349 },
]

export default function Home() {
  const { credits } = useCredits();
  const { totalUsers, creditUsageData, monthlyCreditsUsed, loading, userPlan } = useDashboardAnalytics();
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <div className="flex-1 container py-6 space-y-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#20F4CC] to-[#20C4F4] bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what's happening with your Inspira today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="glass-card relative overflow-hidden rounded-lg p-4 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--theme-primary))]/10 ring-1 ring-[hsl(var(--theme-primary))]/20">
                    <stat.icon className="h-4 w-4 text-[hsl(var(--theme-primary))]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[hsl(var(--theme-fg))]">{stat.name}</div>
                    <div className="text-2xl font-semibold tabular-nums text-[hsl(var(--theme-fg))]">
                      {stat.name === "Available Credits" 
                        ? formatCredits(credits) 
                        : stat.name === "Monthly Credits Used" 
                          ? loading ? "Loading..." : `${monthlyCreditsUsed.toFixed(0)}`
                        : stat.name === "Subscription Plan"
                          ? loading ? "Loading..." : userPlan.charAt(0).toUpperCase() + userPlan.slice(1)
                          : `${stat.value}`}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 text-[hsl(var(--theme-primary))]">
                  <Link href={stat.link} className="text-xs font-medium text-[hsl(var(--theme-primary))]">
                    {stat.linkText}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Overview */}
          <div className="glass-card rounded-lg p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[hsl(var(--theme-fg))]">Activity Overview</h2>
              <p className="text-sm text-[hsl(var(--theme-muted))]">Track your personal credit usage over the past week</p>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={loading ? activityData : creditUsageData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#20F4CC" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#20F4CC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false}
                    stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} 
                  />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{
                      color: isDark ? "#fff" : "#000",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="credits"
                    stroke="#20F4CC"
                    strokeWidth={2}
                    fill="url(#colorCredits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card group relative overflow-hidden rounded-lg p-4 transition-all duration-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--theme-primary))]/10 ring-1 ring-[hsl(var(--theme-primary))]/20">
                  <feature.icon className="h-4 w-4 text-[hsl(var(--theme-primary))]" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-[hsl(var(--theme-fg))]">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--theme-muted))]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
