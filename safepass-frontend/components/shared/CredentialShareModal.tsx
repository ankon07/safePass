"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Share2,
  QrCode,
  Mail,
  CheckCircle,
  ExternalLink,
  User,
  Calendar,
  Shield,
  Download,
} from "lucide-react";
import { IssueCredentialResponse } from "@/lib/api-types";

interface CredentialShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: IssueCredentialResponse["data"] | null;
  workerName?: string;
  workerEmail?: string;
}

export function CredentialShareModal({
  open,
  onOpenChange,
  credential,
  workerName,
  workerEmail,
}: CredentialShareModalProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [emailForm, setEmailForm] = useState({
    to: workerEmail || "",
    subject: "",
    message: "",
  });
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Generate QR code URL using a free QR code service
  const generateQRCodeURL = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
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

  const handleShare = async () => {
    if (!credential) return;

    const shareData = {
      title: "Verifiable Credential",
      text: `Your ${credential.type} credential has been issued and verified.`,
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

  const handleDownloadQR = (jwt: string) => {
    const qrUrl = generateQRCodeURL(jwt);
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `credential-qr-${credential?.credentialId?.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Credential Issued Successfully
          </DialogTitle>
          <DialogDescription>
            The verifiable credential has been issued. Share it with the worker using the options below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Credential Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Credential Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Credential ID</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                  {credential.credentialId}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                <Badge variant="outline">{credential.type}</Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Issued To</Label>
                <div>
                  <p className="font-medium">{workerName || "Unknown Worker"}</p>
                  <p className="text-sm text-muted-foreground">{workerEmail}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Issued Date</Label>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(credential.issuanceDate)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* JWT Token Display */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">JWT Token</h3>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Verifiable Credential JWT
              </Label>
              <div className="relative">
                <Textarea
                  value={credential.jwt}
                  readOnly
                  className="font-mono text-xs resize-none"
                  rows={4}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(credential.jwt, "jwt")}
                >
                  {copySuccess === "jwt" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copySuccess === "jwt" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>JWT token copied to clipboard!</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <Separator />

          {/* Verification URL */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Verification URL</h3>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Public Verification Link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={generateVerificationURL(credential.jwt)}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(generateVerificationURL(credential.jwt), "url")}
                >
                  {copySuccess === "url" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(generateVerificationURL(credential.jwt), "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {copySuccess === "url" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Verification URL copied to clipboard!</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <Separator />

          {/* QR Code */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={generateQRCodeURL(credential.jwt)}
                  alt="Credential QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Workers can scan this QR code to access their credential, or agencies can scan it to verify the credential.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadQR(credential.jwt)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(generateQRCodeURL(credential.jwt), "qr")}
                    className="flex items-center gap-2"
                  >
                    {copySuccess === "qr" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copy QR URL
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sharing Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Share with Worker</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                {copySuccess === "share" ? "Copied!" : "Share"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email Worker
              </Button>
            </div>

            {showEmailForm && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Send Credential via Email</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="email-to">To</Label>
                    <Input
                      id="email-to"
                      value={emailForm.to}
                      onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                      placeholder="worker@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      placeholder={`Your ${credential.type} credential has been issued`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea
                      id="email-message"
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                      placeholder="Your verifiable credential has been successfully issued and is ready for use..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email (Coming Soon)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowEmailForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">How to share this credential:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Copy the JWT token and send it to the worker securely</li>
              <li>• Share the verification URL for easy access</li>
              <li>• Download and share the QR code for in-person verification</li>
              <li>• The worker can then share this credential with agencies for verification</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
