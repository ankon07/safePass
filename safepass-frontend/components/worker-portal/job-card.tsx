import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MapPin, Clock } from "lucide-react";
import { Job } from "@/lib/api-types";

export function JobCard({ job }: { job: Job }) {
  const formatSalary = (salary: { min: number; max: number; currency: string }) => {
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Closed':
        return 'destructive';
      case 'Draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Link href={`/w/jobs/${job.id}`}>
      <Card className="h-full flex flex-col hover:border-viridian-green transition-colors">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg text-dark-jungle-green">
                {job.title}
              </CardTitle>
              <CardDescription>{job.companyName}</CardDescription>
            </div>
            <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex items-center text-sm text-slate-600 mb-2">
            <MapPin className="h-4 w-4 mr-2 text-sage-green" />
            {job.location.city}, {job.location.country}
          </div>
          <div className="flex items-center text-sm text-slate-600 mb-2">
            <DollarSign className="h-4 w-4 mr-2 text-sage-green" />
            {formatSalary(job.salary)}
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <Clock className="h-4 w-4 mr-2 text-sage-green" />
            {job.jobType}
          </div>
          {job.description && (
            <p className="text-sm text-slate-500 mt-3 line-clamp-2">
              {job.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Badge variant="outline">{job.category}</Badge>
          {job.visaSponsorship && (
            <Badge variant="secondary">Visa Sponsored</Badge>
          )}
          {job.accommodationProvided && (
            <Badge variant="secondary">Accommodation</Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
