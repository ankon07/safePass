import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

// DUMMY DATA
const jobListings = [
  {
    id: "jw-123",
    title: "Senior Welder - Qatar Gas",
    status: "Active",
    applicantsCount: 12,
  },
  {
    id: "jc-456",
    title: "Construction Worker - Al-Kharafi Global",
    status: "Active",
    applicantsCount: 35,
  },
  {
    id: "hh-789",
    title: "Hotel Housekeeping Staff - Emirates Palace",
    status: "Filled",
    applicantsCount: 8,
  },
  {
    id: "mt-101",
    title: "Mechanical Technician - Saudi Aramco",
    status: "Expired",
    applicantsCount: 22,
  },
];

export default function JobListingDashboardPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-jungle-green">
            Job Listings
          </h1>
          <p className="text-slate-500">
            Manage your active and past job postings.
          </p>
        </div>
        <Button asChild className="bg-viridian-green hover:bg-sage-green">
          <Link href="/a/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Job
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Applicants</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobListings.map((job) => (
              <TableRow
                key={job.id}
                className="cursor-pointer hover:bg-slate-50"
              >
                <TableCell className="font-medium">
                  <Link href={`/a/jobs/${job.id}`} className="block">
                    {job.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/a/jobs/${job.id}`} className="block">
                    <Badge
                      variant={
                        job.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {job.status}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/a/jobs/${job.id}`} className="block">
                    {job.applicantsCount}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
