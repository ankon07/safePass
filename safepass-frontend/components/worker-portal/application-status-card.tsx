import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Application, ApplicationStatus } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// A function to determine the badge color based on status
const getStatusVariant = (
  status: ApplicationStatus
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Offer Received":
      return "default";
    case "Under Review":
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
  application: Application;
}) {
  return (
    <Card className="hover:border-viridian-green transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-dark-jungle-green">
              {application.job.title}
            </CardTitle>
            <CardDescription>{application.job.companyName}</CardDescription>
          </div>
          <Badge
            variant={getStatusVariant(application.status)}
            className={cn(
              application.status === "Offer Received" &&
                "bg-viridian-green text-white"
            )}
          >
            {application.status}
          </Badge>
        </div>
      </CardHeader>
      <CardFooter>
        <p className="text-xs text-slate-500">
          Submitted on: {format(application.submissionDate, "PPP")}
        </p>
      </CardFooter>
    </Card>
  );
}
