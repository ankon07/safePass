"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  Search,
  Copy,
  Share2,
  QrCode,
  CheckCircle,
  ExternalLink,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Link,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { WorkerCredentials, ApiError } from "@/lib/api-types";

interface BlockchainCredentialDetails {
  id: string;
  type: string;
  status: string;
  issuanceDate: string;
  issuer?: string;
}

function WorkerBlockchainCredentialsPage() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<BlockchainCredentialDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCredentialId, setSearchCredentialId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.did) {
      fetchWorkerCredentials();
    }
  }, [user]);

  const fetchWorkerCredentials = async () => {
    if (!user?.did) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWorkerCredentialsFromBlockchain(user.did);
      setCredentials(response.credentials || []);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching blockchain credentials:', err);
      setError(apiError.error || 'Failed to load blockchain credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCredential = async () => {
    if (!searchCredentialId.trim()) return;

    try {
      setSearchLoading(true);
      const response = await apiClient.getBlockchainCredentialDetails(searchCredentialId.trim());
      setSearchResult(response);
    } catch (err) {
      const apiError = err as ApiError;
      setSearchResult({ error: apiError.error || 'Credential not found' });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const generateQRCodeURL = (credentialId: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(credentialId)}`;
  };

  const generateVerificationURL = (credentialId: string) => {
    return `${window.location.origin}/verify-credential?credentialId=${encodeURIComponent(credentialId)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'revoked':
        return 'bg-red-500';
      case 'suspended':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading blockchain credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-jungle-green">
              Blockchain Credentials
            </h1>
            <p className="text-slate-500">
              View your credentials stored on the blockchain network
            </p>
          </div>
          <Button onClick={fetchWorkerCredentials} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Credential Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Specific Credential
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a credential ID to view its blockchain details
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter credential ID..."
                value={searchCredentialId}
                onChange={(e) => setSearchCredentialId(e.target.value)}
                disabled={searchLoading}
              />
            </div>
            <Button 
              onClick={handleSearchCredential}
              disabled={searchLoading || !searchCredentialId.trim()}
            >
              {searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResult && (
            <div className="mt-4 p-4 border rounded-lg">
              {searchResult.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchResult.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Credential Found</h4>
                    <Badge className={getStatusColor(searchResult.status)}>
                      {searchResult.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Credential ID</Label>
                      <p className="font-mono break-all">{searchResult.credentialId}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Issuer</Label>
                      <p className="font-mono break-all">{searchResult.issuer}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials List */}
      {credentials.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Blockchain Credentials
            </h3>
            <p className="text-slate-500">
              Your blockchain-stored credentials will appear here once issued by regulators.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {credentials.map((credential) => (
            <Card key={credential.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">
                        {credential.type || 'Blockchain Credential'}
                      </CardTitle>
                      <p className="text-sm text-slate-500">
                        ID: {credential.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(credential.status)}>
                    {credential.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Issued {format(new Date(credential.issuanceDate), "PPP")}</span>
                  </div>
                  {credential.issuer && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>Issuer: {credential.issuer.slice(0, 20)}...</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Share Credential</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(credential.id, `id-${credential.id}`)}
                      className="flex items-center gap-1"
                    >
                      {copySuccess === `id-${credential.id}` ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy ID
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generateQRCodeURL(credential.id), '_blank')}
                      className="flex items-center gap-1"
                    >
                      <QrCode className="h-3 w-3" />
                      QR Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(generateVerificationURL(credential.id), `url-${credential.id}`)}
                      className="flex items-center gap-1"
                    >
                      {copySuccess === `url-${credential.id}` ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Link className="h-3 w-3" />
                      )}
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generateVerificationURL(credential.id), '_blank')}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Verify
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {copySuccess && (
        <Alert className="fixed bottom-4 right-4 w-auto">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {copySuccess.includes('id') ? 'Credential ID copied!' : 
             copySuccess.includes('url') ? 'Verification URL copied!' : 
             'Copied to clipboard!'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default withAuth(WorkerBlockchainCredentialsPage, ['Worker']);
