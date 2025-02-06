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
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Generation History</h1>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-[300px]">
              <SearchCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Search history..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-border/40 hover:border-border/80 transition-colors"
              />
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
                    {type === "all" ? "All Types" : `${type.charAt(0).toUpperCase() + type.slice(1)} Only`}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground/60">
                  Filter by Type
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setType("all")}
                  className="gap-2"
                >
                  <ListFilter className="h-4 w-4" />
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setType("chat")}
                  className="gap-2"
                >
                  <MessagesSquare className="h-4 w-4" />
                  Chat Only
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setType("image")}
                  className="gap-2"
                >
                  <ImagePlus className="h-4 w-4" />
                  Images Only
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setType("video")}
                  className="gap-2"
                >
                  <VideoIcon className="h-4 w-4" />
                  Videos Only
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setType("book")}
                  className="gap-2"
                >
                  <BookOpenCheck className="h-4 w-4" />
                  Books Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
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
                    {item.type === 'book' && item.bookCoverUrl && (
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.bookCoverUrl} alt="Book Cover" className="h-full w-full object-cover" />
                        </div>
                        <Badge>Grade: {item.bookGrade}</Badge>
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
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4 text-primary/80" />
                      {item.tokenUsed}
                    </div>
                  </TableCell>
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
