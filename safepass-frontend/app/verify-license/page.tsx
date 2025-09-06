'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Search, Shield, Globe, Calendar, Clock, Copy, Share2, QrCode, Info } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useSearchParams } from 'next/navigation';

interface PublicVerificationResult {
  proof_id: string;
  exists: boolean;
  is_valid: boolean;
  timestamp: string;
}

export default function PublicVerifyLicensePage() {
  const searchParams = useSearchParams();
  const [proofId, setProofId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Auto-populate proof ID from URL params
  useEffect(() => {
    const urlProofId = searchParams.get('proofId');
    if (urlProofId) {
      setProofId(urlProofId);
      // Auto-verify if proof ID is provided in URL
      handleVerify(urlProofId);
    }
  }, [searchParams]);

  const handleVerify = async (id?: string) => {
    const targetProofId = id || proofId.trim();
    if (!targetProofId) {
      setError('Please enter a proof ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.validateProofExists(targetProofId);
      setResult({
        proof_id: data.proof_id,
        exists: data.exists,
        is_valid: data.is_valid,
        timestamp: data.timestamp
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyProofId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy proof ID:', err);
    }
  };

  const handleShareProofId = async (id: string) => {
    const shareData = {
      title: 'Agency License Verification',
      text: `Verify this agency's license using proof ID: ${id}`,
      url: `${window.location.origin}/verify-license?proofId=${id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to share proof ID:', err);
    }
  };

  const generateQRCode = (id: string) => {
    const url = `${window.location.origin}/verify-license?proofId=${id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const handleClear = () => {
    setProofId('');
    setResult(null);
    setError(null);
    // Clear URL params
    window.history.replaceState({}, '', '/verify-license');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (isValid: boolean) => {
    return isValid ? 
      <Badge variant="default" className="bg-green-500">Valid License</Badge> : 
      <Badge variant="destructive">Invalid License</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-viridian-green rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-dark-jungle-green">SafePass</h1>
          </div>
          <h2 className="text-2xl font-semibold text-slate-700 mb-2">Public License Verification</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Verify agency licenses instantly using Zero-Knowledge Proof technology. 
            No registration required - completely public and transparent.
          </p>
        </div>

        {/* Public Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Public Verification Service</h3>
                <p className="text-blue-800 text-sm">
                  This is a public service that allows anyone to verify agency licenses without revealing sensitive information. 
                  The verification uses cryptographic proofs to ensure authenticity while maintaining privacy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              License Verification
            </CardTitle>
            <CardDescription>
              Enter a proof ID provided by an agency to verify their license authenticity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proofId">Proof ID</Label>
              <div className="flex gap-2">
                <Input
                  id="proofId"
                  placeholder="Enter proof ID (e.g., 550e8400-e29b-41d4-a716-446655440000)"
                  value={proofId}
                  onChange={(e) => setProofId(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleVerify()} 
                  disabled={loading || !proofId.trim()}
                  className="min-w-[100px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Verify
                    </div>
                  )}
                </Button>
                {(result || error) && (
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.is_valid && result.exists)}
                  Verification Result
                </div>
                {getStatusBadge(result.is_valid && result.exists)}
              </CardTitle>
              <CardDescription>
                Proof ID: <code className="bg-muted px-2 py-1 rounded text-sm">{result.proof_id}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Message */}
              <Alert variant={result.is_valid && result.exists ? "default" : "destructive"}>
                <AlertDescription className="font-medium">
                  {result.exists && result.is_valid 
                    ? "✅ This license proof is valid and verified" 
                    : result.exists 
                    ? "❌ This license proof exists but is invalid" 
                    : "❌ This proof ID does not exist in our system"}
                </AlertDescription>
              </Alert>

              {/* Verification Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Verification Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Proof Exists</Label>
                    <Badge variant={result.exists ? "default" : "destructive"}>
                      {result.exists ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Proof Valid</Label>
                    <Badge variant={result.is_valid ? "default" : "destructive"}>
                      {result.is_valid ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Verified At</Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(result.timestamp)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Verification Type</Label>
                    <Badge variant="outline">Zero-Knowledge Proof</Badge>
                  </div>
                </div>
              </div>

              {/* Privacy Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-green-900">🔒 Privacy Protected Verification</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• The actual license number is never revealed</li>
                  <li>• Only the validity of the license is confirmed</li>
                  <li>• Uses cryptographic Zero-Knowledge Proof technology</li>
                  <li>• Verification is tamper-proof and mathematically secure</li>
                </ul>
              </div>

              {/* Sharing Section */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share this verification result or save it for your records.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyProofId(result.proof_id)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copySuccess ? 'Copied!' : 'Copy Proof ID'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareProofId(result.proof_id)}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(generateQRCode(result.proof_id), '_blank')}
                    className="flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </Button>
                </div>
                
                {/* QR Code Preview */}
                <div className="mt-4 p-4 bg-white rounded-lg border inline-block">
                  <img 
                    src={generateQRCode(result.proof_id)} 
                    alt="QR Code for verification"
                    className="w-32 h-32"
                  />
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Scan to verify
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Verified at: {formatDate(result.timestamp)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How it Works Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              How License Verification Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">For Workers & Public</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                    <p>Get a proof ID from an agency</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                    <p>Enter the proof ID above</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                    <p>Get instant verification results</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">For Agencies</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex gap-3">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                    <p>Generate ZKP proofs for your licenses</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                    <p>Share proof IDs with workers</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                    <p>License numbers stay private</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 mt-8">
          <p>Powered by SafePass - Secure, Private, Transparent License Verification</p>
          <p className="mt-1">Using Zero-Knowledge Proof Technology</p>
        </div>
      </div>
    </div>
  );
}
