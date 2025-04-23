"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Shield, X, Search } from "lucide-react"
import { useWallet } from "@/lib/use-wallet"
import { useDropzone } from "react-dropzone"
import { toast } from "@/hooks/use-toast"
import { Markdown } from "@/components/ui/markdown"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Footer from "@/components/footer"
import { nanoid } from 'nanoid';

interface AuditHistory {
  vulnerabilities: {
    title: string;
    description: string;
    severity: string;
    location?: string;
  }[];
  contractId: string;
  contractName: string;
  analysis: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  contractCode: string;
}

export default function AIAuditorPage() {
  const { address } = useWallet()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [severity, setSeverity] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('LOW')
  const [file, setFile] = useState<File | null>(null)
  const [contractName, setContractName] = useState("")
  const [contractCode, setContractCode] = useState("")
  const [vulnerabilities, setVulnerabilities] = useState<{
    title: string;
    description: string;
    severity: string;
    location?: string;
  }[]>([])
  const [auditHistory, setAuditHistory] = useState<AuditHistory[]>([])
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload')
  const [selectedAudit, setSelectedAudit] = useState<AuditHistory | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Fetch audit history
  const fetchAuditHistory = async () => {
    try {
      const response = await fetch(
        `/api/blockchain/audit-history`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${address}`
          },
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setAuditHistory(data.audits || [])
    } catch (error: any) {
      console.error("[FETCH_AUDIT_HISTORY_ERROR]", error)
      toast({
        title: "Error",
        description: "Failed to fetch audit history",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (address) {
      fetchAuditHistory()
    }
  }, [address])

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setFile(file)
      setContractName(file.name.replace('.sol', ''))
      
      // Read file content
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text === "string") {
          setContractCode(text)
        }
      }
      reader.readAsText(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.sol'],
      'text/x-solidity': ['.sol'],
    },
    maxFiles: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!file && !contractCode) || !address) {
      toast({
        title: "Error",
        description: !address ? "Please connect your wallet first" : "Please provide a contract",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/blockchain/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${address}`
        },
        body: JSON.stringify({
          walletId: address,
          contractCode: contractCode,
          contractName: contractName || 'Unnamed Contract'
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setAnalysis(data.analysis)
      setSeverity(data.severity || 'LOW')
      setVulnerabilities(data.vulnerabilities || [])
      
      // Create a temporary audit object to show in modal
      const newAudit: AuditHistory = {
        contractId: nanoid(),
        contractName: contractName,
        analysis: data.analysis,
        severity: data.severity || 'LOW',
        createdAt: new Date().toISOString(),
        contractCode: contractCode,
        vulnerabilities: data.vulnerabilities || []
      }
      setSelectedAudit(newAudit)
      
      await fetchAuditHistory() // Refresh history after successful audit
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze contract",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter and paginate audit history
  const filteredAudits = useMemo(() => {
    return auditHistory.filter(audit => 
      audit.contractName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.severity.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [auditHistory, searchQuery])

  const totalPages = Math.ceil(filteredAudits.length / itemsPerPage)
  const paginatedAudits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredAudits.slice(start, end)
  }, [filteredAudits, currentPage])

  return (
    <div className="flex-1 flex flex-col space-y-8">
      <div className="flex flex-col space-y-8  p-8 pt-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            AI Smart Contract Auditor
          </h1>
          <p className="text-muted-foreground text-lg">
            Analyze your smart contracts for vulnerabilities and best practices.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Section */}
          <Card className="border-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Contract Input</CardTitle>
              <CardDescription>Upload or paste your smart contract code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Contract Name (optional)"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="mb-4"
                />

                <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'upload' | 'paste')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="paste">Paste Code</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4">
                    <div
                      {...getRootProps()}
                      className={`
                        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                        transition-colors duration-200
                        ${isDragActive ? "border-primary bg-primary/5" : "border-muted"}
                        ${file ? "bg-muted/5" : ""}
                      `}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        {file ? (
                          <div className="text-sm text-muted-foreground">
                            Selected file: {file.name}
                          </div>
                        ) : isDragActive ? (
                          <div className="text-sm text-muted-foreground">
                            Drop the file here
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Drag & drop a Solidity file (.sol) here, or click to select
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="paste" className="mt-4">
                    <Textarea
                      placeholder="Paste your Solidity contract code here"
                      value={contractCode}
                      onChange={(e) => setContractCode(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </TabsContent>
                </Tabs>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || (!file && !contractCode)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-2 bg-[#0B0F1C] border-[#1F2937]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-white">Analysis Results</CardTitle>
              <CardDescription className="text-gray-400">Smart contract analysis report</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="space-y-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-gray-400">Analyzing your smart contract...</p>
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <h3 className="text-lg font-medium text-white">{contractName}.sol</h3>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      severity === "HIGH" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                      severity === "MEDIUM" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                      "bg-green-500/10 text-green-500 border border-green-500/20"
                    }`}>
                      {severity} Risk
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-400">Analysis Report</h4>
                    <div className="prose prose-invert max-w-none prose-p:text-gray-300 bg-[#151B2B] rounded-lg p-4 border border-[#1F2937]">
                      <Markdown content={analysis.split('\n').slice(0, 3).join('\n')} />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full bg-[#151B2B] border-[#1F2937] hover:bg-[#1C2333] text-white hover:text-white transition-colors group relative overflow-hidden"
                    onClick={() => {
                      // Get the latest audit from history
                      const latestAudit = auditHistory[0];
                      if (latestAudit) {
                        setSelectedAudit(latestAudit);
                      }
                    }}
                  >
                    <span className="relative z-10">See Full Report</span>
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-[#151B2B] border border-[#1F2937] flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-400">Submit a contract to see the analysis</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Detail Modal */}
          <Dialog open={!!selectedAudit} onOpenChange={(open) => !open && setSelectedAudit(null)}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 bg-[#0B0F1C] relative fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">

              <div className="h-full flex flex-col overflow-hidden">
                <div className="px-6 pt-6 pb-4">
                  <DialogTitle className="text-xl text-white mb-1">Audit Details</DialogTitle>
                  {selectedAudit && (
                    <p className="text-sm text-gray-400">
                      Contract: {selectedAudit.contractName}
                    </p>
                  )}
                </div>

                {selectedAudit && (
                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <h3 className="text-sm text-gray-400">Audit Date</h3>
                          <p className="text-white">
                            {new Date(selectedAudit.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-sm text-gray-400">Risk Level</h3>
                          <div className={`inline-block px-2 py-0.5 rounded-md text-sm font-medium ${
                            selectedAudit.severity === "HIGH" ? "bg-red-500/20 text-red-500" :
                            selectedAudit.severity === "MEDIUM" ? "bg-yellow-500/20 text-yellow-500" :
                            "bg-green-500/20 text-green-500"
                          }`}>
                            {selectedAudit.severity}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm text-gray-400">Analysis Report</h3>
                        <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white">
                          <Markdown content={selectedAudit.analysis} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm text-gray-400">Contract Code</h3>
                        <pre className="p-4 bg-[#151B2B] rounded-lg overflow-x-auto text-sm text-gray-300">
                          <code>{selectedAudit.contractCode}</code>
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm text-gray-400">Contract Vulnerabilities</h3>
                        <div className="space-y-4 p-4 bg-[#151B2B] rounded-lg text-sm text-gray-300">
                          {selectedAudit.vulnerabilities.map((vuln, index) => (
                            <div key={index} className="space-y-4 border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-white">{vuln.title}</h4>
                                <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  vuln.severity === "HIGH" ? "bg-red-500/20 text-red-500" :
                                  vuln.severity === "MEDIUM" ? "bg-yellow-500/20 text-yellow-500" :
                                  "bg-green-500/20 text-green-500"
                                }`}>
                                  {vuln.severity}
                                </div>
                              </div>
                              <p className="text-gray-400">{vuln.description}</p>
                              {vuln.location && (
                                <div className="text-xs text-gray-500">
                                  Location: {vuln.location}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Audit History Section */}
        <Card className="border-2 bg-[#0B0F1C] border-[#1F2937]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white">Previous Audits</CardTitle>
            <CardDescription className="text-gray-400">History of your smart contract audits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by contract name or severity..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1) // Reset to first page on search
                  }}
                  className="w-full pl-8 pr-4 py-2 bg-[#151B2B] border border-[#1F2937] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Audit List */}
              {filteredAudits.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {searchQuery ? 'No audits found matching your search' : 'No previous audits found'}
                </div>
              ) : (
                <div className="grid gap-3">
                  {paginatedAudits.map((audit) => (
                    <div
                      key={audit.contractId}
                      className="group relative border border-[#1F2937] bg-[#151B2B] hover:bg-[#1C2333] rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-lg"
                      onClick={() => setSelectedAudit(audit)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <h3 className="font-medium text-white">{audit.contractName}.sol</h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {new Date(audit.createdAt).toLocaleDateString()}
                            </div>
                            <span className="text-gray-600">•</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-60" />
                              {new Date(audit.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          audit.severity === "HIGH" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                          audit.severity === "MEDIUM" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                          "bg-green-500/10 text-green-500 border border-green-500/20"
                        }`}>
                          {audit.severity} Risk
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {filteredAudits.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#1F2937]">
                  <div className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAudits.length)} of {filteredAudits.length}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#151B2B] border-[#1F2937] hover:bg-[#1C2333] text-white"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#151B2B] border-[#1F2937] hover:bg-[#1C2333] text-white"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}
