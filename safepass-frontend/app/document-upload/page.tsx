"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUp, CheckCircle2, LoaderCircle, AlertCircle } from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { DocumentType, ApiError } from "@/lib/api-types";

// Define the structure for a document and its possible statuses
type UploadStatus = "pending" | "uploading" | "verified" | "rejected";
interface DocumentToUpload {
  id: string;
  title: string;
  status: UploadStatus;
  file?: File;
  documentType: DocumentType;
}

// Initial state for the documents list
const initialDocuments: DocumentToUpload[] = [
  { id: "nid", title: "National ID (NID)", status: "pending", documentType: "NID" },
  { id: "passport", title: "Passport", status: "pending", documentType: "Passport" },
  { id: "education", title: "Education Certificate", status: "pending", documentType: "EducationCertificate" },
  { id: "training", title: "Training Certificate", status: "pending", documentType: "TrainingCertificate" },
  { id: "skills", title: "Skills Certificate", status: "pending", documentType: "SkillsCertificate" },
];

function DocumentUploadPage() {
  const [documents, setDocuments] = useState<DocumentToUpload[]>(initialDocuments);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | "">("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentlyUploading, setCurrentlyUploading] = useState<string | null>(null);
  const { user } = useAuth();

  const allDocsVerified = documents.every((doc) => doc.status === "verified");

  const handleUploadClick = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      setSelectedDocumentType(doc.documentType);
      setCurrentlyUploading(documentId);
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentlyUploading || !selectedDocumentType) return;

    const docId = currentlyUploading;
    setError(null);

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      setCurrentlyUploading(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, GIF, and PDF files are allowed");
      setCurrentlyUploading(null);
      return;
    }

    // 1. Set status to 'uploading' to show spinner
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === docId ? { ...doc, status: "uploading", file } : doc
      )
    );

    try {
      // 2. Upload to backend API
      const response = await apiClient.uploadDocument(file, selectedDocumentType);
      
      // 3. Set status to 'verified' on success (or 'pending' if it needs review)
      setDocuments((docs) =>
        docs.map((doc) =>
          doc.id === docId ? { 
            ...doc, 
            status: response.data.status === "PendingVerification" ? "pending" : "verified" 
          } : doc
        )
      );

    } catch (error) {
      const apiError = error as ApiError & { status?: number };
      setError(apiError.error || "Upload failed. Please try again.");
      
      // Reset status to pending on error
      setDocuments((docs) =>
        docs.map((doc) =>
          doc.id === docId ? { ...doc, status: "pending", file: undefined } : doc
        )
      );
    }

    setCurrentlyUploading(null);
    setSelectedDocumentType("");
    
    // Reset file input to allow uploading the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case "pending":
        return <FileUp className="h-6 w-6 text-slate-500" />;
      case "uploading":
        return <LoaderCircle className="h-6 w-6 text-blue-500 animate-spin" />;
      case "verified":
        return <CheckCircle2 className="h-6 w-6 text-viridian-green" />;
      case "rejected":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusBadge = (status: UploadStatus) => {
    switch (status) {
      case "pending":
        return null;
      case "uploading":
        return <Badge variant="secondary">Uploading...</Badge>;
      case "verified":
        return <Badge className="bg-viridian-green/20 text-viridian-green">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-dark-jungle-green">
            Upload Your Documents
          </CardTitle>
          <CardDescription>
            Please upload the following documents. They will be verified and added to your digital wallet.
            {user && <span className="block mt-1">Welcome, {user.name}!</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, application/pdf"
          />
          
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(doc.status)}
                  <span className="font-medium text-dark-jungle-green">
                    {doc.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUploadClick(doc.id)}
                      disabled={currentlyUploading !== null}
                    >
                      Upload
                    </Button>
                  )}
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Upload Guidelines:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Supported formats: JPEG, PNG, GIF, PDF</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Ensure documents are clear and readable</li>
              <li>• Documents will be reviewed by regulators</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button
            className="w-full bg-viridian-green hover:bg-sage-green"
            disabled={!allDocsVerified}
            onClick={() => {
              // Navigate to worker dashboard
              window.location.href = '/w/dashboard';
            }}
          >
            {allDocsVerified ? "Continue to Dashboard" : "Upload All Documents to Continue"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

// Protect this page - only workers should access it
export default withAuth(DocumentUploadPage, ['Worker']);
