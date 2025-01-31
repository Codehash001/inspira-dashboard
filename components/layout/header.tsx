"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Wallet, Plus, Bell, Coins, Wallet2, LogOut } from "lucide-react"
import { useWallet } from "@/lib/use-wallet"

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
  const { connect, disconnect, isConnected, shortenAddress } = useWallet()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))]/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Credits */}
          <div className="relative">
            {/* Gradient Border */}
            <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-[hsl(var(--theme-primary))] via-[hsl(var(--theme-secondary))] to-[hsl(var(--theme-primary))] animate-gradient-x" />
            
            {/* Content */}
            <div className="relative flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--theme-bg))]">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-[hsl(var(--theme-primary))]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[hsl(var(--theme-muted))]">Credits:</span>
                  <span className="text-sm font-medium bg-gradient-to-r from-[hsl(var(--theme-primary))] to-[hsl(var(--theme-secondary))] bg-clip-text text-transparent">1,234</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-[hsl(var(--theme-primary))]/10"
              >
                <Plus className="h-3 w-3 text-[hsl(var(--theme-primary))]" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-lg hover:bg-[hsl(var(--theme-primary))]/5"
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
                className="border-[hsl(var(--theme-primary))]/20 text-[hsl(var(--theme-primary))]"
              >
                <Wallet2 className="mr-2 h-4 w-4" />
                {shortenAddress}
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
              <Wallet2 className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
