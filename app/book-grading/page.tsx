"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Clock, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useWallet } from "@/lib/use-wallet"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from 'date-fns'
import Footer from "@/components/footer"

interface BookGradingResult {
  bookId: string
  bookName: string
  authorName: string
  bookGrade: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  analysis: string
  creditUsed: number
  tokenUsed: number
  createdAt?: string
}

export default function BookGradingPage() {
  const { address, isConnected } = useWallet()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<BookGradingResult | null>(null)
  const [history, setHistory] = useState<BookGradingResult[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<BookGradingResult | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0])
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub']
    }
  })

  const fetchHistory = async () => {
    if (!address) return;
    
    setIsLoadingHistory(true);
    try {
      console.log('Fetching history with params:', { page: currentPage, limit: itemsPerPage });
      const response = await fetch(`/api/book-grading/history?walletId=${address}&search=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      if (!data.history || !data.pagination) {
        throw new Error('Invalid response format');
      }
      console.log('Received history data:', { 
        itemsReceived: data.history.length,
        pagination: data.pagination
      });
      setHistory(data.history);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        variant: "destructive",
        description: 'Failed to load grading history'
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch history when address, search, or page changes
  useEffect(() => {
    if (address) {
      fetchHistory();
    }
  }, [address, searchQuery, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !address) {
      toast({
        variant: "destructive",
        description: 'Please upload a file and connect your wallet first.'
      })
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('book', file)
      formData.append('walletId', address)

      console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);

      const response = await fetch('/api/book-grading/grade', {
        method: 'POST',
        body: formData,
      })
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        const parsedResponse = JSON.parse(responseText);
        console.log('Parsed response:', parsedResponse);
        
        // Check if the response has the expected structure
        if (parsedResponse.success && parsedResponse.data) {
          data = parsedResponse.data;
        } else {
          throw new Error('Invalid response format');
        }
        
        console.log('Extracted data:', data);
        
        // Validate the data structure
        if (!data.bookName || !data.bookGrade || !data.analysis) {
          console.warn('Missing required fields in response:', {
            hasBookName: !!data.bookName,
            hasBookGrade: !!data.bookGrade,
            hasAnalysis: !!data.analysis
          });
        }
        
        // Set the results state with the data
        setResults(data);
      } catch (error) {
        console.error('Error parsing or processing response:', error);
        throw new Error('Failed to process server response');
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to grade book');
      }

      fetchHistory() // Refresh history after new grade
      toast({
        description: 'Book analysis completed successfully!'
      })
    } catch (error) {
      console.error('Error grading book:', error)
      const message = error instanceof Error ? error.message : 'Failed to analyze book. Please try again.'
      toast({
        variant: "destructive",
        description: message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <div className="flex-1 container py-6 space-y-8">
        {!isConnected ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg">
              <CardContent className="py-8">
                <div className="space-y-4 text-center">
                  <h2 className="text-2xl font-bold tracking-tight">Connect Wallet</h2>
                  <p className="text-muted-foreground">Please connect your wallet to use the book grading feature.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                  AI Book Grading
                </h1>
                <p className="text-muted-foreground text-lg">
                  Grade the language level of books with AI.
                </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Book</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div 
                      {...getRootProps()} 
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                        transition-colors duration-200 min-h-[200px] flex flex-col items-center justify-center
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
                      `}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-12 h-12 mb-4 text-gray-400" />
                      {file ? (
                        <>
                          <p className="text-sm font-medium text-primary break-all">{file.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Click or drag to replace</p>
                        </>
                      ) : isDragActive ? (
                        <p className="text-sm">Drop the file here ...</p>
                      ) : (
                        <>
                          <p className="text-sm">Drag and drop a book file here, or click to select</p>
                          <p className="text-xs text-muted-foreground mt-1">Supports PDF and TXT files</p>
                          <p className="text-xs text-red-500 mt-1 italic">Make sure to upload a readable file which include texts.</p>
                        </>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={!file || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Grade Book'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {results && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {/* Book Information Section */}
                      <div className="pb-4 border-b">
                        <h3 className="font-medium text-sm text-muted-foreground mb-2">Book Information</h3>
                        <p className="text-lg font-medium">{results.bookName || 'Untitled'}</p>
                        <p className="text-sm text-muted-foreground mt-1">by {results.authorName || 'Unknown Author'}</p>
                      </div>

                      {/* Language Grade Section */}
                      <div className="pb-4 border-b">
                        <h3 className="font-medium text-sm text-muted-foreground mb-2">Language Grade</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {results.bookGrade || 'N/A'}
                          </Badge>
                        </div>
                      </div>

                      {/* Analysis Section */}
                      <div className="pb-4 border-b">
                        <h3 className="font-medium text-sm text-muted-foreground mb-2">Analysis</h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {results.analysis || 'No analysis available'}
                        </p>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* History Section */}
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="mb-2">Grading History</CardTitle>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No grading history found
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {history.map((item) => (
                        <Card 
                          key={item.bookId}
                          className="cursor-pointer transition-all hover:shadow-lg"
                          onClick={() => setSelectedHistoryItem(item)}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <CardTitle className="line-clamp-1 text-lg">{item.bookName}</CardTitle>
                                <p className="text-sm text-muted-foreground">by {item.authorName}</p>
                              </div>
                              <Badge variant="secondary" className="text-white text-xs">{item.bookGrade}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Date</p>
                                  <p className="font-medium">
                                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Unknown'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {history.length > 0 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />

      {/* History Item Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle>Book Analysis Details</CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedHistoryItem(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Book Information Section */}
                <div className="pb-4 border-b">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Book Information</h3>
                  <p className="text-lg font-medium">{selectedHistoryItem.bookName}</p>
                  <p className="text-sm text-muted-foreground mt-1">by {selectedHistoryItem.authorName}</p>
                </div>

                {/* Language Grade Section */}
                <div className="pb-4 border-b">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Language Grade</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {selectedHistoryItem.bookGrade}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedHistoryItem.bookGrade.startsWith('C') ? 'Advanced' : 
                       selectedHistoryItem.bookGrade.startsWith('B') ? 'Intermediate' : 'Basic'} Level
                    </span>
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="pb-4 border-b">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Analysis</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedHistoryItem.analysis}
                  </p>
                </div>

                {/* Usage Statistics */}
                <div className="pt-2">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Usage Statistics</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Credits Used</p>
                      <p className="text-lg font-medium">{selectedHistoryItem.creditUsed.toFixed(3)}</p>
                    </div>
                  </div>
                </div>

                {/* Date Information */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Analyzed {selectedHistoryItem.createdAt ? 
                      formatDistanceToNow(new Date(selectedHistoryItem.createdAt), { addSuffix: true }) : 
                      'Unknown time'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
