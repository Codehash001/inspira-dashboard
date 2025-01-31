"use client"

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { type Chain, mainnet, arbitrum } from 'viem/chains'
import { ReactNode, useEffect, useState } from 'react'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

// 2. Create a metadata object
const metadata = {
  name: 'Inspira Dashboard',
  description: 'AI-powered tools for content creation',
  url: 'https://inspira.ai',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 3. Set the networks
const networks: [Chain, ...Chain[]] = [mainnet, arbitrum]

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: projectId || '',
  ssr: true
})

// 5. Create AppKit Provider
export function AppKitProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized && typeof window !== 'undefined' && projectId) {
      createAppKit({
        adapters: [wagmiAdapter],
        networks,
        projectId,
        metadata,
        features: {
          analytics: true,
          socials: false,
          email: false
        },
        themeVariables: {
          '--w3m-accent': '#00BB7F',
        }
      })
      setInitialized(true)
    }
  }, [initialized])

  if (!initialized) {
    return null
  }

  return (
    <>
      {children}
    </>
  )
}
