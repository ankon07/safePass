import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grievance, GrievanceStatus } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// A function to determine the badge color based on status
const getStatusVariant = (
  status: GrievanceStatus
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Resolved":
      return "default";
    case "Investigating":
      return "secondary";
    default:
      return "outline";
  }
};

export function GrievanceCaseCard({ grievance }: { grievance: Grievance }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-dark-jungle-green">
              {grievance.title}
            </CardTitle>
            <CardDescription>Case #{grievance.caseId}</CardDescription>
          </div>
          <Badge
            variant={getStatusVariant(grievance.status)}
            className={cn(
              grievance.status === "Resolved" && "bg-viridian-green text-white"
            )}
          >
            {grievance.status}
          </Badge>
        </div>
      </CardHeader>
      <CardFooter>
        <p className="text-xs text-slate-500">
          Filed on: {format(grievance.submissionDate, "PPP")}
        </p>
      </CardFooter>
    </Card>
  );
}
