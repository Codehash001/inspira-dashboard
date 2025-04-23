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
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Gift,
  Coins,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Footer from "@/components/footer"

type Transaction = {
  id: number
  walletId: string
  transactionType: string
  createdAt: string
  transactionHash: string
  status: string
  paymentMethod: string
  paymentAmount: number
  creditsAdded: number
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

export default function TransactionsPage() {
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
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <div className="flex-1 container py-6 space-y-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-[hsl(var(--theme-fg))]">Transactions</h1>
              <p className="text-muted-foreground">
                View your transaction history and payment details
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

          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payed Amount</TableHead>
                  <TableHead>Credits Received</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>
                      {transaction.creditsAdded > 0 ? (
                        <span>{transaction.paymentAmount.toLocaleString()} {' '}
                        {transaction.paymentMethod === 'INSPI' ? (
'($INSPI)'
                      ) : (
                        '($USDT)'
                      )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.creditsAdded > 0 ? (
                        <span>{transaction.creditsAdded.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {transaction.transactionHash ? (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-muted-foreground hover:text-primary"
                          onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`, '_blank')}
                        >
                          {`${transaction.transactionHash.slice(0, 6)}...${transaction.transactionHash.slice(-4)}`}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="border-border/40 hover:border-border/80 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="border-border/40 hover:border-border/80 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
