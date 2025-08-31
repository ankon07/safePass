"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { Job } from "@/lib/api-types";
import { apiClient } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { ApplicationForm } from "@/components/worker-portal/application-form";

// In a real app, this data would be associated with the job itself
const requiredCredentials = [
  { id: "cred_passport", name: "Verified Passport" },
  { id: "cred_nid", name: "National ID (NID)" },
  { id: "cred_medical", name: "Medical Clearance" },
  { id: "cred_welder", name: "Certified Welder Certificate" },
];

export default function ApplicationSubmissionPage({
  params,
}: {
  params: { jobId: string };
}) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getJobById(params.jobId);
        setJob(response.data);
      } catch (err: any) {
        console.error('Error fetching job:', err);
        if (err.status === 404) {
          notFound();
        } else {
          setError('Failed to load job details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-dark-jungle-green">
            Apply for Job
          </CardTitle>
          <CardDescription>
            You are applying for the{" "}
            <span className="font-semibold text-viridian-green">
              {job.title}
            </span>{" "}
            position at{" "}
            <span className="font-semibold text-viridian-green">
              {job.companyName}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationForm
            jobId={job.id}
            agencyName={job.companyName}
            requiredCredentials={requiredCredentials}
          />
        </CardContent>
      </Card>
    </div>
  );
}
