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
import { DollarSign, MapPin } from "lucide-react";
import { Job } from "@/lib/dummy-data";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/w/jobs/${job.id}`}>
      <Card className="h-full flex flex-col hover:border-viridian-green transition-colors">
        <CardHeader>
          <CardTitle className="text-lg text-dark-jungle-green">
            {job.title}
          </CardTitle>
          <CardDescription>{job.companyName}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex items-center text-sm text-slate-600">
            <MapPin className="h-4 w-4 mr-2 text-sage-green" />
            {job.location}, {job.country}
          </div>
          <div className="flex items-center text-sm text-slate-600 mt-2">
            <DollarSign className="h-4 w-4 mr-2 text-sage-green" />
            {job.salary}
          </div>
        </CardContent>
        <CardFooter>
          <Badge variant="secondary">{job.contractDuration}</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
