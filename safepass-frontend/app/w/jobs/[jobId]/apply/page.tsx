import { notFound } from "next/navigation";
import { getJobById } from "@/lib/dummy-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const job = getJobById(params.jobId);

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
            agencyName={job.agency.name}
            requiredCredentials={requiredCredentials}
          />
        </CardContent>
      </Card>
    </div>
  );
}
