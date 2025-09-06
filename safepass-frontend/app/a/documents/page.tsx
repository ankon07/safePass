"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  Document,
  DocumentsResponse,
  DocumentType,
  DocumentStatus,
  IssueCredentialRequest,
  RejectDocumentRequest,
  ApiError,
} from "@/lib/api-types";

interface DocumentWithActions extends Document {
  selected?: boolean;
}

function DocumentManagement() {
  const { user } = useAuth();
  const [pendingDocuments, setPendingDocuments] = useState<DocumentWithActions[]>([]);
  const [verifiedDocuments, setVerifiedDocuments] = useState<DocumentWithActions[]>([]);
  const [workerDocuments, setWorkerDocuments] = useState<DocumentWithActions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [issueCredentialForm, setIssueCredentialForm] = useState({
    documentUploadId: "",
    holderDid: "",
    claims: "",
  });
  const [rejectForm, setRejectForm] = useState({
    documentUploadId: "",
    reviewerNotes: "",
  });

  // Dialog states
  const [issueCredentialDialogOpen, setIssueCredentialDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [documentViewDialogOpen, setDocumentViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState<DocumentType>("Passport");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [];

      // Fetch pending documents (for regulators)
      if (user?.role === "Regulator") {
        promises.push(
          apiClient.getPendingDocuments().catch(() => ({ data: [] })),
          apiClient.getVerifiedDocuments().catch(() => ({ data: [] }))
        );
      }

      // Fetch agency admin documents
      if (user?.role === "AgencyAdmin") {
        promises.push(
          apiClient.getAgencyPendingDocuments().catch(() => ({ data: [] })),
          apiClient.getAgencyWorkerDocuments().catch(() => ({ data: [] }))
        );
      }

      // Fetch worker's own documents
      if (user?.role === "Worker") {
        promises.push(apiClient.getWorkerDocuments().catch(() => ({ data: [] })));
      }

      const results = await Promise.all(promises);

      if (user?.role === "Regulator") {
        setPendingDocuments(results[0]?.data || []);
        setVerifiedDocuments(results[1]?.data || []);
      }

      if (user?.role === "AgencyAdmin") {
        setPendingDocuments(results[0]?.data || []);
        setWorkerDocuments(results[1]?.data || []);
      }

      if (user?.role === "Worker") {
        setWorkerDocuments(results[0]?.data || []);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile) return;

    try {
      setActionLoading("upload");
      await apiClient.uploadDocument(uploadFile, uploadDocumentType);
      setUploadFile(null);
      await fetchDocuments();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to upload document");
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssueCredential = async () => {
    if (!issueCredentialForm.documentUploadId || !issueCredentialForm.holderDid) return;

    try {
      setActionLoading("issue-credential");
      const claims = issueCredentialForm.claims
        ? JSON.parse(issueCredentialForm.claims)
        : {};

      await apiClient.issueCredential({
        documentUploadId: issueCredentialForm.documentUploadId,
        holderDid: issueCredentialForm.holderDid,
        claims,
      });

      setIssueCredentialDialogOpen(false);
      setIssueCredentialForm({
        documentUploadId: "",
        holderDid: "",
        claims: "",
      });
      await fetchDocuments();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to issue credential");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectForm.documentUploadId || !rejectForm.reviewerNotes) return;

    try {
      setActionLoading("reject-document");
      
      // Use appropriate API method based on user role
      if (user?.role === "AgencyAdmin") {
        await apiClient.rejectAgencyDocument(rejectForm.documentUploadId, rejectForm.reviewerNotes);
      } else {
        await apiClient.rejectDocument({
          documentUploadId: rejectForm.documentUploadId,
          reviewerNotes: rejectForm.reviewerNotes,
        });
      }

      setRejectDialogOpen(false);
      setRejectForm({
        documentUploadId: "",
        reviewerNotes: "",
      });
      await fetchDocuments();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to reject document");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedDocuments.size === 0) return;

    try {
      setActionLoading("bulk-approve");
      const promises = Array.from(selectedDocuments).map(async (docId) => {
        const doc = pendingDocuments.find(d => d.id === docId);
        if (doc && doc.worker) {
          return apiClient.issueCredential({
            documentUploadId: docId,
            holderDid: doc.worker.did,
            claims: { documentType: doc.documentType },
          });
        }
      });

      await Promise.all(promises.filter(Boolean));
      setSelectedDocuments(new Set());
      await fetchDocuments();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to bulk approve documents");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDocumentSelection = (docId: string, selected: boolean) => {
    const newSelection = new Set(selectedDocuments);
    if (selected) {
      newSelection.add(docId);
    } else {
      newSelection.delete(docId);
    }
    setSelectedDocuments(newSelection);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "PendingVerification":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "Verified":
        return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case "Rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeIcon = (type: DocumentType) => {
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-jungle-green">
              Document Management
            </h1>
            <p className="text-slate-600 mt-2">
              {user?.role === "Regulator" 
                ? "Review and verify worker documents"
                : user?.role === "AgencyAdmin"
                ? "Manage worker documents for your agency"
                : "Upload and manage your documents"
              }
            </p>
          </div>
          <Button onClick={fetchDocuments} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={user?.role === "Regulator" ? "pending" : user?.role === "AgencyAdmin" ? "pending" : "my-documents"} className="space-y-6">
        <TabsList>
          {user?.role === "Regulator" && (
            <>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
            </>
          )}
          {user?.role === "AgencyAdmin" && (
            <>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="all-documents">All Worker Documents</TabsTrigger>
            </>
          )}
          {user?.role === "Worker" && (
            <>
              <TabsTrigger value="my-documents">My Documents</TabsTrigger>
              <TabsTrigger value="upload">Upload Document</TabsTrigger>
            </>
          )}
        </TabsList>

        {user?.role === "Regulator" && (
          <>
            <TabsContent value="pending" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pending Documents</CardTitle>
                      <CardDescription>
                        Documents awaiting verification ({pendingDocuments.length})
                      </CardDescription>
                    </div>
                    {selectedDocuments.size > 0 && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleBulkApprove}
                          disabled={actionLoading === "bulk-approve"}
                          size="sm"
                        >
                          {actionLoading === "bulk-approve" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Approve Selected ({selectedDocuments.size})
                        </Button>
                        <Button
                          onClick={() => setSelectedDocuments(new Set())}
                          variant="outline"
                          size="sm"
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingDocuments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocuments(new Set(pendingDocuments.map(d => d.id)));
                                } else {
                                  setSelectedDocuments(new Set());
                                }
                              }}
                              checked={selectedDocuments.size === pendingDocuments.length && pendingDocuments.length > 0}
                            />
                          </TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedDocuments.has(doc.id)}
                                onChange={(e) => handleDocumentSelection(doc.id, e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {getDocumentTypeIcon(doc.documentType)}
                                <span className="ml-2 font-mono text-xs">
                                  {doc.id.slice(0, 8)}...
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{doc.worker?.name}</div>
                                <div className="text-sm text-slate-500">{doc.worker?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{doc.documentType}</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDocument(doc);
                                    setDocumentViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setIssueCredentialForm({
                                      documentUploadId: doc.id,
                                      holderDid: doc.worker?.did || "",
                                      claims: JSON.stringify({ documentType: doc.documentType }),
                                    });
                                    setIssueCredentialDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setRejectForm({
                                      documentUploadId: doc.id,
                                      reviewerNotes: "",
                                    });
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      No pending documents to review
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verified" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verified Documents</CardTitle>
                  <CardDescription>
                    Documents that have been verified and approved ({verifiedDocuments.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {verifiedDocuments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verifiedDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center">
                                {getDocumentTypeIcon(doc.documentType)}
                                <span className="ml-2 font-mono text-xs">
                                  {doc.id.slice(0, 8)}...
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{doc.worker?.name}</div>
                                <div className="text-sm text-slate-500">{doc.worker?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{doc.documentType}</Badge>
                            </TableCell>
                            <TableCell>
                              {doc.reviewedAt && new Date(doc.reviewedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setDocumentViewDialogOpen(true);
                                }}
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
                      No verified documents found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {user?.role === "AgencyAdmin" && (
          <>
            <TabsContent value="pending" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pending Documents</CardTitle>
                      <CardDescription>
                        Worker documents awaiting agency review ({pendingDocuments.length})
                      </CardDescription>
                    </div>
                    {selectedDocuments.size > 0 && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleBulkApprove}
                          disabled={actionLoading === "bulk-approve"}
                          size="sm"
                        >
                          {actionLoading === "bulk-approve" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Approve Selected ({selectedDocuments.size})
                        </Button>
                        <Button
                          onClick={() => setSelectedDocuments(new Set())}
                          variant="outline"
                          size="sm"
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingDocuments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocuments(new Set(pendingDocuments.map(d => d.id)));
                                } else {
                                  setSelectedDocuments(new Set());
                                }
                              }}
                              checked={selectedDocuments.size === pendingDocuments.length && pendingDocuments.length > 0}
                            />
                          </TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedDocuments.has(doc.id)}
                                onChange={(e) => handleDocumentSelection(doc.id, e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {getDocumentTypeIcon(doc.documentType)}
                                <span className="ml-2 font-mono text-xs">
                                  {doc.id.slice(0, 8)}...
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{doc.worker?.name}</div>
                                <div className="text-sm text-slate-500">{doc.worker?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{doc.documentType}</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDocument(doc);
                                    setDocumentViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      setActionLoading(`approve-${doc.id}`);
                                      await apiClient.approveAgencyDocument(doc.id, "Approved by agency admin");
                                      await fetchDocuments();
                                    } catch (error) {
                                      const apiError = error as ApiError;
                                      setError(apiError.error || "Failed to approve document");
                                    } finally {
                                      setActionLoading(null);
                                    }
                                  }}
                                  disabled={actionLoading === `approve-${doc.id}`}
                                >
                                  {actionLoading === `approve-${doc.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setRejectForm({
                                      documentUploadId: doc.id,
                                      reviewerNotes: "",
                                    });
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      No pending documents to review
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all-documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Worker Documents</CardTitle>
                  <CardDescription>
                    All documents from workers in your agency ({workerDocuments.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workerDocuments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reviewed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workerDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center">
                                {getDocumentTypeIcon(doc.documentType)}
                                <span className="ml-2 font-mono text-xs">
                                  {doc.id.slice(0, 8)}...
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{doc.worker?.name}</div>
                                <div className="text-sm text-slate-500">{doc.worker?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{doc.documentType}</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell>
                              {doc.reviewedAt ? new Date(doc.reviewedAt).toLocaleDateString() : "Not reviewed"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setDocumentViewDialogOpen(true);
                                }}
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
                      No worker documents found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {user?.role === "Worker" && (
          <>
            <TabsContent value="my-documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Documents</CardTitle>
                  <CardDescription>
                    Your uploaded documents and their verification status ({workerDocuments.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workerDocuments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workerDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center">
                                {getDocumentTypeIcon(doc.documentType)}
                                <span className="ml-2 font-mono text-xs">
                                  {doc.id.slice(0, 8)}...
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{doc.documentType}</Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-600">
                                {doc.reviewerNotes || "No notes"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      No documents uploaded yet. Upload your first document to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                  <CardDescription>
                    Upload a new document for verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="document-type">Document Type</Label>
                      <Select
                        value={uploadDocumentType}
                        onValueChange={(value) => setUploadDocumentType(value as DocumentType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="NID">National ID</SelectItem>
                          <SelectItem value="TrainingCertificate">Training Certificate</SelectItem>
                          <SelectItem value="EducationCertificate">Education Certificate</SelectItem>
                          <SelectItem value="SkillsCertificate">Skills Certificate</SelectItem>
                          <SelectItem value="WorkPermit">Work Permit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="document-file">Document File</Label>
                      <Input
                        id="document-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-sm text-slate-500">
                        Supported formats: PDF, JPEG, PNG, GIF (max 10MB)
                      </p>
                    </div>
                    <Button
                      onClick={handleUploadDocument}
                      disabled={!uploadFile || actionLoading === "upload"}
                      className="w-full"
                    >
                      {actionLoading === "upload" && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Issue Credential Dialog */}
      <Dialog open={issueCredentialDialogOpen} onOpenChange={setIssueCredentialDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Issue Verifiable Credential</DialogTitle>
            <DialogDescription>
              Issue a verifiable credential for the approved document
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="holder-did">Holder DID</Label>
              <Input
                id="holder-did"
                value={issueCredentialForm.holderDid}
                onChange={(e) =>
                  setIssueCredentialForm({ ...issueCredentialForm, holderDid: e.target.value })
                }
                placeholder="did:ethr:0x..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="claims">Claims (JSON)</Label>
              <Textarea
                id="claims"
                value={issueCredentialForm.claims}
                onChange={(e) =>
                  setIssueCredentialForm({ ...issueCredentialForm, claims: e.target.value })
                }
                placeholder='{"documentType": "Passport", "issuedBy": "Government"}'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleIssueCredential}
              disabled={
                actionLoading === "issue-credential" ||
                !issueCredentialForm.holderDid
              }
            >
              {actionLoading === "issue-credential" && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Issue Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this document
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reviewer-notes">Rejection Reason</Label>
              <Textarea
                id="reviewer-notes"
                value={rejectForm.reviewerNotes}
                onChange={(e) =>
                  setRejectForm({ ...rejectForm, reviewerNotes: e.target.value })
                }
                placeholder="Please provide a clear reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRejectDocument}
              disabled={
                actionLoading === "reject-document" ||
                !rejectForm.reviewerNotes
              }
              variant="destructive"
            >
              {actionLoading === "reject-document" && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document View Dialog */}
      <Dialog open={documentViewDialogOpen} onOpenChange={setDocumentViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              View document information and metadata
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Document ID</Label>
                  <p className="font-mono text-sm">{selectedDocument.id}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p>{selectedDocument.documentType}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedDocument.status)}</div>
                </div>
                <div>
                  <Label>Uploaded</Label>
                  <p>{new Date(selectedDocument.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {selectedDocument.worker && (
                <div>
                  <Label>Worker Information</Label>
                  <div className="mt-1">
                    <p className="font-medium">{selectedDocument.worker.name}</p>
                    <p className="text-sm text-slate-600">{selectedDocument.worker.email}</p>
                    <p className="text-xs font-mono text-slate-500">{selectedDocument.worker.did}</p>
                  </div>
                </div>
              )}
              {selectedDocument.reviewerNotes && (
                <div>
                  <Label>Reviewer Notes</Label>
                  <p className="mt-1 text-sm">{selectedDocument.reviewerNotes}</p>
                </div>
              )}
              <div>
                <Label>IPFS CID</Label>
                <p className="font-mono text-sm break-all">{selectedDocument.ipfsCid}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(DocumentManagement, ["Worker", "Regulator", "AgencyAdmin"]);
