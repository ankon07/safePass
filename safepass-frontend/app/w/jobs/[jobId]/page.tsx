import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobById } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";

export default function JobDetailsPage({
  params,
}: {
  params: { jobId: string };
}) {
  const job = getJobById(params.jobId);

  // If no job is found for the given ID, show the 404 page
  if (!job) {
    notFound();
  }

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
            <h1 className="text-3xl font-bold text-dark-jungle-green">
              {job.title}
            </h1>
            <p className="text-lg text-slate-600 mt-1">{job.companyName}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {job.location}, {job.country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>{job.salary}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{job.contractDuration} Contract</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-dark-jungle-green">
              Job Description
            </h2>
            <p className="text-slate-600 whitespace-pre-line">
              {/* Using dummy text as the description is currently '...' */}
              We are seeking a highly skilled and experienced Senior Welder to
              join our team in Doha, Qatar. The ideal candidate will be
              responsible for various welding projects, ensuring high-quality
              workmanship and adherence to safety standards. \nKey
              Responsibilities: - Perform welding on various materials using
              different techniques. - Read and interpret blueprints and
              schematics. - Maintain welding equipment and ensure a safe work
              environment.
            </p>
          </div>
        </div>

        {/* Right Column: Agency Info & Apply Button */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recruiting Agency</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/w/agencies/${job.agency.id}`}
                className="hover:underline"
              >
                <p className="font-semibold text-viridian-green">
                  {job.agency.name}
                </p>
              </Link>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="font-bold">
                  {(job.agency.trustScore * 100).toFixed(0)}% Trust Score
                </span>
              </div>
            </CardContent>
          </Card>
          <div className="sticky top-20">
            <Button
              size="lg"
              className="w-full bg-viridian-green hover:bg-sage-green"
              asChild
            >
              <Link href={`/w/jobs/${job.id}/apply`}>Apply Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
