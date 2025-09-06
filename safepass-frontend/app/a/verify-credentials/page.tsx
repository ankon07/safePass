"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Search,
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  History,
  Copy,
  Download,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
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

interface VerificationHistory {
  id: string;
  jwt: string;
  isValid: boolean;
  workerName?: string;
  credentialType?: string;
  verifiedAt: string;
  verifiedBy: string;
}

function AgencyVerifyCredentialsPage() {
  const { user } = useAuth();
  const [jwtInput, setJwtInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<VerificationHistory | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load verification history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('agency_verification_history');
    if (savedHistory) {
      try {
        setVerificationHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to load verification history:', err);
      }
    }
  }, []);

  // Save verification history to localStorage
  const saveVerificationHistory = (history: VerificationHistory[]) => {
    try {
      localStorage.setItem('agency_verification_history', JSON.stringify(history));
      setVerificationHistory(history);
    } catch (err) {
      console.error('Failed to save verification history:', err);
    }
  };

  const handleVerifyCredential = async () => {
    if (!jwtInput.trim()) {
      setError('Please enter a JWT token');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await apiClient.verifyCredential(jwtInput.trim());
      
      const result: VerificationResult = {
        jwt: jwtInput.trim(),
        isValid: response.data.verified,
        credentialData: response.data,
        issuer: response.data.issuer,
        credentialSubject: response.data.credentialSubject,
        issuanceDate: response.data.issuanceDate,
        type: response.data.type,
        verifiedAt: new Date().toISOString(),
      };

      setVerificationResult(result);

      // Add to verification history
      const historyItem: VerificationHistory = {
        id: Date.now().toString(),
        jwt: jwtInput.trim(),
        isValid: response.data.verified,
        workerName: response.data.credentialSubject?.id || 'Unknown',
        credentialType: response.data.type?.[1] || 'Unknown',
        verifiedAt: new Date().toISOString(),
        verifiedBy: user?.name || 'Agency User',
      };

      const updatedHistory = [historyItem, ...verificationHistory.slice(0, 49)]; // Keep last 50 items
      saveVerificationHistory(updatedHistory);

    } catch (err: any) {
      console.error('Verification error:', err);
      const errorResult: VerificationResult = {
        jwt: jwtInput.trim(),
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

  const handleViewHistoryItem = (item: VerificationHistory) => {
    setSelectedHistoryItem(item);
    setHistoryDialogOpen(true);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all verification history?')) {
      saveVerificationHistory([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const getCredentialDisplayName = (type: string) => {
    return type
      .replace('Verified', '')
      .replace('Credential', '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Verify Worker Credentials
        </h1>
        <p className="text-slate-500">
          Verify the authenticity of worker credentials using JWT tokens or QR codes.
        </p>
      </div>

      <Tabs defaultValue="verify" className="space-y-6">
        <TabsList>
          <TabsTrigger value="verify">Verify Credential</TabsTrigger>
          <TabsTrigger value="history">
            Verification History ({verificationHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verify" className="space-y-6">
          {/* Verification Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Credential Verification
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the JWT token provided by the worker to verify their credential authenticity.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jwt-input">JWT Token</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="jwt-input"
                    placeholder="Paste the JWT token here (e.g., eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ...)"
                    value={jwtInput}
                    onChange={(e) => setJwtInput(e.target.value)}
                    disabled={loading}
                    className="min-h-[100px] font-mono text-sm"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleVerifyCredential} 
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
                <Button variant="outline" disabled>
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR Code (Coming Soon)
                </Button>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(verificationResult.isValid)}
                    Verification Result
                  </CardTitle>
                  {getStatusBadge(verificationResult.isValid)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Message */}
                <Alert variant={verificationResult.isValid ? "default" : "destructive"}>
                  <AlertDescription className="font-medium">
                    {verificationResult.isValid 
                      ? "✅ This credential is valid and authentic"
                      : "❌ This credential is invalid or could not be verified"
                    }
                    {verificationResult.error && ` - ${verificationResult.error}`}
                  </AlertDescription>
                </Alert>

                {verificationResult.isValid && verificationResult.credentialSubject && (
                  <>
                    {/* Worker Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Worker Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Worker DID</Label>
                          <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                            {verificationResult.credentialSubject.id}
                          </p>
                        </div>
                        {verificationResult.credentialSubject.documentType && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Document Type</Label>
                            <Badge variant="outline">
                              {verificationResult.credentialSubject.documentType}
                            </Badge>
                          </div>
                        )}
                        {verificationResult.credentialSubject.verificationDate && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Verification Date</Label>
                            <p className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(verificationResult.credentialSubject.verificationDate)}
                            </p>
                          </div>
                        )}
                        {verificationResult.credentialSubject.verifiedBy && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Verified By</Label>
                            <p>{verificationResult.credentialSubject.verifiedBy}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Credential Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Credential Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {verificationResult.type && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Credential Type</Label>
                            <div className="flex flex-wrap gap-1">
                              {verificationResult.type.map((t, index) => (
                                <Badge key={index} variant="outline">
                                  {getCredentialDisplayName(t)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {verificationResult.issuanceDate && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Issued Date</Label>
                            <p className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(verificationResult.issuanceDate)}
                            </p>
                          </div>
                        )}
                        {verificationResult.issuer && (
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-medium text-muted-foreground">Issuer DID</Label>
                            <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                              {typeof verificationResult.issuer === 'string' 
                                ? verificationResult.issuer 
                                : verificationResult.issuer.id}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Claims */}
                    {verificationResult.credentialSubject && Object.keys(verificationResult.credentialSubject).length > 3 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Additional Information</h3>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <pre className="text-sm overflow-x-auto">
                              {JSON.stringify(verificationResult.credentialSubject, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </>
                    )}
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
                    {copySuccess ? 'Copied!' : 'Copy JWT'}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Verified at: {formatDate(verificationResult.verifiedAt)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Verify Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                <p>Request the JWT token from the worker (via email, message, or QR code)</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                <p>Paste the complete JWT token in the input field above</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                <p>Click "Verify Credential" to check authenticity</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
                <p>Review the verification results and worker information</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Verification History
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track all credential verifications performed by your agency
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  {verificationHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearHistory}
                      className="flex items-center gap-2"
                    >
                      Clear History
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {verificationHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Credential Type</TableHead>
                      <TableHead>Verified At</TableHead>
                      <TableHead>Verified By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verificationHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.isValid)}
                            {getStatusBadge(item.isValid)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {item.workerName?.slice(0, 20)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCredentialDisplayName(item.credentialType || 'Unknown')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.verifiedAt)}</TableCell>
                        <TableCell>{item.verifiedBy}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistoryItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    No Verification History
                  </h3>
                  <p className="text-slate-500">
                    Credential verifications will appear here once you start verifying worker credentials.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* History Item Detail Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Verification Details
            </DialogTitle>
            <DialogDescription>
              Details of the credential verification performed on {selectedHistoryItem && formatDate(selectedHistoryItem.verifiedAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedHistoryItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedHistoryItem.isValid)}
                    {getStatusBadge(selectedHistoryItem.isValid)}
                  </div>
                </div>
                <div>
                  <Label>Credential Type</Label>
                  <p className="mt-1">
                    <Badge variant="outline">
                      {getCredentialDisplayName(selectedHistoryItem.credentialType || 'Unknown')}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label>Verified At</Label>
                  <p className="mt-1">{formatDate(selectedHistoryItem.verifiedAt)}</p>
                </div>
                <div>
                  <Label>Verified By</Label>
                  <p className="mt-1">{selectedHistoryItem.verifiedBy}</p>
                </div>
              </div>
              <div>
                <Label>Worker DID</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded break-all mt-1">
                  {selectedHistoryItem.workerName}
                </p>
              </div>
              <div>
                <Label>JWT Token</Label>
                <div className="relative mt-1">
                  <Textarea
                    value={selectedHistoryItem.jwt}
                    readOnly
                    className="font-mono text-xs resize-none"
                    rows={4}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopyJWT(selectedHistoryItem.jwt)}
                  >
                    {copySuccess ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(AgencyVerifyCredentialsPage, ['AgencyAdmin']);
