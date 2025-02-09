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
  LayoutGrid
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

type HistoryItem = {
  id: number
  type: 'chat' | 'image' | 'video' | 'book'
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
}

export default function HistoryPage() {
  const { address } = useWallet()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [type, setType] = useState<"all" | "chat" | "image" | "video" | "book">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)

  const fetchHistory = async () => {
    if (!address) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        walletId: address,
        ...(type !== "all" ? { type } : {}),
        ...(search ? { search } : {}),
        page: page.toString(),
        limit: limit.toString(),
      })

      const response = await fetch(`/api/history?${params}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setHistory(data.data)
      setTotalPages(Math.ceil(data.totalCount / limit))
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
  }, [address, type, search, page])

  const typeIcon = {
    chat: <MessagesSquare className="h-4 w-4" />,
    image: <ImagePlus className="h-4 w-4" />,
    video: <VideoIcon className="h-4 w-4" />,
    book: <BookOpenCheck className="h-4 w-4" />,
  }

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col">
      <div className="container mx-auto py-8 max-w-7xl flex-1 overflow-hidden flex flex-col">
        <div className="flex-none">
          {/* Header */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Generation History</h1>
              <p className="text-muted-foreground">
                View your usage history and activity details
              </p>
            </div>
            
            {/* Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-[300px]">
                <Input
                  placeholder="Search history..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-3 bg-background border-border/40 hover:border-border/80 transition-colors"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto border-border/40 hover:border-border/80 transition-colors"
                  >
                    <ListFilter className="h-4 w-4 mr-2 text-primary/80" />
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto min-h-0">
          <div className="space-y-8">
            {/* Table */}
            <div className="rounded-lg border border-border/40">
              <div className="relative">
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
                    {history.map((item) => (
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
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-primary/80" />
                            {item.creditUsed}
                          </div>
                        </TableCell>
                        {/* <TableCell>
                          <div className="flex items-center gap-1">
                            <Timer className="h-4 w-4 text-primary/80" />
                            {item.tokenUsed}
                          </div>
                        </TableCell> */}
                        <TableCell>
                          {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          {(item.imageUrl || item.videoUrl || item.bookCoverUrl) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:text-primary"
                              onClick={() => window.open(item.imageUrl || item.videoUrl || item.bookCoverUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No history found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-border/40 hover:border-border/80 transition-colors"
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
                  className="border-border/40 hover:border-border/80 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
