"use client";

import { useState, useEffect } from "react";
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
  BadgeCheck,
  Briefcase,
  HeartPulse,
  ShieldCheck,
  Banknote,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Document, Credential, DocumentsResponse, CredentialsResponse } from "@/lib/api-types";

// Icon mapping for different document types
const getDocumentIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'passport':
      return <ShieldCheck className="h-8 w-8 text-viridian-green" />;
    case 'national_id':
    case 'nid':
      return <BadgeCheck className="h-8 w-8 text-viridian-green" />;
    case 'medical':
    case 'medical_clearance':
      return <HeartPulse className="h-8 w-8 text-viridian-green" />;
    case 'skills':
    case 'certificate':
    case 'training':
      return <Briefcase className="h-8 w-8 text-viridian-green" />;
    case 'bank':
    case 'financial':
      return <Banknote className="h-8 w-8 text-viridian-green" />;
    default:
      return <FileText className="h-8 w-8 text-viridian-green" />;
  }
};

// Status badge variant mapping
const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'verified':
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
    case 'expired':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function VcDashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch worker documents and credentials in parallel
        const [documentsResponse, credentialsResponse] = await Promise.all([
          apiClient.getWorkerDocuments(),
          apiClient.getWorkerCredentials()
        ]);

        setDocuments(documentsResponse.data);
        setCredentials(credentialsResponse.data);
      } catch (err) {
        console.error('Error fetching worker data:', err);
        setError('Failed to load your credentials. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWorkerData();
    }
  }, [user]);

  // Combine documents and credentials for display
  const allCredentials = [
    ...documents.map(doc => ({
      id: doc.id,
      title: doc.documentType.replace(/([A-Z])/g, ' $1').trim(),
      issuer: doc.worker?.name || 'System Generated',
      issueDate: new Date(doc.createdAt),
      status: doc.status,
      icon: getDocumentIcon(doc.documentType)
    })),
    ...credentials.map(cred => ({
      id: cred.id,
      title: cred.type.replace(/([A-Z])/g, ' $1').trim(),
      issuer: 'SafePass Authority',
      issueDate: new Date(cred.issuanceDate),
      status: 'Verified' as const,
      icon: getDocumentIcon(cred.type)
    }))
  ];

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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Welcome back, {user?.name || 'Worker'}!
        </h1>
        <p className="text-slate-500">
          This is your secure digital portfolio. Share credentials with trusted
          employers with a single tap.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {allCredentials.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Credentials Yet
            </h3>
            <p className="text-slate-500">
              Upload your documents to start building your digital portfolio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCredentials.map((cred) => (
            <Card key={cred.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  {cred.icon}
                  <Badge variant={getStatusVariant(cred.status)}>
                    {cred.status.charAt(0).toUpperCase() + cred.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg text-dark-jungle-green">
                  {cred.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  Issued by: {cred.issuer}
                </CardDescription>
                <p className="text-xs text-slate-400 mt-4">
                  Issued on: {format(cred.issueDate, "PPP")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
