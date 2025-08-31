"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileCheck,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Document } from "@/lib/api-types";

function DocumentReviewPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingDoc, setProcessingDoc] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getPendingDocuments();
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching pending documents:', err);
      setError('Failed to load pending documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDocument = async (document: Document) => {
    try {
      setProcessingDoc(document.id);
      
      // Issue credential for approved document
      await apiClient.issueCredential({
        documentUploadId: document.id,
        holderDid: document.worker?.did || '',
        claims: {
          documentType: document.documentType,
          verifiedBy: user?.name || 'Regulator',
          verificationDate: new Date().toISOString(),
        }
      });

      // Refresh the documents list
      await fetchPendingDocuments();
      setDialogOpen(false);
      setSelectedDoc(null);
      setReviewNotes("");
    } catch (err) {
      console.error('Error approving document:', err);
      setError('Failed to approve document. Please try again.');
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleRejectDocument = async (document: Document) => {
    if (!reviewNotes.trim()) {
      setError('Please provide rejection notes.');
      return;
    }

    try {
      setProcessingDoc(document.id);
      
      await apiClient.rejectDocument({
        documentUploadId: document.id,
        reviewerNotes: reviewNotes
      });

      // Refresh the documents list
      await fetchPendingDocuments();
      setDialogOpen(false);
      setSelectedDoc(null);
      setReviewNotes("");
    } catch (err) {
      console.error('Error rejecting document:', err);
      setError('Failed to reject document. Please try again.');
    } finally {
      setProcessingDoc(null);
    }
  };

  const openActionDialog = (document: Document, action: 'approve' | 'reject') => {
    setSelectedDoc(document);
    setActionType(action);
    setReviewNotes("");
    setDialogOpen(true);
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'Passport':
        return '🛂';
      case 'NID':
        return '🆔';
      case 'TrainingCertificate':
      case 'EducationCertificate':
      case 'SkillsCertificate':
        return '📜';
      case 'WorkPermit':
        return '📋';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading pending documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Document Review
        </h1>
        <p className="text-slate-500">
          Review and verify worker documents for credential issuance.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Pending Documents
            </h3>
            <p className="text-slate-500">
              All documents have been reviewed. Check back later for new submissions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getDocumentTypeIcon(document.documentType)}</span>
                    <div>
                      <CardTitle className="text-lg">
                        {document.documentType.replace(/([A-Z])/g, ' $1').trim()}
                      </CardTitle>
                      <p className="text-sm text-slate-500">
                        ID: {document.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{document.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{document.worker?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Submitted {format(new Date(document.createdAt), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>IPFS: {document.ipfsCid.slice(0, 12)}...</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`https://ipfs.io/ipfs/${document.ipfsCid}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => openActionDialog(document, 'approve')}
                    disabled={processingDoc === document.id}
                  >
                    {processingDoc === document.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => openActionDialog(document, 'reject')}
                    disabled={processingDoc === document.id}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Document' : 'Reject Document'}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc && (
                <>
                  {actionType === 'approve' 
                    ? `Are you sure you want to approve this ${selectedDoc.documentType} for ${selectedDoc.worker?.name}? This will issue a verifiable credential.`
                    : `Please provide a reason for rejecting this ${selectedDoc.documentType} from ${selectedDoc.worker?.name}.`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Rejection Notes (Required)
              </label>
              <Textarea
                placeholder="Please provide detailed feedback on why this document is being rejected..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {actionType === 'approve' && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Review Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any additional notes about this approval..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={() => {
                if (selectedDoc) {
                  if (actionType === 'approve') {
                    handleApproveDocument(selectedDoc);
                  } else {
                    handleRejectDocument(selectedDoc);
                  }
                }
              }}
              disabled={processingDoc === selectedDoc?.id}
            >
              {processingDoc === selectedDoc?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : actionType === 'approve' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {actionType === 'approve' ? 'Approve & Issue Credential' : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(DocumentReviewPage, ['Regulator']);
