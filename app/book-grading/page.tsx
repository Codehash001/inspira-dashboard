"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"
import { useDropzone } from "react-dropzone"

export default function BookGradingPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/grade-book', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to grade book')
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error grading book:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base Background Color */}
      <div className="fixed inset-0" />
      
      {/* Animated Gradient Background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(32, 244, 204, 0.08) 0%, 
            rgba(0, 24, 49, 0.08) 50%, 
            transparent 70%
          )`,
          filter: 'blur(120px)',
          transform: 'translate3d(0, 0, 0)',
          animation: 'moveGradient 30s alternate infinite'
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(32, 196, 244, 0.08) 0%, 
            rgba(0, 49, 49, 0.08) 50%, 
            transparent 70%
          )`,
          filter: 'blur(120px)',
          transform: 'translate3d(0, 0, 0)',
          animation: 'moveGradient2 30s alternate infinite'
        }}
      />
      
      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-20" />

      <style jsx>{`
        @keyframes moveGradient {
          0% {
            transform: translate3d(-30%, -30%, 0) scale(1.5);
          }
          50% {
            transform: translate3d(0%, 0%, 0) scale(1);
          }
          100% {
            transform: translate3d(30%, 30%, 0) scale(1.5);
          }
        }
        @keyframes moveGradient2 {
          0% {
            transform: translate3d(30%, 30%, 0) scale(1.5);
          }
          50% {
            transform: translate3d(0%, 0%, 0) scale(1);
          }
          100% {
            transform: translate3d(-30%, -30%, 0) scale(1.5);
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 backdrop-blur-xl z-10 py-6 border-b border-[hsl(var(--theme-fg))]/10">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#20F4CC] to-[#20C4F4]">
            Book Grading
          </h1>
          <p className="text-sm md:text-base text-[hsl(var(--theme-fg))]/60 mb-6">
            Analyze and grade books according to different leveling standards
          </p>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto py-8 px-4 relative">
        <Card className="border-0 shadow-lg glass-card">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#20F4CC] to-[#20C4F4]">
              Book Grading
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div 
                {...getRootProps()} 
                className={`
                  border border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
                  flex flex-col items-center justify-center text-center
                  hover:border-[#20F4CC] hover:bg-[#20F4CC]/5
                  ${isDragActive 
                    ? 'border-[#20F4CC] bg-[#20F4CC]/5' 
                    : 'border-[hsl(var(--theme-fg))]/20'
                  }
                  ${file ? 'bg-[#20F4CC]/5 border-[#20F4CC]' : ''}
                  glass-card
                `}
              >
                <input {...getInputProps()} />
                <Upload 
                  className={`w-8 h-8 mb-3 ${
                    file ? 'text-[#20F4CC]' : 'text-[hsl(var(--theme-fg))]/50'
                  }`} 
                />
                {file ? (
                  <>
                    <p className="text-[#20F4CC] font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-[hsl(var(--theme-fg))]/50 mt-1">
                      Click or drag to replace
                    </p>
                  </>
                ) : isDragActive ? (
                  <p className="font-medium text-sm">Drop your PDF here</p>
                ) : (
                  <>
                    <p className="font-medium text-sm">Drop your PDF here or click to browse</p>
                    <p className="text-xs text-[hsl(var(--theme-fg))]/50 mt-1">
                      Support for PDF files only
                    </p>
                  </>
                )}
              </div>

              <Button
                type="submit"
                disabled={!file || isLoading}
                className="w-full h-10 text-sm font-medium bg-gradient-to-r from-[#20F4CC] to-[#20C4F4] text-white hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Book...
                  </>
                ) : (
                  'Grade Book'
                )}
              </Button>
            </form>

            {results && (
              <div className="mt-8 space-y-4">
                <div className="grid gap-4">
                  <div className="rounded-lg p-4 bg-[hsl(var(--theme-bg))] border border-[hsl(var(--theme-fg))]/20 glass-card">
                    <h3 className="text-lg font-medium mb-3">Reading Level Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-[hsl(var(--theme-fg))]/60">Lexile Score</p>
                        <p className="text-lg font-medium">{results.grades.lexile.score}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-[hsl(var(--theme-fg))]/60">Grade Level</p>
                        <p className="text-lg font-medium">{results.grades.readingLevel.grade}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg p-4 bg-[hsl(var(--theme-bg))] border border-[hsl(var(--theme-fg))]/20 glass-card">
                    <h3 className="text-lg font-medium mb-3">Complexity Factors</h3>
                    <div className="space-y-3">
                      {Object.entries(results.grades.complexity.factors).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{key}</span>
                          <div className="w-48 h-2 bg-[hsl(var(--theme-fg))]/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#20F4CC] to-[#20C4F4]"
                              style={{ width: `${value * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg p-4 bg-[hsl(var(--theme-bg))] border border-[hsl(var(--theme-fg))]/20 glass-card">
                    <h3 className="text-lg font-medium mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {results.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#20F4CC]" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
