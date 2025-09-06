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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Copy,
  Share2,
  QrCode,
  Mail,
  CheckCircle,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Credential, BlockchainCredential } from "@/lib/api-types";

function WorkerCredentialsPage() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [blockchainCredentials, setBlockchainCredentials] = useState<BlockchainCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'veramo' | 'blockchain' | 'all'>('all');
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [shareForm, setShareForm] = useState({
    recipientEmail: "",
    message: "",
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [veramoResponse, blockchainResponse] = await Promise.all([
        apiClient.getWorkerCredentials(),
        apiClient.getWorkerCredentialsFromBlockchain(user?.did || '').catch(() => ({ credentials: [] })),
      ]);
      
      setCredentials(veramoResponse.data);
      setBlockchainCredentials(blockchainResponse.credentials.map((c: any) => ({
        credentialId: c.id,
        status: c.status,
        issuer: 'Blockchain',
        holder: user?.did || '',
        issuanceDate: c.issuanceDate,
      })));
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError('Failed to load credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code URL using a free QR code service
  const generateQRCodeURL = (jwt: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(jwt)}`;
  };

  // Generate verification URL
  const generateVerificationURL = (jwt: string) => {
    return `${window.location.origin}/verify-credential?jwt=${encodeURIComponent(jwt)}`;
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

  const handleShare = async (credential: Credential) => {
    const shareData = {
      title: "Verifiable Credential",
      text: `My ${credential.type} credential has been verified and is ready for verification.`,
      url: generateVerificationURL(credential.jwt),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        const shareText = `${shareData.title}\n${shareData.text}\n\nVerification URL: ${shareData.url}\n\nJWT Token: ${credential.jwt}`;
        await navigator.clipboard.writeText(shareText);
        setCopySuccess("share");
        setTimeout(() => setCopySuccess(null), 2000);
      }
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };

  const handleDownloadQR = (credential: Credential) => {
    const qrUrl = generateQRCodeURL(credential.jwt);
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `credential-qr-${credential.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openShareModal = (credential: Credential) => {
    setSelectedCredential(credential);
    setShareForm({
      recipientEmail: "",
      message: `Hi,\n\nI'm sharing my verified ${credential.type} credential with you. You can verify its authenticity using the link below.\n\nBest regards,\n${user?.name}`,
    });
    setShareModalOpen(true);
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

  const getCredentialTypeIcon = (type: string) => {
    switch (type) {
      case 'VerifiedPassportCredential':
        return '🛂';
      case 'VerifiedNationalIDCredential':
        return '🆔';
      case 'VerifiedTrainingCredential':
      case 'VerifiedEducationCredential':
      case 'VerifiedSkillsCredential':
        return '📜';
      case 'VerifiedWorkPermitCredential':
        return '📋';
      default:
        return '🏆';
    }
  };

  const getCredentialDisplayName = (type: string) => {
    return type
      .replace('Verified', '')
      .replace('Credential', '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  };

  const getBlockchainCredentialIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return '⛓️';
      case 'active':
        return '🔗';
      case 'revoked':
        return '❌';
      default:
        return '🔒';
    }
  };

  const filteredCredentials = () => {
    switch (activeTab) {
      case 'veramo':
        return { veramo: credentials, blockchain: [] };
      case 'blockchain':
        return { veramo: [], blockchain: blockchainCredentials };
      case 'all':
      default:
        return { veramo: credentials, blockchain: blockchainCredentials };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading your credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          My Credentials
        </h1>
        <p className="text-slate-500">
          View and share your verified credentials with agencies and employers.
        </p>
        
        {/* Credential Type Tabs */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('all')}
          >
            All Credentials ({credentials.length + blockchainCredentials.length})
          </Button>
          <Button
            variant={activeTab === 'veramo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('veramo')}
          >
            Veramo ({credentials.length})
          </Button>
          <Button
            variant={activeTab === 'blockchain' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('blockchain')}
          >
            Blockchain ({blockchainCredentials.length})
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {credentials.length === 0 && blockchainCredentials.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Credentials Yet
            </h3>
            <p className="text-slate-500">
              Your verified credentials will appear here once regulators approve your documents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Veramo Credentials */}
          {filteredCredentials().veramo.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Veramo Credentials ({filteredCredentials().veramo.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCredentials().veramo.map((credential) => (
                  <Card key={credential.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCredentialTypeIcon(credential.type)}</span>
                          <div>
                            <CardTitle className="text-lg">
                              {getCredentialDisplayName(credential.type)}
                            </CardTitle>
                            <p className="text-sm text-slate-500">
                              ID: {credential.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>Issued {format(new Date(credential.issuanceDate), "PPP")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>Issuer: {credential.issuerDid.slice(0, 20)}...</span>
                        </div>
                        {credential.sourceDocument && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span>Source: {credential.sourceDocument.type}</span>
                          </div>
                        )}
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Share with Agencies</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(credential.jwt, `jwt-${credential.id}`)}
                            className="flex items-center gap-1"
                          >
                            {copySuccess === `jwt-${credential.id}` ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy JWT
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare(credential)}
                            className="flex items-center gap-1"
                          >
                            <Share2 className="h-3 w-3" />
                            Share
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadQR(credential)}
                            className="flex items-center gap-1"
                          >
                            <QrCode className="h-3 w-3" />
                            QR Code
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openShareModal(credential)}
                            className="flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(generateVerificationURL(credential.jwt), '_blank')}
                          className="w-full flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Verification Page
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Blockchain Credentials */}
          {filteredCredentials().blockchain.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">⛓️</span>
                Blockchain Credentials ({filteredCredentials().blockchain.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCredentials().blockchain.map((credential) => (
                  <Card key={credential.credentialId} className="hover:shadow-md transition-shadow border-blue-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getBlockchainCredentialIcon(credential.status)}</span>
                          <div>
                            <CardTitle className="text-lg">
                              Blockchain Credential
                            </CardTitle>
                            <p className="text-sm text-slate-500">
                              ID: {credential.credentialId.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <Badge variant={credential.status === 'verified' ? 'default' : 'outline'} className="bg-blue-600">
                          <span className="mr-1">⛓️</span>
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
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>Issuer: {credential.issuer}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-blue-600">🔗</span>
                          <span>Stored on blockchain</span>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Blockchain Verification</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(credential.credentialId, `blockchain-${credential.credentialId}`)}
                            className="flex items-center gap-1"
                          >
                            {copySuccess === `blockchain-${credential.credentialId}` ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy Credential ID
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            disabled
                          >
                            <span className="text-blue-600">⛓️</span>
                            Verify on Blockchain
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs text-slate-500 bg-blue-50 p-2 rounded">
                          This credential is stored on the blockchain and can be independently verified by any party.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {copySuccess && (
        <Alert className="fixed bottom-4 right-4 w-auto">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {copySuccess.includes('jwt') ? 'JWT token copied!' : 
             copySuccess === 'share' ? 'Credential details copied!' : 
             'Copied to clipboard!'}
          </AlertDescription>
        </Alert>
      )}

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Share Credential via Email
            </DialogTitle>
            <DialogDescription>
              Share your {selectedCredential && getCredentialDisplayName(selectedCredential.type)} credential with an agency or employer.
            </DialogDescription>
          </DialogHeader>

          {selectedCredential && (
            <div className="space-y-6">
              {/* Credential Preview */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Credential Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p>{getCredentialDisplayName(selectedCredential.type)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Issued</Label>
                    <p>{formatDate(selectedCredential.issuanceDate)}</p>
                  </div>
                </div>
              </div>

              {/* Email Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient-email">Recipient Email</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    value={shareForm.recipientEmail}
                    onChange={(e) => setShareForm({ ...shareForm, recipientEmail: e.target.value })}
                    placeholder="agency@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="share-message">Message</Label>
                  <Textarea
                    id="share-message"
                    value={shareForm.message}
                    onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
                    rows={6}
                  />
                </div>
              </div>

              {/* Sharing Options */}
              <div className="space-y-4">
                <h4 className="font-medium">What will be shared:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Verification URL for easy access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>JWT token for direct verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>QR code for mobile scanning</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(generateVerificationURL(selectedCredential.jwt), "modal-url")}
                  className="flex items-center gap-2"
                >
                  {copySuccess === "modal-url" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy Verification URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(selectedCredential.jwt, "modal-jwt")}
                  className="flex items-center gap-2"
                >
                  {copySuccess === "modal-jwt" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy JWT Token
                </Button>
              </div>

              {/* QR Code Preview */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <img 
                    src={generateQRCodeURL(selectedCredential.jwt)} 
                    alt="Credential QR Code"
                    className="w-32 h-32"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    QR Code for verification
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled>
              <Mail className="h-4 w-4 mr-2" />
              Send Email (Coming Soon)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(WorkerCredentialsPage, ['Worker']);
