'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Search, 
  Shield, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Copy,
  ArrowLeft,
  AlertCircle,
  Info
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { MerkleProofResponse, MerkleVerifyRequest } from '@/lib/api-types'
import Link from 'next/link'
// import { toast } from 'sonner' // Removed for now - will use alert instead

export default function TransactionVerifyPage() {
  const searchParams = useSearchParams()
  const [transactionHash, setTransactionHash] = useState(searchParams.get('hash') || '')
  const [proofData, setProofData] = useState<MerkleProofResponse | null>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hashParam = searchParams.get('hash')
    if (hashParam) {
      setTransactionHash(hashParam)
      handleGenerateProof(hashParam)
    }
  }, [searchParams])

  const handleGenerateProof = async (hash?: string) => {
    const targetHash = hash || transactionHash
    if (!targetHash.trim()) {
      setError('Please enter a transaction hash')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setProofData(null)
      setVerificationResult(null)

      const proof = await apiClient.generateMerkleProof(targetHash)
      setProofData(proof)
    } catch (err: any) {
      setError(err.message || 'Failed to generate proof')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyProof = async () => {
    if (!proofData) return

    try {
      setVerifying(true)
      const verifyRequest: MerkleVerifyRequest = {
        transactionHash: proofData.data.transactionHash,
        proof: proofData.data.proof,
        merkleRoot: proofData.data.merkleRoot,
        batchId: proofData.data.batchId
      }

      const result = await apiClient.verifyMerkleProof(verifyRequest)
      setVerificationResult(result)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    // toast.success(`${label} copied to clipboard`) // Replaced with alert for now
    alert(`${label} copied to clipboard`)
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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
          <h1 className="text-3xl font-bold">Transaction Verification</h1>
          <p className="text-muted-foreground">
            Verify transaction integrity using cryptographic proofs
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Transaction Hash</CardTitle>
          <CardDescription>
            Provide the transaction hash to generate and verify its Merkle proof
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="0x1234567890abcdef..."
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerateProof()}
              className="font-mono"
            />
            <Button 
              onClick={() => handleGenerateProof()} 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Generate Proof
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Proof Data Section */}
      {proofData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Merkle Proof Generated
            </CardTitle>
            <CardDescription>
              Cryptographic proof data for transaction verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transaction Info */}
            <div className="space-y-3">
              <h4 className="font-semibold">Transaction Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                      {proofData.data.transactionHash}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(proofData.data.transactionHash, 'Transaction hash')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Batch ID</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      #{proofData.data.batchId}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Anchored: {formatDate(proofData.data.anchoredAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Merkle Root */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Merkle Root</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  {proofData.data.merkleRoot}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(proofData.data.merkleRoot, 'Merkle root')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <a
                  href={`https://sepolia.etherscan.io/tx/${proofData.data.sepoliaTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Merkle Proof */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Merkle Proof ({proofData.data.proof.length} hashes)
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {proofData.data.proof.map((proofItem: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-8">#{index}</span>
                    <code className="flex-1 p-1 bg-muted rounded text-xs font-mono">
                      {proofItem.data} ({proofItem.position})
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(proofItem.data, `Proof hash ${index}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Verification Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handleVerifyProof} 
                disabled={verifying}
                size="lg"
                className="min-w-[200px]"
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Verify Proof
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verificationResult.data.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Verification Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6">
              {verificationResult.data.isValid ? (
                <div className="text-center space-y-2">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-green-700">Verification Successful</h3>
                  <p className="text-muted-foreground">
                    The transaction is cryptographically verified and authentic
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-red-700">Verification Failed</h3>
                  <p className="text-muted-foreground">
                    The proof could not be verified - transaction may be invalid or tampered
                  </p>
                </div>
              )}
            </div>

            {verificationResult.data.details && (
              <div className="space-y-2">
                <h4 className="font-semibold">Verification Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Computed Root:</span>
                    <code className="block mt-1 p-2 bg-muted rounded font-mono text-xs break-all">
                      {verificationResult.data.details.computedRoot}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Expected Root:</span>
                    <code className="block mt-1 p-2 bg-muted rounded font-mono text-xs break-all">
                      {verificationResult.data.details.expectedRoot}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Verification Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">1. Proof Generation</h4>
              <p>
                The system generates a Merkle proof - a cryptographic path from your transaction 
                to the Merkle root anchored on Sepolia blockchain.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">2. Cryptographic Verification</h4>
              <p>
                The proof is verified by recomputing the Merkle root using the provided path 
                and comparing it with the anchored root.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">3. Blockchain Anchoring</h4>
              <p>
                Merkle roots are anchored to Ethereum Sepolia every 24 hours, providing 
                immutable proof of transaction existence and integrity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">4. Public Verifiability</h4>
              <p>
                Anyone can verify the proof independently using the public Sepolia blockchain, 
                ensuring transparency without compromising privacy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
