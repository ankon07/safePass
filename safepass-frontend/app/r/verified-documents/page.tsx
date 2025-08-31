"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Search,
  Eye,
  Calendar,
  User,
  FileText,
  Key,
  Shield,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Award,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Document, Credential, ApiError } from "@/lib/api-types";

// Extended document type with additional verification details
interface VerifiedDocument extends Document {
  credential?: Credential;
  verifiedBy?: string;
}

function VerifiedDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<VerifiedDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<VerifiedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<VerifiedDocument | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchVerifiedDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, documentTypeFilter]);

  const fetchVerifiedDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getVerifiedDocuments();
      setDocuments(response.data as VerifiedDocument[]);
    } catch (err) {
      console.error('Error fetching verified documents:', err);
      const apiError = err as ApiError;
      setError(apiError.error || 'Failed to load verified documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc =>
        doc.worker?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.worker?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.verifiedBy?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply document type filter
    if (documentTypeFilter !== "all") {
      filtered = filtered.filter(doc => doc.documentType === documentTypeFilter);
    }

    setFilteredDocuments(filtered);
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

  const getDocumentStats = () => {
    const stats = {
      total: documents.length,
      byType: {
        Passport: documents.filter(d => d.documentType === 'Passport').length,
        EducationCertificate: documents.filter(d => d.documentType === 'EducationCertificate').length,
        SkillsCertificate: documents.filter(d => d.documentType === 'SkillsCertificate').length,
        TrainingCertificate: documents.filter(d => d.documentType === 'TrainingCertificate').length,
        NID: documents.filter(d => d.documentType === 'NID').length,
        WorkPermit: documents.filter(d => d.documentType === 'WorkPermit').length,
      },
      thisMonth: documents.filter(d => {
        const reviewDate = new Date(d.reviewedAt || d.createdAt);
        const now = new Date();
        return reviewDate.getMonth() === now.getMonth() && reviewDate.getFullYear() === now.getFullYear();
      }).length
    };
    return stats;
  };

  const openDetailsDialog = (document: VerifiedDocument) => {
    setSelectedDocument(document);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading verified documents...</p>
        </div>
      </div>
    );
  }

  const stats = getDocumentStats();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Verified Documents
        </h1>
        <p className="text-slate-500">
          View and manage all verified documents with complete verification details and credentials.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Documents verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Verified this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credentials Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.filter(d => d.credential).length}</div>
            <p className="text-xs text-muted-foreground">
              With verifiable credentials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                if (stats.total === 0) return 'N/A';
                const entries = Object.entries(stats.byType);
                if (entries.length === 0) return 'N/A';
                const mostCommon = entries.reduce((a, b) => a[1] > b[1] ? a : b);
                return mostCommon[0].replace(/([A-Z])/g, ' $1').trim();
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Document type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by worker name, email, document type, or verifier..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Passport">Passport</SelectItem>
                <SelectItem value="NID">National ID</SelectItem>
                <SelectItem value="EducationCertificate">Education Certificate</SelectItem>
                <SelectItem value="SkillsCertificate">Skills Certificate</SelectItem>
                <SelectItem value="TrainingCertificate">Training Certificate</SelectItem>
                <SelectItem value="WorkPermit">Work Permit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Showing {filteredDocuments.length} of {documents.length} verified documents
          </div>
        </CardContent>
      </Card>

      {/* Verified Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                No Verified Documents Found
              </h3>
              <p className="text-slate-500">
                {searchQuery || documentTypeFilter !== "all" 
                  ? "Try adjusting your search or filters."
                  : "No documents have been verified yet."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Verified By</TableHead>
                    <TableHead>Verification Date</TableHead>
                    <TableHead>Credential</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getDocumentTypeIcon(document.documentType)}</span>
                          <div>
                            <div className="font-medium">
                              {document.documentType.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-sm text-slate-500">
                              ID: {document.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{document.worker?.name}</div>
                          <div className="text-sm text-slate-500">{document.worker?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{document.verifiedBy || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {document.reviewedAt && format(new Date(document.reviewedAt), "PPP")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {document.credential ? (
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-green-600" />
                            <Badge variant="default">Issued</Badge>
                          </div>
                        ) : (
                          <Badge variant="outline">No Credential</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${document.ipfsCid}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailsDialog(document)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedDocument && getDocumentTypeIcon(selectedDocument.documentType)}</span>
              Document Verification Details
            </DialogTitle>
            <DialogDescription>
              Complete verification information and credential details
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Document Type</label>
                      <p className="text-sm">{selectedDocument.documentType.replace(/([A-Z])/g, ' $1').trim()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Document ID</label>
                      <p className="text-sm font-mono">{selectedDocument.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">IPFS CID</label>
                      <p className="text-sm font-mono break-all">{selectedDocument.ipfsCid}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Status</label>
                      <Badge variant="default" className="ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {selectedDocument.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Worker Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Name</label>
                      <p className="text-sm">{selectedDocument.worker?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Email</label>
                      <p className="text-sm">{selectedDocument.worker?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">DID</label>
                      <p className="text-sm font-mono break-all">{selectedDocument.worker?.did}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Verification Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Verified By</label>
                      <p className="text-sm">{selectedDocument.verifiedBy || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Verification Date</label>
                      <p className="text-sm">
                        {selectedDocument.reviewedAt && format(new Date(selectedDocument.reviewedAt), "PPP p")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Reviewer Notes</label>
                    <p className="text-sm bg-slate-50 p-3 rounded-lg">{selectedDocument.reviewerNotes || 'No notes provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Credential Information */}
              {selectedDocument.credential && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Verifiable Credential
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Credential ID</label>
                        <p className="text-sm font-mono">{selectedDocument.credential.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Credential Type</label>
                        <p className="text-sm">{selectedDocument.credential.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Issuance Date</label>
                        <p className="text-sm">
                          {format(new Date(selectedDocument.credential.issuanceDate), "PPP p")}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Issuer DID</label>
                        <p className="text-sm font-mono break-all">{selectedDocument.credential.issuerDid}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">JWT Token</label>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs font-mono break-all">{selectedDocument.credential.jwt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => window.open(`https://ipfs.io/ipfs/${selectedDocument.ipfsCid}`, '_blank')}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Document
                </Button>
                {selectedDocument.credential && (
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedDocument.credential!.jwt);
                      // In a real app, show a toast notification
                      alert('JWT token copied to clipboard!');
                    }}
                    variant="outline"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Copy JWT
                  </Button>
                )}
                <Button
                  onClick={() => {
                    // In a real app, this would generate and download a verification report
                    alert('Verification report download feature coming soon!');
                  }}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(VerifiedDocumentsPage, ['Regulator']);
