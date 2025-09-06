"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Upload,
  Eye,
  RefreshCw
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-types";

interface DocumentUpload {
  id: string;
  documentType: string;
  ipfsCid: string;
  status: 'PendingVerification' | 'Verified' | 'Rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

function WorkerDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWorkerDocuments();
      setDocuments(response.data);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PendingVerification":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "Verified":
        return <CheckCircle2 className="h-5 w-5 text-viridian-green" />;
      case "Rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PendingVerification":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case "Verified":
        return <Badge className="bg-viridian-green/20 text-viridian-green">Verified</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDocument = (ipfsCid: string) => {
    // Open IPFS document in new tab
    window.open(`https://ipfs.io/ipfs/${ipfsCid}`, '_blank');
  };

  const handleUploadNew = () => {
    // Navigate to document upload page
    window.location.href = '/document-upload';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading your documents...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-jungle-green">My Documents</h1>
          <p className="text-slate-600 mt-1">
            View and manage your uploaded documents and their verification status
          </p>
        </div>
        <Button 
          onClick={handleUploadNew}
          className="bg-viridian-green hover:bg-sage-green"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload New Document
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No Documents Found</h3>
            <p className="text-slate-500 text-center mb-4">
              You haven't uploaded any documents yet. Start by uploading your identity and qualification documents.
            </p>
            <Button 
              onClick={handleUploadNew}
              className="bg-viridian-green hover:bg-sage-green"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <CardTitle className="text-lg">{doc.documentType}</CardTitle>
                      <CardDescription>
                        Uploaded on {formatDate(doc.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Document Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-600">Document ID:</span>
                      <p className="text-slate-800 font-mono text-xs">{doc.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">IPFS CID:</span>
                      <p className="text-slate-800 font-mono text-xs">{doc.ipfsCid}</p>
                    </div>
                  </div>

                  {/* Review Information */}
                  {doc.reviewedAt && (
                    <div className="border-t pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-600">Reviewed on:</span>
                          <p className="text-slate-800">{formatDate(doc.reviewedAt)}</p>
                        </div>
                        {doc.reviewerNotes && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-slate-600">Reviewer Notes:</span>
                            <p className="text-slate-800 mt-1 p-2 bg-slate-50 rounded text-sm">
                              {doc.reviewerNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(doc.ipfsCid)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Document
                    </Button>
                    
                    {doc.status === 'Rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUploadNew}
                        className="text-viridian-green border-viridian-green hover:bg-viridian-green hover:text-white"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Re-upload
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {documents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Document Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-700">
                  {documents.length}
                </div>
                <div className="text-sm text-slate-600">Total Documents</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-viridian-green">
                  {documents.filter(d => d.status === 'Verified').length}
                </div>
                <div className="text-sm text-slate-600">Verified</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.status === 'PendingVerification').length}
                </div>
                <div className="text-sm text-slate-600">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Protect this page - only workers should access it
export default withAuth(WorkerDocumentsPage, ['Worker']);
