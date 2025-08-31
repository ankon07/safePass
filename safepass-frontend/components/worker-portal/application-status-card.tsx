import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobApplication } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// A function to determine the badge color based on status
const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Accepted":
      return "default";
    case "Reviewed":
    case "Pending":
      return "secondary";
    case "Rejected":
      return "destructive";
    default:
      return "outline";
  }
};

export function ApplicationStatusCard({
  application,
}: {
  application: JobApplication;
}) {
  return (
    <Card className="hover:border-viridian-green transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-dark-jungle-green">
              {application.job?.title || 'Job Title'}
            </CardTitle>
            <CardDescription>
              {application.job?.companyName || 'Company Name'}
            </CardDescription>
          </div>
          <Badge
            variant={getStatusVariant(application.status)}
            className={cn(
              application.status === "Accepted" &&
                "bg-viridian-green text-white"
            )}
          >
            {application.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {application.job?.location && (
          <p className="text-sm text-slate-600">
            📍 {application.job.location.city}, {application.job.location.country}
          </p>
        )}
        {application.reviewerNotes && (
          <div className="mt-2">
            <p className="text-sm font-medium text-slate-700">Review Notes:</p>
            <p className="text-sm text-slate-600">{application.reviewerNotes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-xs text-slate-500">
          Applied on: {format(new Date(application.appliedAt), "PPP")}
        </p>
        {application.reviewedAt && (
          <p className="text-xs text-slate-500">
            Reviewed: {format(new Date(application.reviewedAt), "PPP")}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
