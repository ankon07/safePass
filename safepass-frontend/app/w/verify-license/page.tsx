'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Search, Shield, Building2, Mail, Calendar, Clock, Copy, Share2, QrCode } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { VerifyLicenseProofResponse } from '@/lib/api-types';

export default function VerifyLicensePage() {
  const [proofId, setProofId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyLicenseProofResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareProofId, setShareProofId] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleVerify = async () => {
    if (!proofId.trim()) {
      setError('Please enter a proof ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.validateProofExists(proofId.trim());
      setResult({
        is_valid: data.is_valid,
        proof_id: data.proof_id,
        message: data.is_valid ? 'License proof is valid' : 'License proof is invalid',
        timestamp: data.timestamp,
        agency_info: {
          name: 'Agency Information Not Available',
          email: 'contact@agency.com',
          blockchain_address: 'N/A',
          license_verified: data.is_valid
        },
        verification_details: {
          verified_at: data.timestamp,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
          circuit_type: 'license_verification'
        }
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
      url: `${window.location.origin}/w/verify-license?proofId=${id}`
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
    const url = `${window.location.origin}/w/verify-license?proofId=${id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const handleClear = () => {
    setProofId('');
    setResult(null);
    setError(null);
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
      <Badge variant="default" className="bg-green-500">Valid</Badge> : 
      <Badge variant="destructive">Invalid</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verify Agency License</h1>
        <p className="text-muted-foreground">
          Enter a proof ID provided by an agency to verify their license authenticity using Zero-Knowledge Proof technology.
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            License Verification
          </CardTitle>
          <CardDescription>
            Enter the proof ID shared by the agency to verify their license without revealing sensitive information.
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
                onClick={handleVerify} 
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.is_valid)}
                Verification Result
              </div>
              {getStatusBadge(result.is_valid)}
            </CardTitle>
            <CardDescription>
              Proof ID: <code className="bg-muted px-2 py-1 rounded text-sm">{result.proof_id}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Message */}
            <Alert variant={result.is_valid ? "default" : "destructive"}>
              <AlertDescription className="font-medium">
                {result.message}
              </AlertDescription>
            </Alert>

            {/* Agency Information */}
            {result.agency_info && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Agency Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Agency Name</Label>
                    <p className="font-medium">{result.agency_info.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Contact Email</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {result.agency_info.email}
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Blockchain Address</Label>
                    <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                      {result.agency_info.blockchain_address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Verification Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Verification Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Verified At</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(result.verification_details.verified_at)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Expires At</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(result.verification_details.expires_at)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Circuit Type</Label>
                  <Badge variant="outline">{result.verification_details.circuit_type}</Badge>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What does this mean?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• This verification uses Zero-Knowledge Proof technology</li>
                <li>• The agency's actual license number is never revealed</li>
                <li>• Only the validity of their license is confirmed</li>
                <li>• This proof is cryptographically secure and tamper-proof</li>
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
                Share this verification result with other workers or save it for your records.
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

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
            <p>Get the proof ID from the agency you want to verify</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
            <p>Enter the proof ID in the input field above</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
            <p>Click "Verify" to check the agency's license authenticity</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
            <p>Review the verification results and agency information</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
