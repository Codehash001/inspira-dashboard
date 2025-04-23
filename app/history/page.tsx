"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/use-wallet"
import { useCredits } from "@/hooks/use-credits"
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
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  ChevronRight,
  MessagesSquare,
  ImagePlus,
  VideoIcon,
  BookOpenCheck,
  SlidersHorizontal,
  SearchCode,
  ExternalLink,
  Timer,
  Coins,
  ListFilter,
  LayoutGrid,
  CreditCard,
  History,
  Activity,
  Shield,
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Footer from "@/components/footer"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type HistoryItem = {
  id: number
  type: 'chat' | 'image' | 'video' | 'book' | 'audit'
  createdAt: string
  creditUsed: number
  tokenUsed: number
  // Chat specific
  sessionName?: string
  userMessage?: string
  botMessage?: string
  // Image specific
  imageUrl?: string
  resolution?: string
  // Video specific
  videoUrl?: string
  // Book specific
  bookCoverUrl?: string
  bookGrade?: string
  bookName?: string
  // Audit specific
  contractName?: string
  severity?: 'HIGH' | 'MEDIUM' | 'LOW'
  contractId?: string
}

export default function HistoryPage() {
  const { address } = useWallet()
  const { credits, loading: creditsLoading } = useCredits();
  const [allHistory, setAllHistory] = useState<HistoryItem[]>([])
  const [displayHistory, setDisplayHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [type, setType] = useState<"all" | "chat" | "image" | "video" | "book" | "audit">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(20)

  const fetchHistory = async () => {
    if (!address) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        walletId: address,
        ...(type !== "all" ? { type } : {}),
        ...(search ? { search } : {})
      })

      const response = await fetch(`/api/history?${params}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setAllHistory(data.data)
      setTotalPages(Math.ceil(data.data.length / limit))
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      fetchHistory()
    }
  }, [address, type, search])

  useEffect(() => {
    const start = (page - 1) * limit
    const end = start + limit
    setDisplayHistory(allHistory.slice(start, end))
  }, [allHistory, page, limit])

  const typeIcon = {
    chat: <MessagesSquare className="h-4 w-4" />,
    image: <ImagePlus className="h-4 w-4" />,
    video: <VideoIcon className="h-4 w-4" />,
    book: <BookOpenCheck className="h-4 w-4" />,
    audit: <Shield className="h-4 w-4" />,
  }

  const getTaskDetails = (item: HistoryItem) => {
    switch (item.type) {
      case 'chat':
        return item.sessionName || 'Chat Session';
      case 'image':
        return item.imageUrl ? 'Image Generation' : 'Image Task';
      case 'video':
        return item.videoUrl ? 'Video Generation' : 'Video Task';
      case 'book':
        return item.bookName || 'Book Task';
      case 'audit':
        return (
          <div className="flex items-center gap-2">
            <span>{item.contractName}.sol</span>
            <Badge 
              className={
                item.severity === "HIGH" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                item.severity === "MEDIUM" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                "bg-green-500/10 text-green-500 border border-green-500/20"
              }
            >
              {item.severity} Risk
            </Badge>
          </div>
        );
      default:
        return 'Unknown Task';
    }
  }

  const getMostFrequentTaskType = (items: HistoryItem[]) => {
    const typeCount: Record<string, number> = {};
    items.forEach(item => {
      typeCount[item.type] = (typeCount[item.type] || 0) + 1;
    });
    return Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b, 'none');
  }

  const getMostUsageTaskType = (items: HistoryItem[]) => {
    const usageByType: Record<string, number> = {};
    items.forEach(item => {
      usageByType[item.type] = (usageByType[item.type] || 0) + item.creditUsed;
    });
    return Object.keys(usageByType).reduce((a, b) => usageByType[a] > usageByType[b] ? a : b, 'none');
  }

  const getTotalCreditsThisMonth = (items: HistoryItem[]) => {
    const now = new Date();
    return items.reduce((total, item) => {
      const itemDate = new Date(item.createdAt);
      if (itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()) {
        return total + item.creditUsed;
      }
      return total;
    }, 0);
  }

  const getAverageCreditsPerTask = (items: HistoryItem[]) => {
    if (items.length === 0) return 0;
    const totalCredits = items.reduce((total, item) => total + item.creditUsed, 0);
    return (totalCredits / items.length).toFixed(4);
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <div className="flex-1 container py-6 space-y-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-[hsl(var(--theme-fg))]">History</h1>
              <p className="text-muted-foreground">
                View your usage history and credit consumption
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-r from-primary to-secondary shadow-lg rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-black">Credits Used This Month</CardTitle>
                <Coins className="h-4 w-4 text-black" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-black">
                  {(getTotalCreditsThisMonth(allHistory)).toFixed(4)}
                </div>
                <p className="text-sm text-black mt-2">
                  Total credits used in {new Date().toLocaleString('default', { month: 'long' })}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-primary to-secondary shadow-lg rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-black">Average Credits Per Task</CardTitle>
                <SlidersHorizontal className="h-4 w-4 text-black" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-black">
                  {getAverageCreditsPerTask(allHistory)}
                </div>
                <p className="text-sm text-black mt-2">
                  Average credits used per task
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-primary to-secondary shadow-lg rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-black">Most Usage Task Type</CardTitle>
                <Activity className="h-4 w-4 text-black" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-black">
                  {getMostUsageTaskType(allHistory)}
                </div>
                <p className="text-sm text-black mt-2">
                  Task that used the highest credits
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-primary to-secondary shadow-lg rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-black">Total Credits</CardTitle>
                <Coins className="h-4 w-4 text-black" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-black">
                  {creditsLoading ? 'Loading...' : credits.toFixed(4)}
                </div>
                <p className="text-sm text-black mt-2">
                  Left for this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative w-full flex justify-between items-end">
            <Input
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3 bg-background border-border/40 hover:border-border/80 transition-colors sm:w-[300px]"
            />

                        {/* Filter */}
                        <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-border/40 hover:border-border/80 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2 text-primary/80" />
                  <span className="text-sm font-medium">
                    {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground/60">
                  Filter by Type
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setType("all")}>All Types</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setType("chat")}>Chat</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setType("image")}>Image</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setType("video")}>Video</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setType("book")}>Book</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setType("audit")}>Smart Contract Audit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayHistory.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcon[item.type]}
                        <span className="capitalize">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.type === 'chat' && (
                        <div className="max-w-[400px]">
                          <div className="font-medium">{item.sessionName}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {item.userMessage}
                          </div>
                        </div>
                      )}
                      {item.type === 'image' && item.imageUrl && (
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt="Generated" className="h-full w-full object-cover" />
                          </div>
                          <Badge>{item.resolution}</Badge>
                        </div>
                      )}
                      {item.type === 'video' && item.videoUrl && (
                        <div className="flex items-center gap-2">
                          <video className="h-10 w-10 rounded" src={item.videoUrl} />
                          <Badge>{item.resolution}</Badge>
                        </div>
                      )}
                      {item.type === 'book' && (
                        <div className="flex flex-col gap-1 max-w-[400px]">
                          <div className="font-medium line-clamp-1">
                            {item.bookName}
                          </div>
                          <Badge 
                            variant="default" 
                            className="w-fit bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            Grade {item.bookGrade}
                          </Badge>
                        </div>
                      )}
                      {item.type === 'audit' && (
                        <div className="flex flex-col gap-1 max-w-[400px]">
                          {getTaskDetails(item)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-primary/80" />
                        {item.creditUsed}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {(item.imageUrl || item.videoUrl ) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:text-primary"
                          onClick={() => window.open(item.imageUrl || item.videoUrl || item.bookCoverUrl || item.contractId, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {displayHistory.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No history found
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
