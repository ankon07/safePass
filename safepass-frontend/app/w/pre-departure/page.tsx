import { milestones, Milestone, MilestoneStatus } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  LoaderCircle,
  Circle,
  FileCheck2,
  HeartPulse,
  CreditCard,
  Plane,
} from "lucide-react";

// Helper to map an icon to each milestone ID
const milestoneIcons: { [key: string]: React.ReactNode } = {
  ms1: <FileCheck2 className="h-5 w-5" />,
  ms2: <HeartPulse className="h-5 w-5" />,
  ms3: <CreditCard className="h-5 w-5" />,
  ms4: <Plane className="h-5 w-5" />,
};

// Helper to get the right status icon
const StatusIcon = ({ status }: { status: MilestoneStatus }) => {
  switch (status) {
    case "Completed":
      return (
        <CheckCircle2 className="h-8 w-8 text-white bg-viridian-green rounded-full p-1" />
      );
    case "In Progress":
      return <LoaderCircle className="h-8 w-8 text-blue-500 animate-spin" />;
    case "Pending":
      return <Circle className="h-8 w-8 text-slate-300" />;
  }
};

export default function PreDepartureChecklistPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Pre-Departure Checklist
        </h1>
        <p className="text-slate-500">
          Track the real-time status of your journey&apos;s next steps.
        </p>
      </div>

      <div className="max-w-3xl">
        <ul>
          {milestones.map((milestone, index) => (
            <li key={milestone.id} className="flex gap-6">
              {/* Timeline Graphic */}
              <div className="flex flex-col items-center">
                <StatusIcon status={milestone.status} />
                {index < milestones.length - 1 && (
                  <div
                    className={cn(
                      "w-px h-full mt-2",
                      milestone.status === "Completed"
                        ? "bg-viridian-green"
                        : "bg-slate-300"
                    )}
                  ></div>
                )}
              </div>

              {/* Milestone Content */}
              <div className="pb-12">
                <div className="flex items-center gap-3">
                  <div className="bg-light-grayish-green p-2 rounded-md text-dark-jungle-green">
                    {milestoneIcons[milestone.id]}
                  </div>
                  <h3
                    className={cn(
                      "font-bold text-lg",
                      milestone.status === "Pending"
                        ? "text-slate-400"
                        : "text-dark-jungle-green"
                    )}
                  >
                    {milestone.title}
                  </h3>
                </div>
                <p className="mt-2 text-slate-600">{milestone.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
