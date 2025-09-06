"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
  Home,
} from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";

interface VerificationResult {
  jwt: string;
  isValid: boolean;
  credentialData?: any;
  issuer?: any;
  credentialSubject?: any;
  issuanceDate?: string;
  type?: string[];
  verifiedAt: string;
  error?: string;
}

export default function PublicVerifyCredentialPage() {
  const searchParams = useSearchParams();
  const [jwtInput, setJwtInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Auto-load JWT from URL parameters
  useEffect(() => {
    const jwtFromUrl = searchParams.get('jwt');
    if (jwtFromUrl) {
      setJwtInput(jwtFromUrl);
      // Auto-verify if JWT is provided in URL
      handleVerifyCredential(jwtFromUrl);
    }
  }, [searchParams]);

  const handleVerifyCredential = async (jwtToken?: string) => {
    const tokenToVerify = jwtToken || jwtInput.trim();
    
    if (!tokenToVerify) {
      setError('Please enter a JWT token');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await apiClient.verifyCredential(tokenToVerify);
      
      const result: VerificationResult = {
        jwt: tokenToVerify,
        isValid: response.data.verified,
        credentialData: response.data,
        issuer: response.data.issuer,
        credentialSubject: response.data.credentialSubject,
        issuanceDate: response.data.issuanceDate,
        type: response.data.type,
        verifiedAt: new Date().toISOString(),
      };

      setVerificationResult(result);

    } catch (err: any) {
      console.error('Verification error:', err);
      const errorResult: VerificationResult = {
        jwt: tokenToVerify,
        isValid: false,
        verifiedAt: new Date().toISOString(),
        error: err.message || 'Failed to verify credential',
      };
      setVerificationResult(errorResult);
      setError(err.message || 'Failed to verify credential');
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setJwtInput("");
    setVerificationResult(null);
    setError(null);
    // Update URL to remove JWT parameter
    window.history.replaceState({}, '', '/verify-credential');
  };

  const handleCopyJWT = async (jwt: string) => {
    try {
      await navigator.clipboard.writeText(jwt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy JWT:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? 
      <CheckCircle className="h-6 w-6 text-green-500" /> : 
      <XCircle className="h-6 w-6 text-red-500" />;
  };

  const getStatusBadge = (isValid: boolean) => {
    return isValid ? 
      <Badge variant="default" className="bg-green-500 text-lg px-3 py-1">✅ Valid</Badge> : 
      <Badge variant="destructive" className="text-lg px-3 py-1">❌ Invalid</Badge>;
  };

  const getCredentialDisplayName = (type: string) => {
    return type
      .replace('Verified', '')
      .replace('Credential', '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">SafePass</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Credential Verification
          </h2>
          <p className="text-gray-600">
            Verify the authenticity of worker credentials using blockchain technology
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-6">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to SafePass
          </Button>
        </div>

        {/* Verification Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Verify Credential
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter or paste the JWT token to verify a worker's credential
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jwt-input">JWT Token</Label>
              <Input
                id="jwt-input"
                placeholder="Paste JWT token here..."
                value={jwtInput}
                onChange={(e) => setJwtInput(e.target.value)}
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => handleVerifyCredential()} 
                disabled={loading || !jwtInput.trim()}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Verify Credential
                  </>
                )}
              </Button>
              {(verificationResult || error) && (
                <Button variant="outline" onClick={handleClearForm}>
                  Clear
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Verification Results */}
        {verificationResult && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {getStatusIcon(verificationResult.isValid)}
                  Verification Result
                </CardTitle>
                {getStatusBadge(verificationResult.isValid)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Message */}
              <Alert variant={verificationResult.isValid ? "default" : "destructive"} className="border-2">
                <AlertDescription className="font-medium text-lg">
                  {verificationResult.isValid 
                    ? "🎉 This credential is valid and authentic!"
                    : "⚠️ This credential is invalid or could not be verified"
                  }
                  {verificationResult.error && ` - ${verificationResult.error}`}
                </AlertDescription>
              </Alert>

              {verificationResult.isValid && verificationResult.credentialSubject && (
                <>
                  {/* Worker Information */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2 text-blue-700">
                      <User className="h-5 w-5" />
                      Worker Information
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-blue-700">Worker Identity</Label>
                          <p className="font-mono text-sm bg-white p-2 rounded border break-all">
                            {verificationResult.credentialSubject.id}
                          </p>
                        </div>
                        {verificationResult.credentialSubject.documentType && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-blue-700">Document Type</Label>
                            <Badge variant="outline" className="text-base px-3 py-1">
                              {verificationResult.credentialSubject.documentType}
                            </Badge>
                          </div>
                        )}
                        {verificationResult.credentialSubject.verificationDate && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-blue-700">Verification Date</Label>
                            <p className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(verificationResult.credentialSubject.verificationDate)}
                            </p>
                          </div>
                        )}
                        {verificationResult.credentialSubject.verifiedBy && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-blue-700">Verified By</Label>
                            <p className="font-medium">{verificationResult.credentialSubject.verifiedBy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Credential Details */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2 text-green-700">
                      <FileText className="h-5 w-5" />
                      Credential Details
                    </h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {verificationResult.type && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-700">Credential Type</Label>
                            <div className="flex flex-wrap gap-2">
                              {verificationResult.type.map((t, index) => (
                                <Badge key={index} variant="outline" className="text-base px-3 py-1">
                                  {getCredentialDisplayName(t)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {verificationResult.issuanceDate && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-700">Issued Date</Label>
                            <p className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(verificationResult.issuanceDate)}
                            </p>
                          </div>
                        )}
                        {verificationResult.issuer && (
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-medium text-green-700">Issuer (Regulator)</Label>
                            <p className="font-mono text-sm bg-white p-2 rounded border break-all">
                              {typeof verificationResult.issuer === 'string' 
                                ? verificationResult.issuer 
                                : verificationResult.issuer.id}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security & Trust
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✅ This credential is cryptographically signed and tamper-proof</li>
                      <li>✅ Issued by an authorized regulator on the SafePass platform</li>
                      <li>✅ Verified using blockchain technology for maximum security</li>
                      <li>✅ No personal information is exposed during verification</li>
                    </ul>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyJWT(verificationResult.jwt)}
                  className="flex items-center gap-2"
                >
                  {copySuccess ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copySuccess ? 'Copied!' : 'Copy JWT Token'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit SafePass Platform
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                Verified at: {formatDate(verificationResult.verifiedAt)} | Powered by SafePass
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>About SafePass Credential Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">🔒 Secure & Private</h4>
                <p className="text-sm text-gray-600">
                  All credentials are verified using blockchain technology without exposing personal information.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚡ Instant Verification</h4>
                <p className="text-sm text-gray-600">
                  Get immediate verification results without contacting the issuing authority.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🌐 Globally Accessible</h4>
                <p className="text-sm text-gray-600">
                  Verify credentials from anywhere in the world, 24/7.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🛡️ Tamper-Proof</h4>
                <p className="text-sm text-gray-600">
                  Cryptographic signatures ensure credentials cannot be forged or modified.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                SafePass - Securing the future of work through verifiable credentials
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
