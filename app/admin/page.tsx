'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@/lib/use-wallet'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Coins, MessageSquare, Users, Zap, Link2, Activity } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ContractControls } from '@/components/admin/contract-controls'

const COLORS = ['#188FD9', '#1AD9A3']

export default function AdminPage() {
  const { address, isConnected } = useWallet()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('analytics')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET

  // Separate loading states for different sections
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)
  const [isUsersLoading, setIsUsersLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      setIsAnalyticsLoading(true)
      const response = await fetch(`/api/admin/analytics?page=${page}`)
      const data = await response.json()
      setAnalyticsData(data)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('Failed to fetch analytics data. Please try again.')
    } finally {
      setIsAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [page])

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics()
    } else {
      fetchData()
    }
  }, [activeTab])

  const fetchData = useCallback(async () => {
    if (!isConnected || !address) return
    if (!ADMIN_WALLET || address.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      setError('Not authorized as admin')
      return
    }

    try {
      if (activeTab === 'transactions') {
        setIsTransactionsLoading(true)
        const res = await fetch(`/api/admin/transactions?walletId=${address}&page=${page}&search=${search}`)
        if (!res.ok) throw new Error('Failed to fetch transactions')
        const data = await res.json()
        setTransactions(data.transactions)
        setTotalPages(data.pagination.totalPages || 1)
        setIsTransactionsLoading(false)
      } else if (activeTab === 'users') {
        setIsUsersLoading(true)
        const res = await fetch(`/api/admin/users?walletId=${address}&page=${page}&search=${search}`)
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages || 1)
        setIsUsersLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsTransactionsLoading(false)
      setIsUsersLoading(false)
    }
  }, [address, isConnected, activeTab, page, search, ADMIN_WALLET])

  useEffect(() => {
    setPage(1)
    setTotalPages(1)
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'analytics') {
      fetchData()
    }
  }, [fetchData, page, activeTab])

  const PaginationControls = () => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(prev => Math.max(1, prev - 1))}
        disabled={page === 1 || isTransactionsLoading || isUsersLoading}
      >
        Previous
      </Button>
      <div className="text-sm text-[hsl(var(--theme-muted))]">
        Page {page} of {totalPages || 1}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(prev => Math.min(totalPages || 1, prev + 1))}
        disabled={page === (totalPages || 1) || isTransactionsLoading || isUsersLoading}
      >
        Next
      </Button>
    </div>
  )

  const renderAnalytics = () => {
    if (!analyticsData) return null

    return (
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">


          <div className="glass-card relative overflow-hidden rounded-xl p-6 transition-all duration-300 shadow-[0_0_10px_#188FD9] h-[280px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-medium text-[hsl(var(--theme-fg))]">Total Revenue</h3>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#188FD9]/10">
                <Link2 className="h-5 w-5 text-[#188FD9]" />
              </div>
            </div>

            <div className="flex  flex-col">
              {/* USDT Card */}
              <div className="flex justify-between p-3 border-b border-[#1AD9A3] hover:border-[#188FD9]/40 transition-colors duration-300">
                <div>
                  <span className="text-xs text-[hsl(var(--theme-muted))]]">USDT</span>
                  <p className="text-2xl font-semibold text-[hsl(var(--theme-fg))] tracking-tight">{(analyticsData?.revenue?.total?.USDT ?? 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[hsl(var(--theme-muted))] block text-end">This Month</span>
                    <p className="text-[12px] text-[hsl(var(--theme-fg))] text-end font-medium">{(analyticsData?.revenue?.monthly?.USDT?.current ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* INSPI Card */}
              <div className="flex justify-between p-3 border-b border-[#1AD9A3] hover:border-[#188FD9]/40 transition-colors duration-300">
                <div>
                  <span className="text-xs text-[hsl(var(--theme-muted))]]">$INSPI</span>
                  <p className="text-2xl font-semibold text-[hsl(var(--theme-fg))] tracking-tight">{(analyticsData?.revenue?.total?.INSPI ?? 0).toFixed(0)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[hsl(var(--theme-muted))] block text-end">This Month</span>
                    <p className="text-[12px] text-[hsl(var(--theme-fg))] text-end font-medium">{(analyticsData?.revenue?.monthly?.INSPI?.current ?? 0).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          

          <div className="glass-card relative overflow-hidden rounded-xl p-6 transition-all duration-300 shadow-[0_0_10px_#1AD9A3]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[hsl(var(--theme-fg))]">Total Credits</h3>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1AD9A3]/10">
                <Zap className="h-5 w-5 text-[#1AD9A3]" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-[hsl(var(--theme-fg))]">{analyticsData.credits.total}</p>
              <h3 className="text-xs text-[hsl(var(--theme-muted))]">Credits issued in total</h3>
              <div className="mt-4 space-y-1 text-sm text-[hsl(var(--theme-muted))] border border-[#1AD9A3] rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-[#1AD9A3] text-[12px]">Total (This month)</span>
                  <span>{analyticsData.credits.thisMonth}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#1AD9A3]/20">
                  <span>Avg Daily Usage</span>
                  <span>{analyticsData.credits.avgDaily}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peak</span>
                  <span>{analyticsData.credits.usage.peak}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card relative overflow-hidden rounded-xl p-6 transition-all duration-300 shadow-[0_0_10px_#20F4CC]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[hsl(var(--theme-fg))]">Total Users</h3>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#20F4CC]/10">
                <Users className="h-5 w-5 text-[#20F4CC]" />
              </div>
            </div>
            <div>
              <div className="">
                <p className="text-3xl font-bold text-[hsl(var(--theme-fg))]">{analyticsData.users.total}</p>
              </div>
              <div className="mt-4 space-y-1 text-sm text-[hsl(var(--theme-muted))] border-t border-b border-[#20F4CC]  p-4">
                <div className="flex justify-between items-end">
                  <span>Free</span>
                  <span className='text-lg font-semibold text-[hsl(var(--theme-fg))]'>{analyticsData.users.byPlan.free || 0}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span>Pro</span>
                  <span className='text-lg font-semibold text-[hsl(var(--theme-fg))]'>{analyticsData.users.byPlan.pro || 0}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span>Ultra</span>
                  <span className='text-lg font-semibold text-[hsl(var(--theme-fg))]'>{analyticsData.users.byPlan.ultra || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card relative overflow-hidden rounded-xl p-6 transition-all duration-300 shadow-[0_0_10px_#188FD9]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[hsl(var(--theme-fg))]">Total Usage</h3>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#188FD9]/10">
                <Activity className="h-5 w-5 text-[#188FD9]" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-[hsl(var(--theme-fg))]">{analyticsData.serviceStats.total}</p>
              <h3 className="text-xs text-[hsl(var(--theme-muted))]">Total requests processed</h3>
              <div className="mt-4 space-y-1 text-sm text-[hsl(var(--theme-muted))] border border-[#1AD9A3] rounded-lg p-4">
                <div className="flex justify-between items-end border-b border-[#1AD9A3]/20">
                  <span>This Month</span>
                  <span className="text-lg font-semibold text-[hsl(var(--theme-fg))]">{analyticsData.serviceStats.currentMonth}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span>Most Used </span>
                  <div className="text-end">
                    <p className="text-lg font-semibold text-[hsl(var(--theme-fg))]">{analyticsData.serviceStats.mostUsed.count}</p>
                    <span className="text-xs text-[hsl(var(--theme-muted))]">{analyticsData.serviceStats.mostUsed.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="glass-card relative overflow-hidden rounded-xl p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[hsl(var(--theme-fg))]">Monthly Revenue Overview</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.charts.monthly}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#ffffff20' : '#00000020'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#ffffff80' : '#00000080'} />
                  <YAxis stroke={theme === 'dark' ? '#ffffff80' : '#00000080'} />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload || !payload.length) return null;
                      return (
                        <div className="glass-card p-2 !bg-[hsl(var(--theme-bg))] border border-[#1AD9A3]/20">
                          <p className="text-sm font-medium text-[hsl(var(--theme-fg))]">{label}</p>
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <p className="text-xs text-[hsl(var(--theme-muted))]">
                                {entry.name}: {entry.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Legend />
                  <Bar dataKey="USDT" fill="#188FD9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="INSPI" fill="#1AD9A3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card relative overflow-hidden rounded-xl p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[hsl(var(--theme-fg))]">Service Usage Distribution</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.charts.serviceUsage}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.charts.serviceUsage.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsla(${index * 50}, 80%, 65%, 0.8)`}
                        stroke={`hsla(${index * 50}, 80%, 65%, 1)`}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload || !payload[0]) return null;
                      return (
                        <div className="glass-card p-2 !bg-[hsl(var(--theme-bg))] border border-[#1AD9A3]/20">
                          <p className="text-sm font-medium text-[hsl(var(--theme-fg))]">
                            {payload[0].name}
                          </p>
                          <p className="text-xs text-[hsl(var(--theme-muted))]">
                            Requests: {payload[0].value}
                          </p>
                        </div>
                      );
                    }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Legend 
                    formatter={(value, entry: any) => (
                      <span style={{ color: theme === 'dark' ? '#ffffff80' : '#00000080' , margin: 4 }}>
                        {value}
                      </span>
                    )}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    )
  }

  const renderTransactions = () => {
    const isLoadingTransactions = isTransactionsLoading || (!transactions?.length && page === 1)

    return (
      <div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTransactions ? (
                // Skeleton Loading rows
                Array(10).fill(0).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="h-5 w-32 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-7 w-24 bg-[hsl(var(--theme-muted))]/20 rounded-full animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions?.length > 0 ? (
                transactions.map((transaction) => {

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-[hsl(var(--theme-muted))]">
                            {transaction.walletId ? `${transaction.walletId.slice(0, 6)}...${transaction.walletId.slice(-4)}` : '-'}
                          </span>
                          {transaction.username && (
                            <span className="text-sm">{transaction.username}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{transaction.type}</span>
                      </TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {transaction.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {transaction.credits.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'completed' 
                            ? 'bg-[#1AD9A3]/20 text-[#1AD9A3]' 
                            : transaction.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {transaction.status}
                        </span>
                      </TableCell>
                      {/* <TableCell>
                        {transaction.hash ? (
                          <a 
                            href={`https://etherscan.io/tx/${transaction.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#188FD9] hover:text-[#188FD9]/80 transition-colors font-mono text-sm"
                          >
                            {transaction.transactionHash.slice(0, 6)}...{transaction.transactionHash.slice(-4)}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell> */}
                    </TableRow>
                  )
                })
              ) : (
                // Show skeleton loading for empty state too
                Array(3).fill(0).map((_, index) => (
                  <TableRow key={`empty-skeleton-${index}`}>
                    <TableCell>
                      <div className="h-5 w-32 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-7 w-24 bg-[hsl(var(--theme-muted))]/20 rounded-full animate-pulse" />
                    </TableCell>
                    {/* <TableCell>
                      <div className="h-5 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls />
      </div>
    )
  }

  const renderUsers = () => {
    const isLoadingUsers = isUsersLoading || (!users?.length && page === 1)

    return (
      <div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Info</TableHead>
                <TableHead>Plan Details</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                // Skeleton Loading rows
                Array(10).fill(0).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-36 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-20 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : users?.length > 0 ? (
                users.map((user) => {
                  const joinDate = new Date(user.createdAt)
                  const lastActiveDate = new Date(user.lastActive)
                  const expiryDate = user.creditExpiry ? new Date(user.creditExpiry) : null
                  
                  const isValidJoinDate = !isNaN(joinDate.getTime())
                  const isValidLastActive = !isNaN(lastActiveDate.getTime())
                  const hasValidCredits = typeof user.credits === 'number' && !isNaN(user.credits)

                  if (!isValidJoinDate || !isValidLastActive || !hasValidCredits) {
                    return null
                  }

                  return (
                    <TableRow key={user.walletId}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.username}</div>
                          <div className="font-mono text-xs text-[hsl(var(--theme-muted))]">
                            {user.walletId}
                          </div>
                          <div className="text-xs text-[hsl(var(--theme-muted))]">
                            Joined {joinDate.toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.plan === 'ultra' 
                                ? 'bg-purple-500/20 text-purple-500'
                                : user.plan === 'pro'
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'bg-[hsl(var(--theme-muted))]/20 text-[hsl(var(--theme-muted))]'
                            }`}>
                              {user.plan}
                            </span>
                          </div>
                          {expiryDate && (
                            <div className="text-xs text-[hsl(var(--theme-muted))]">
                              Expires {expiryDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {user.credits.toFixed(2)}
                          </div>
                          <div className="text-xs text-[hsl(var(--theme-muted))]">
                            Available Credits
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            Last active {lastActiveDate.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-[hsl(var(--theme-muted))]">
                            {lastActiveDate.toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                // Show skeleton loading for empty state
                Array(3).fill(0).map((_, index) => (
                  <TableRow key={`empty-skeleton-${index}`}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-36 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-20 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                        <div className="h-4 w-28 bg-[hsl(var(--theme-muted))]/20 rounded animate-pulse" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls />
      </div>
    )
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className='bg-transparent'>
        <div className="mb-6">
          <TabsList className="grid w-1/2 grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="contract">Contract Controls</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics">
          {renderAnalytics()}
        </TabsContent>

        <TabsContent value="transactions">
          {renderTransactions()}
        </TabsContent>

        <TabsContent value="users">
          {renderUsers()}
        </TabsContent>

        <TabsContent value="contract">
          <ContractControls />
        </TabsContent>
      </Tabs>
    </div>
  )
}
