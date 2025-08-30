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
import { Badge } from "@/components/ui/badge";
import { FileUp, CheckCircle2, LoaderCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the structure for a document and its possible statuses
type UploadStatus = "pending" | "uploading" | "verified" | "rejected";
interface DocumentToUpload {
  id: string;
  title: string;
  status: UploadStatus;
  file?: File;
}

// Initial state for the documents list
const initialDocuments: DocumentToUpload[] = [
  { id: "nid", title: "National ID (NID)", status: "pending" },
  { id: "passport", title: "Passport", status: "pending" },
  { id: "certificate", title: "Training Certificates", status: "pending" },
];

export default function DocumentUploadPage() {
  const [documents, setDocuments] =
    useState<DocumentToUpload[]>(initialDocuments);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentlyUploading, setCurrentlyUploading] = useState<string | null>(
    null
  );

  const allDocsVerified = documents.every((doc) => doc.status === "verified");

  const handleUploadClick = (documentId: string) => {
    setCurrentlyUploading(documentId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentlyUploading) return;

    const docId = currentlyUploading;

    // 1. Set status to 'uploading' to show spinner
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === docId ? { ...doc, status: "uploading", file } : doc
      )
    );

    // 2. Simulate API call for upload and verification
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Set status to 'verified' on success
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === docId ? { ...doc, status: "verified" } : doc
      )
    );

    setCurrentlyUploading(null);
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

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-dark-jungle-green">
            Upload Your Documents
          </CardTitle>
          <CardDescription>
            Please upload the following documents. They will be verified and
            added to your digital wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, application/pdf"
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
                {doc.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUploadClick(doc.id)}
                  >
                    Upload
                  </Button>
                )}
                {doc.status === "uploading" && (
                  <Badge variant="secondary">Uploading...</Badge>
                )}
                {doc.status === "verified" && (
                  <Badge className="bg-viridian-green/20 text-viridian-green">
                    Verified
                  </Badge>
                )}
                {doc.status === "rejected" && (
                  <Badge variant="destructive">Rejected</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button
            className="w-full bg-viridian-green hover:bg-sage-green"
            disabled={!allDocsVerified}
            onClick={() => {
              // TODO: Navigate to the first authenticated screen: the worker's dashboard
              // router.push('/dashboard');
              console.log("Navigating to dashboard...");
            }}
          >
            Finish & Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
