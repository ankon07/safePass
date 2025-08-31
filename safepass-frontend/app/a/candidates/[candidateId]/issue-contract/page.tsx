"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// DUMMY DATA - In a real app, fetch this based on params.candidateId
const candidate = {
  id: "c3",
  name: "Karim Ahmed",
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f",
  appliedFor: "Senior Welder",
};

export default function SmartContractIssuancePage({
  params,
}: {
  params: { candidateId: string };
}) {
  const [date, setDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSendContract = async () => {
    setIsLoading(true);
    // TODO: Validate form and send API request to issue contract
    console.log(
      "Issuing contract for candidate:",
      params.candidateId,
      "with start date:",
      date
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    // TODO: Show success toast and redirect
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Issue Smart Contract
        </h1>
        <p className="text-slate-500">
          Generate and send a secure employment contract to the candidate.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <Avatar className="h-16 w-16">
            <AvatarImage src={candidate.avatar} />
            <AvatarFallback>{candidate.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-slate-500">Issuing contract to:</p>
            <p className="font-bold text-xl">{candidate.name}</p>
            <p className="text-slate-500">
              For position: {candidate.appliedFor}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="salary">Final Monthly Salary (USD)</Label>
            <Input id="salary" placeholder="e.g., 2500" type="number" />
          </div>

          <div className="space-y-2">
            <Label>Proposed Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSendContract}
            className="bg-viridian-green hover:bg-sage-green"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Generate & Send Contract"}
          </Button>
        </div>
      </div>
    </div>
  );
}
