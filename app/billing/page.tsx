"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/use-wallet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Wallet,
  CreditCard,
  Gift,
  Coins,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useCredits } from "@/hooks/use-credits"

type Transaction = {
  id: number
  walletId: string
  transactionType: string
  createdAt: string
  transactionHash: string
  user: {
    username: string | null
  }
}

const transactionIcons = {
  subscribe: <ArrowUpRight className="h-4 w-4" />,
  unsubscribe: <ArrowDownRight className="h-4 w-4" />,
  claim_free_credits: <Gift className="h-4 w-4" />,
  buy_credits: <Coins className="h-4 w-4" />,
}

const transactionColors = {
  subscribe: "bg-green-500/10 text-green-500",
  unsubscribe: "bg-red-500/10 text-red-500",
  claim_free_credits: "bg-purple-500/10 text-purple-500",
  buy_credits: "bg-blue-500/10 text-blue-500",
}

export default function BillingPage() {
  const { credits } = useCredits();
  const { address } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)

  const fetchTransactions = async () => {
    if (!address) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        walletId: address,
        ...(type ? { type } : {}),
        page: page.toString(),
        limit: limit.toString(),
      })

      const response = await fetch(`/api/billing?${params}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setTransactions(data.data)
      setTotalPages(Math.ceil(data.totalCount / limit))
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      fetchTransactions()
    }
  }, [address, type, page])

  const getTransactionLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing & Transactions</h1>
            <p className="text-muted-foreground">
              View your transaction history and billing details
            </p>
          </div>
          
          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto border-border/40 hover:border-border/80 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2 text-primary/80" />
                <span className="text-sm font-medium">
                  {type ? getTransactionLabel(type) : 'All Transactions'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground/60">
                Filter by Type
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setType(null)}
                className="gap-2"
              >
                <Receipt className="h-4 w-4" />
                All Transactions
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setType('subscribe')}
                className="gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
                Subscriptions
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setType('unsubscribe')}
                className="gap-2"
              >
                <ArrowDownRight className="h-4 w-4" />
                Unsubscriptions
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setType('claim_free_credits')}
                className="gap-2"
              >
                <Gift className="h-4 w-4" />
                Free Credits
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setType('buy_credits')}
                className="gap-2"
              >
                <Coins className="h-4 w-4" />
                Credit Purchases
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,234</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscription</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Pro Plan</div>
              <p className="text-xs text-muted-foreground">
                Renews on Mar 1, 2024
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Used 655 this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$432.00</div>
              <p className="text-xs text-muted-foreground">
                In $INSPI tokens
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Transaction Hash</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${transactionColors[transaction.transactionType as keyof typeof transactionColors]}`}>
                        {transactionIcons[transaction.transactionType as keyof typeof transactionIcons]}
                      </div>
                      <span className="font-medium">
                        {getTransactionLabel(transaction.transactionType)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell className="font-mono">
                    <Button
                      variant="link"
                      className="h-auto p-0 text-muted-foreground hover:text-primary"
                      onClick={() => window.open(`https://etherscan.io/tx/${transaction.transactionHash}`, '_blank')}
                    >
                      {`${transaction.transactionHash.slice(0, 6)}...${transaction.transactionHash.slice(-4)}`}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      Completed
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
