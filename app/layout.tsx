import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/lib/wallet-provider"
import DashboardLayout from "@/components/layout/dashboard-layout"
import "./globals.css"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Inspira Dashboard',
  description: 'AI-powered tools for content creation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <WalletProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
