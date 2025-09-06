'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink, Copy, Search } from 'lucide-react';

interface VerificationResult {
  success: boolean;
  verified?: boolean;
  verification?: {
    local: boolean;
    sepolia: boolean;
    sepoliaDetails: any;
  };
  transactionHash?: string;
  batchId?: number;
  merkleRoot?: string;
  verifiedAt?: string;
  etherscanUrl?: string;
  proofData?: any;
  error?: string;
  suggestion?: string;
}

export default function VerifyTransactionPage() {
  const [transactionHash, setTransactionHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProofDetails, setShowProofDetails] = useState(false);

  const validateTransactionHash = (hash: string): boolean => {
    return Boolean(hash && hash.startsWith('0x') && hash.length === 66 && /^0x[a-fA-F0-9]{64}$/.test(hash));
  };

  const handleVerify = async () => {
    if (!transactionHash) return;
    
    if (!validateTransactionHash(transactionHash)) {
      setVerificationResult({
        success: false,
        error: 'Invalid transaction hash format. Must be 66 characters starting with 0x.',
        suggestion: 'Please enter a valid Ethereum transaction hash.'
      });
      return;
    }
    
    setLoading(true);
    setVerificationResult(null);
    
    try {
      // Step 1: Get proof
      const proofResponse = await fetch(`/api/verification/proof/${transactionHash}`);
      const proofData = await proofResponse.json();
      
      if (!proofData.success) {
        throw new Error(proofData.error);
      }
      
      // Step 2: Verify proof
      const verifyResponse = await fetch('/api/verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash,
          proof: proofData.data.proof,
          merkleRoot: proofData.data.merkleRoot,
          batchId: proofData.data.batchId
        })
      });
      
      const verifyData = await verifyResponse.json();
      setVerificationResult({
        ...verifyData,
        proofData: proofData.data
      });
      
    } catch (error: any) {
      setVerificationResult({
        success: false,
        error: error.message,
        suggestion: error.message.includes('not found') ? 
          'Transaction may not have been anchored yet. Anchoring happens daily at 2 AM UTC.' : 
          'Please check the transaction hash and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatHash = (hash: string, length: number = 10) => {
    if (!hash) return '';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 Transaction Verification</h1>
        <p className="text-muted-foreground">
          Verify that a transaction was included in the SafePass private blockchain and anchored to Ethereum Sepolia
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Verify Transaction
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a transaction hash from the SafePass private blockchain to verify its inclusion and public anchoring
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Transaction Hash
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="0x1234567890abcdef..."
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                className={`font-mono ${!validateTransactionHash(transactionHash) && transactionHash ? 'border-red-300' : ''}`}
              />
              <Button 
                onClick={handleVerify} 
                disabled={!transactionHash || loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
            {transactionHash && !validateTransactionHash(transactionHash) && (
              <p className="text-sm text-red-600 mt-1">
                Invalid format. Transaction hash must be 66 characters starting with 0x
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {verificationResult && (
        <VerificationResult 
          result={verificationResult} 
          onShowProofDetails={() => setShowProofDetails(!showProofDetails)}
          showProofDetails={showProofDetails}
        />
      )}

      {/* Information Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">How Verification Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs mt-0.5">1</div>
            <div>
              <strong>Transaction Lookup:</strong> We search for your transaction in our anchored batches
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs mt-0.5">2</div>
            <div>
              <strong>Merkle Proof Generation:</strong> We generate a cryptographic proof that your transaction was included
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs mt-0.5">3</div>
            <div>
              <strong>Public Verification:</strong> We verify the proof against the Merkle root stored on Ethereum Sepolia
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs mt-0.5">4</div>
            <div>
              <strong>Result:</strong> You get cryptographic proof that your transaction occurred and was publicly anchored
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VerificationResult({ 
  result, 
  onShowProofDetails, 
  showProofDetails 
}: { 
  result: VerificationResult;
  onShowProofDetails: () => void;
  showProofDetails: boolean;
}) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatHash = (hash: string, length: number = 10) => {
    if (!hash) return '';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  if (!result.success) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">❌ Verification Failed</Badge>
            </div>
            <p className="text-red-700 font-medium">{result.error}</p>
            {result.suggestion && (
              <p className="text-red-600 text-sm">{result.suggestion}</p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card className={`border-2 ${result.verified ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {result.verified ? (
                <Badge className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  ✅ Transaction Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  ⚠️ Partial Verification
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Verified at {new Date(result.verifiedAt || '').toLocaleString()}
            </div>
          </div>
          
          {/* Verification Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Verification Status</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Local Proof:</span>
                  <Badge variant={result.verification?.local ? "default" : "destructive"} className="text-xs">
                    {result.verification?.local ? "✅ Valid" : "❌ Invalid"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Sepolia Anchor:</span>
                  <Badge variant={result.verification?.sepolia ? "default" : "destructive"} className="text-xs">
                    {result.verification?.sepolia ? "✅ Confirmed" : "❌ Not Found"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Transaction Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>Batch ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    #{result.batchId}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Anchored:</span>
                  <span className="text-xs">
                    {result.proofData?.anchoredAt ? new Date(result.proofData.anchoredAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Transaction Hash</h4>
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
              <code className="text-xs flex-1 break-all font-mono">
                {result.transactionHash}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(result.transactionHash || '')}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Merkle Root */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Merkle Root (Anchored on Sepolia)</h4>
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
              <code className="text-xs flex-1 break-all font-mono">
                {result.merkleRoot}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(result.merkleRoot || '')}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* External Links */}
          <div className="flex flex-wrap gap-2">
            {result.etherscanUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={result.etherscanUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View on Etherscan
                </a>
              </Button>
            )}
            {result.proofData?.sepoliaContract && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://sepolia.etherscan.io/address/${result.proofData.sepoliaContract}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Anchor Contract
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onShowProofDetails}>
              {showProofDetails ? 'Hide' : 'Show'} Proof Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Proof Details */}
      {showProofDetails && result.proofData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cryptographic Proof Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Technical details of the Merkle proof used for verification
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Merkle Proof Path</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(result.proofData.proof, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Leaf Index:</strong> {result.proofData.leafIndex}
              </div>
              <div>
                <strong>Sepolia TX:</strong> 
                <a 
                  href={`https://sepolia.etherscan.io/tx/${result.proofData.sepoliaTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  {formatHash(result.proofData.sepoliaTxHash)}
                </a>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>How to verify independently:</strong> You can verify this proof using any Merkle tree library by reconstructing the root hash using the transaction hash and proof path, then comparing it with the root stored in the Sepolia contract at {result.proofData.sepoliaContract}.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
