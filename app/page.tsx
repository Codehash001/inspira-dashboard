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
  Video
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
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
    change: "49",
    changeType: "increase",
    icon: Coins
  },
  {
    name: "INSPI Token",
    value: "$0.85",
    change: "5.2",
    changeType: "increase",
    icon: Wallet
  },
  {
    name: "Total Users",
    value: "25k+",
    change: "12",
    changeType: "increase",
    icon: Users
  },
  {
    name: "Processing Speed",
    value: "0.2s",
    change: "15",
    changeType: "increase",
    icon: Zap
  }
]

const activityData = [
  { name: 'Mon', credits: 400, tokens: 240 },
  { name: 'Tue', credits: 300, tokens: 139 },
  { name: 'Wed', credits: 200, tokens: 980 },
  { name: 'Thu', credits: 278, tokens: 390 },
  { name: 'Fri', credits: 189, tokens: 480 },
  { name: 'Sat', credits: 239, tokens: 380 },
  { name: 'Sun', credits: 349, tokens: 430 },
]

export default function Home() {
  const { credits } = useCredits();
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base Background Color */}
      <div className="fixed inset-0 " />
      
      {/* Animated Gradient Background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(32, 244, 204, 0.08) 0%, 
            rgba(0, 24, 49, 0.08) 50%, 
            transparent 70%
          )`,
          filter: 'blur(120px)',
          transform: 'translate3d(0, 0, 0)',
          animation: 'moveGradient 30s alternate infinite'
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(32, 196, 244, 0.08) 0%, 
            rgba(0, 49, 49, 0.08) 50%, 
            transparent 70%
          )`,
          filter: 'blur(120px)',
          transform: 'translate3d(0, 0, 0)',
          animation: 'moveGradient2 30s alternate infinite'
        }}
      />
      
      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-20" />
      
      <style jsx>{`
        @keyframes moveGradient {
          0% {
            transform: translate3d(-30%, -30%, 0) scale(1.5);
          }
          50% {
            transform: translate3d(0%, 0%, 0) scale(1);
          }
          100% {
            transform: translate3d(30%, 30%, 0) scale(1.5);
          }
        }
        @keyframes moveGradient2 {
          0% {
            transform: translate3d(30%, 30%, 0) scale(1.5);
          }
          50% {
            transform: translate3d(0%, 0%, 0) scale(1);
          }
          100% {
            transform: translate3d(-30%, -30%, 0) scale(1.5);
          }
        }
      `}</style>
      
      {/* Main Content */}
      <div className="relative p-4">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#20F4CC] to-[#20C4F4] bg-clip-text text-transparent">
            Welcome back!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening with your projects today.
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
                    {stat.name === "Available Credits" ? `${credits.toLocaleString()}` : `${stat.value}`}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-[hsl(var(--theme-primary))]">
                <span className={cn(
                  "flex items-center text-xs font-medium",
                  stat.changeType === "increase" ? "text-[hsl(var(--theme-primary))]" : "text-red-500"
                )}>
                  {stat.changeType === "increase" ? "+" : "-"}{stat.change}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Overview */}
        <div className="glass-card rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--theme-fg))]">Activity Overview</h2>
            <p className="text-sm text-[hsl(var(--theme-muted))]">Monitor your usage and token generation</p>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activityData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#20F4CC" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#20F4CC" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#20C4F4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#20C4F4" stopOpacity={0} />
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
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="#20C4F4"
                  strokeWidth={2}
                  fill="url(#colorTokens)"
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
  )
}
