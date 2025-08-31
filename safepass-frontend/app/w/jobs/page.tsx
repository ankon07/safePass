"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Job } from "@/lib/api-types";
import { apiClient } from "@/lib/api-client";
import { JobCard } from "@/components/worker-portal/job-card";

export default function JobFeedPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getAllJobs(1, 50); // Get first 50 jobs
        setJobs(response.data || []);
      } catch (err: any) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load job listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    let filteredList = jobs;

    if (searchQuery) {
      filteredList = filteredList.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCountry !== "all") {
      filteredList = filteredList.filter((job) => job.location.country === selectedCountry);
    }

    return filteredList;
  }, [jobs, searchQuery, selectedCountry]);

  const countries = [...new Set(jobs.map((job) => job.location.country))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading job opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Find Your Next Job
        </h1>
        <p className="text-slate-500">
          Browse verified opportunities from trusted recruitment agencies.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-slate-50 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by job title, company, or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Job Listings Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold">No Jobs Available</h3>
          <p className="text-slate-500 mt-2">
            Check back later for new opportunities.
          </p>
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold">No Jobs Found</h3>
          <p className="text-slate-500 mt-2">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
