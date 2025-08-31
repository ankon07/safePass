"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApplicationStatusCard } from "@/components/worker-portal/application-status-card";
import { Info, Loader2, AlertCircle } from "lucide-react";
import { JobApplication } from "@/lib/api-types";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function ApplicationTrackingDashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getWorkerApplications();
        setApplications(response.data);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplications();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          My Applications
        </h1>
        <p className="text-slate-500">
          Track the status of all your submitted job applications.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {applications.length > 0 ? (
        <div className="space-y-6">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={
                app.status === "Accepted"
                  ? `/w/applications/${app.id}/review`
                  : `/w/jobs/${app.jobId}`
              }
            >
              <ApplicationStatusCard application={app} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Info className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-xl font-semibold">No Applications Yet</h3>
          <p className="text-slate-500 mt-2">
            When you apply for jobs, your applications will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
