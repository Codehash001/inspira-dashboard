"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Clock } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useWallet } from "@/lib/use-wallet"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from 'date-fns'

interface BookGradingResult {
  bookId: string
  bookName: string
  authorName: string
  languageGrade: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
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
      const response = await fetch(`/api/book-grading/history?walletId=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
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

  useEffect(() => {
    if (address) {
      fetchHistory();
    }
  }, [address]);

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

      const response = await fetch('/api/book-grading', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grade book')
      }

      setResults(data)
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
    <div className="h-[calc(100vh-65px)] flex flex-col">
      <div className="flex-none p-4">
        <h1 className="text-3xl font-bold tracking-tight">Book Language Grading</h1>
        <p className="text-muted-foreground mt-2">
          Upload a book to analyze its language complexity and get a CEFR grade
        </p>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-8">
        <div className="container max-w-7xl mx-auto space-y-8">
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
                        <p className="text-xs text-muted-foreground mt-1">Supports PDF, TXT, and EPUB files</p>
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
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Book Information</h3>
                      <p className="text-lg font-medium">{results.bookName}</p>
                      <p className="text-sm text-muted-foreground">by {results.authorName}</p>
                    </div>

                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Language Grade</h3>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {results.languageGrade}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Analysis</h3>
                      <p className="text-sm leading-relaxed">{results.analysis}</p>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Credits Used</p>
                          <p className="font-medium">{results.creditUsed.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tokens Used</p>
                          <p className="font-medium">{results.tokenUsed.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* History Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Grading History</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchHistory}
                disabled={isLoadingHistory}
              >
                {isLoadingHistory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            {history.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">No grading history found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {history.map((item) => (
                  <Card key={item.bookId}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="line-clamp-1">{item.bookName}</CardTitle>
                          <p className="text-sm text-muted-foreground">by {item.authorName}</p>
                        </div>
                        <Badge variant="secondary">{item.languageGrade}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">{item.analysis}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Credits</p>
                            <p className="font-medium">{item.creditUsed.toFixed(3)}</p>
                          </div>
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
