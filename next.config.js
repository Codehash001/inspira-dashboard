/** @type {import('next').NextConfig} */
const nextConfig = {
  serverTimeout: 600000, // 10 minutes in milliseconds
  experimental: {
    serverActions: {
      timeout: 600000, // 10 minutes for server actions
    },
  },
  env: {
    NEXT_PUBLIC_ADMIN_WALLET: process.env.NEXT_PUBLIC_ADMIN_WALLET,
  },
}

module.exports = nextConfig
