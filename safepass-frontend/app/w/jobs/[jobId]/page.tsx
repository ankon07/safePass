"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  MapPin,
  ShieldCheck,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Job } from "@/lib/api-types";
import { apiClient } from "@/lib/api-client";

export default function JobDetailsPage({
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
        <Link
          href="/w/jobs"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-dark-jungle-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all jobs
        </Link>
      </div>
    );
  }

  if (!job) {
    notFound();
  }

  const formatSalary = (salary: { min: number; max: number; currency: string }) => {
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  return (
    <div>
      <Link
        href="/w/jobs"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-dark-jungle-green mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Main Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-dark-jungle-green">
                  {job.title}
                </h1>
                <p className="text-lg text-slate-600 mt-1">{job.companyName}</p>
              </div>
              <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>
                {job.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {job.location.city}, {job.location.country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>{formatSalary(job.salary)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{job.jobType}</span>
              </div>
            </div>

            {/* Job Details */}
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-dark-jungle-green mb-2">Category</h3>
                <Badge variant="outline">{job.category}</Badge>
              </div>
              
              <div>
                <h3 className="font-semibold text-dark-jungle-green mb-2">Working Hours</h3>
                <p className="text-slate-600">{job.workingHours}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {job.visaSponsorship && (
                  <Badge variant="secondary">Visa Sponsored</Badge>
                )}
                {job.accommodationProvided && (
                  <Badge variant="secondary">Accommodation Provided</Badge>
                )}
                {job.transportationProvided && (
                  <Badge variant="secondary">Transportation Provided</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-dark-jungle-green">
              Job Description
            </h2>
            <p className="text-slate-600 whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {job.requirements && job.requirements.length > 0 && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-dark-jungle-green">
                Requirements
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                {job.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-dark-jungle-green">
                Benefits
              </h2>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Agency Info & Apply Button */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recruiting Agency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-viridian-green">
                {job.companyName}
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="font-bold">Verified Agency</span>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                <p><strong>Posted:</strong> {new Date(job.postedAt).toLocaleDateString()}</p>
                <p><strong>Expires:</strong> {new Date(job.expiresAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="sticky top-20">
            <Button
              size="lg"
              className="w-full bg-viridian-green hover:bg-sage-green"
              asChild
              disabled={job.status !== 'Active'}
            >
              <Link href={`/w/jobs/${job.id}/apply`}>
                {job.status === 'Active' ? 'Apply Now' : 'Job Not Available'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
