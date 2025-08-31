import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Ticket } from "lucide-react";
import { grievances } from "@/lib/dummy-data";
import { GrievanceCaseCard } from "@/components/worker-portal/grievance-case-card";

export default function GrievanceTrackerPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-jungle-green">
            My Grievance Cases
          </h1>
          <p className="text-slate-500">
            Track the status of your submitted reports.
          </p>
        </div>
        <Button asChild className="bg-viridian-green hover:bg-sage-green">
          <Link href="/w/grievances/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            File New Grievance
          </Link>
        </Button>
      </div>

      {grievances.length > 0 ? (
        <div className="space-y-6">
          {grievances.map((grievance) => (
            <GrievanceCaseCard key={grievance.caseId} grievance={grievance} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Ticket className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-xl font-semibold">No Grievances Filed</h3>
          <p className="text-slate-500 mt-2">
            If you encounter any issues, you can file a confidential report.
          </p>
        </div>
      )}
    </div>
  );
}
