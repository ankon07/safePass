import Link from "next/link";
import { applications } from "@/lib/dummy-data";
import { ApplicationStatusCard } from "@/components/worker-portal/application-status-card";
import { Info } from "lucide-react";

export default function ApplicationTrackingDashboardPage() {
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

      {applications.length > 0 ? (
        <div className="space-y-6">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={
                app.status === "Offer Received"
                  ? `/w/applications/${app.id}/review`
                  : `/w/jobs/${app.job.id}`
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
