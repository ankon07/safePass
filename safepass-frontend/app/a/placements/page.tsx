"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

type ProcessStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cleared"
  | "Failed"
  | "Booked";
type StatusType = "visaStatus" | "medicalStatus" | "flightStatus";

// DUMMY DATA
const initialWorkers = [
  {
    id: "w1",
    name: "Karim Ahmed",
    jobTitle: "Senior Welder",
    visaStatus: "Approved",
    medicalStatus: "Cleared",
    flightStatus: "Booked",
  },
  {
    id: "w2",
    name: "Amina Khatun",
    jobTitle: "Hotel Housekeeping",
    visaStatus: "Pending",
    medicalStatus: "Pending",
    flightStatus: "Pending",
  },
  {
    id: "w3",
    name: "Rahman Ali",
    jobTitle: "Construction Worker",
    visaStatus: "Approved",
    medicalStatus: "Pending",
    flightStatus: "Pending",
  },
];

const statusOptions = {
  visaStatus: ["Pending", "Approved", "Rejected"],
  medicalStatus: ["Pending", "Cleared", "Failed"],
  flightStatus: ["Pending", "Booked"],
};

export default function PlacementTrackingDashboardPage() {
  const [workers, setWorkers] = useState(initialWorkers);

  const handleStatusChange = (
    workerId: string,
    statusType: StatusType,
    newStatus: ProcessStatus
  ) => {
    setWorkers((currentWorkers) =>
      currentWorkers.map((worker) =>
        worker.id === workerId ? { ...worker, [statusType]: newStatus } : worker
      )
    );
    // TODO: Add API call here to persist the change
  };

  const getStatusVariant = (status: ProcessStatus) => {
    switch (status) {
      case "Approved":
      case "Cleared":
      case "Booked":
        return "default";
      case "Pending":
        return "secondary";
      case "Rejected":
      case "Failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-jungle-green">
            Placement Tracking
          </h1>
          <p className="text-slate-500">
            Update pre-departure milestones for placed workers.
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Visa Status</TableHead>
              <TableHead>Medical Status</TableHead>
              <TableHead>Flight Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.jobTitle}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant={getStatusVariant(
                          worker.visaStatus as ProcessStatus
                        )}
                        className="cursor-pointer"
                      >
                        {worker.visaStatus}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {statusOptions.visaStatus.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onSelect={() =>
                            handleStatusChange(
                              worker.id,
                              "visaStatus",
                              status as ProcessStatus
                            )
                          }
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant={getStatusVariant(
                          worker.medicalStatus as ProcessStatus
                        )}
                        className="cursor-pointer"
                      >
                        {worker.medicalStatus}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {statusOptions.medicalStatus.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onSelect={() =>
                            handleStatusChange(
                              worker.id,
                              "medicalStatus",
                              status as ProcessStatus
                            )
                          }
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant={getStatusVariant(
                          worker.flightStatus as ProcessStatus
                        )}
                        className="cursor-pointer"
                      >
                        {worker.flightStatus}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {statusOptions.flightStatus.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onSelect={() =>
                            handleStatusChange(
                              worker.id,
                              "flightStatus",
                              status as ProcessStatus
                            )
                          }
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
