"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function CreateJobListingPage() {
  // In a real app, use React Hook Form + Zod for state and validation
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Create New Job Listing
        </h1>
        <p className="text-slate-500">
          Fill in the details to post a new job opportunity.
        </p>
      </div>

      <form className="mt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title</Label>
            <Input id="job-title" placeholder="e.g., Senior Welder" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" placeholder="e.g., Qatar Gas" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qatar">Qatar</SelectItem>
                <SelectItem value="saudi-arabia">Saudi Arabia</SelectItem>
                <SelectItem value="uae">UAE</SelectItem>
                <SelectItem value="oman">Oman</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Salary</Label>
            <Input id="salary" placeholder="e.g., $2500/mo" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Job Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the responsibilities, qualifications, and benefits..."
            className="min-h-[150px]"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-viridian-green hover:bg-sage-green"
          >
            Post Job Listing
          </Button>
        </div>
      </form>
    </div>
  );
}
