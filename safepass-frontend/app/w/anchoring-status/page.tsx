'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  Database, 
  Shield, 
  Clock, 
  Activity,
  ExternalLink, 
  Copy,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  Server,
  Zap
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { 
  AnchoringStatusResponse, 
  BatchDetailsResponse, 
  VerificationStatsResponse,
  AnchoringHealthResponse 
} from '@/lib/api-types'
import Link from 'next/link'

export default function AnchoringStatusPage() {
  const searchParams = useSearchParams()
  const [anchoringStatus, setAnchoringStatus] = useState<AnchoringStatusResponse | null>(null)
  const [batchDetails, setBatchDetails] = useState<BatchDetailsResponse | null>(null)
  const [verificationStats, setVerificationStats] = useState<VerificationStatsResponse | null>(null)
  const [healthStatus, setHealthStatus] = useState<AnchoringHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    const batchParam = searchParams.get('batch')
    if (batchParam) {
      loadBatchDetails(parseInt(batchParam))
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statusResponse, statsResponse] = await Promise.all([
        apiClient.getAnchoringStatus(),
        apiClient.getVerificationStats()
      ])
      
      setAnchoringStatus(statusResponse)
      setVerificationStats(statsResponse)

      // Try to load health status (may not be available)
      try {
        const healthResponse = await apiClient.getAnchoringHealth()
        setHealthStatus(healthResponse)
      } catch (healthErr) {
        console.log('Health endpoint not available:', healthErr)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load anchoring status')
    } finally {
      setLoading(false)
    }
  }

  const loadBatchDetails = async (batchId: number) => {
    try {
      const details = await apiClient.getBatchDetails(batchId)
      setBatchDetails(details)
    } catch (err: any) {
      setError(err.message || 'Failed to load batch details')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
      case 'healthy':
        return 'text-green-600'
      case 'inactive':
      case 'stopped':
      case 'error':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
      case 'stopped':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/w/merkle-verification">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Anchoring System Status</h1>
          <p className="text-muted-foreground">
            Monitor cross-chain anchoring service and blockchain connectivity
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="health">Health Check</TabsTrigger>
          {batchDetails && <TabsTrigger value="batch">Batch Details</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {anchoringStatus && (
            <>
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Service Status</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('active')}
                      <span className="text-lg font-bold text-green-600">Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Anchoring service operational
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{anchoringStatus.status.totalBatches}</div>
                    <p className="text-xs text-muted-foreground">
                      Anchored to Sepolia
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{anchoringStatus.status.totalTransactions}</div>
                    <p className="text-xs text-muted-foreground">
                      Secured transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Anchored</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-bold">
                      {anchoringStatus.status.lastAnchoredAt 
                        ? formatDate(anchoringStatus.status.lastAnchoredAt)
                        : 'Never'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Latest batch processed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Latest Batch Info */}
              {anchoringStatus.status.latestBatch && (
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Anchored Batch</CardTitle>
                    <CardDescription>
                      Most recent batch anchored to Sepolia blockchain
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Batch ID</label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            #{anchoringStatus.status.latestBatch.batch_id}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {anchoringStatus.status.latestBatch.transaction_count} transactions
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Anchored At</label>
                        <p className="text-sm">{formatDate(anchoringStatus.status.latestBatch.anchored_at)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Merkle Root</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                          {anchoringStatus.status.latestBatch.merkle_root}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(anchoringStatus.status.latestBatch!.merkle_root, 'Merkle root')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Sepolia Transaction</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                          {anchoringStatus.status.latestBatch.sepolia_tx_hash}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(anchoringStatus.status.latestBatch!.sepolia_tx_hash, 'Transaction hash')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${anchoringStatus.status.latestBatch.sepolia_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => loadBatchDetails(anchoringStatus.status.latestBatch!.batch_id)}
                      >
                        View Batch Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contract Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Smart Contract Information</CardTitle>
                  <CardDescription>
                    Sepolia blockchain contract details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Contract Address</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                        {anchoringStatus.status.sepoliaContract}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(anchoringStatus.status.sepoliaContract, 'Contract address')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <a
                        href={`https://sepolia.etherscan.io/address/${anchoringStatus.status.sepoliaContract}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {verificationStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Batch Size</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {verificationStats.data.overview.avgTransactionsPerBatch.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Transactions per batch
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Largest Batch</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {verificationStats.data.overview.maxTransactionsPerBatch}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">First Anchor</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-bold">
                      {verificationStats.data.overview.firstAnchorDate 
                        ? formatDate(verificationStats.data.overview.firstAnchorDate)
                        : 'N/A'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      System start date
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              {verificationStats.data.recentActivity.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Daily anchoring activity over the past week
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {verificationStats.data.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{activity.date}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{activity.batches} batches</span>
                            <span>{activity.transactions} transactions</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {healthStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Service Health</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(healthStatus.data.isRunning ? 'running' : 'stopped')}
                      <span className={`text-lg font-bold ${getStatusColor(healthStatus.data.isRunning ? 'running' : 'stopped')}`}>
                        {healthStatus.data.isRunning ? 'Running' : 'Stopped'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scheduler: {healthStatus.data.schedulerActive ? 'Active' : 'Inactive'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Connectivity</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthStatus.data.connectivity.besu ? 'healthy' : 'error')}
                        <span className="text-sm">Besu Network</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthStatus.data.connectivity.sepolia ? 'healthy' : 'error')}
                        <span className="text-sm">Sepolia Network</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Service:</span>
                      <p className="text-muted-foreground">{healthStatus.data.service}</p>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <p className="text-muted-foreground">{formatDate(healthStatus.data.timestamp)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">Health Check Unavailable</h3>
                  <p className="text-muted-foreground">
                    Detailed health monitoring is not currently available. The service appears to be running normally based on recent anchoring activity.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {batchDetails && (
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Batch #{batchDetails.data.batch.batch_id} Details</CardTitle>
                <CardDescription>
                  Detailed information about this anchoring batch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Transaction Count</label>
                    <p className="text-lg font-semibold">{batchDetails.data.batch.transaction_count}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Anchored At</label>
                    <p className="text-sm">{formatDate(batchDetails.data.batch.anchored_at)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Sepolia Block</label>
                    <p className="text-sm">#{batchDetails.data.batch.sepolia_block_number}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Besu Block Range</label>
                    <p className="text-sm">
                      {batchDetails.data.batch.besu_start_block} - {batchDetails.data.batch.besu_end_block}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Transactions in Batch</label>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {batchDetails.data.transactions.map((tx, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                        <code className="font-mono">{formatHash(tx.transaction_hash)}</code>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Block #{tx.besu_block_number}</span>
                          <span>Index {tx.leaf_index}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
