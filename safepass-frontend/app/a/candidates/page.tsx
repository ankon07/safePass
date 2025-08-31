"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Users, 
  MapPin, 
  Calendar, 
  Loader2,
  Eye,
  UserCheck,
  Mail
} from "lucide-react";
import Link from "next/link";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { User, WorkersResponse, ApiError } from "@/lib/api-types";

interface CandidatesPageState {
  workers: User[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
}

function CandidatesPage() {
  const { user } = useAuth();
  const [state, setState] = useState<CandidatesPageState>({
    workers: [],
    loading: true,
    error: null,
    searchTerm: "",
  });

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const response: WorkersResponse = await apiClient.getAllWorkers();
        
        setState(prev => ({
          ...prev,
          workers: response.workers,
          loading: false,
        }));
      } catch (error) {
        const apiError = error as ApiError;
        setState(prev => ({
          ...prev,
          loading: false,
          error: apiError.error || "Failed to load candidates",
        }));
      }
    };

    fetchWorkers();
  }, []);

  const filteredWorkers = state.workers.filter(worker =>
    worker.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    worker.email.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchTerm: value }));
  };

  if (state.loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading candidates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Candidate Pool
        </h1>
        <p className="text-slate-600 mt-2">
          Browse verified workers available for placement
        </p>
      </div>

      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Candidates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-viridian-green" />
              <div>
                <div className="text-2xl font-bold">{state.workers.length}</div>
                <div className="text-sm text-slate-600">Total Workers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-viridian-green" />
              <div>
                <div className="text-2xl font-bold">{filteredWorkers.length}</div>
                <div className="text-sm text-slate-600">Matching Search</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-viridian-green" />
              <div>
                <div className="text-2xl font-bold">
                  {state.workers.filter(w => {
                    const createdDate = new Date(w.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return createdDate > thirtyDaysAgo;
                  }).length}
                </div>
                <div className="text-sm text-slate-600">New This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers List */}
      <div className="space-y-4">
        {filteredWorkers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No candidates found
              </h3>
              <p className="text-slate-600">
                {state.searchTerm 
                  ? "Try adjusting your search criteria"
                  : "No workers have registered yet"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkers.map((worker) => (
            <Card key={worker.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-viridian-green/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-viridian-green" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-dark-jungle-green">
                          {worker.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-4 w-4" />
                          {worker.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined {new Date(worker.created_at).toLocaleDateString()}
                      </div>
                      <Badge variant="secondary" className="bg-viridian-green/10 text-viridian-green">
                        {worker.role}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>DID: {worker.did}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/a/candidates/${worker.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </Link>
                    <Button size="sm" className="bg-viridian-green hover:bg-sage-green">
                      Contact
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button (for pagination in future) */}
      {filteredWorkers.length > 0 && (
        <div className="mt-8 text-center">
          <Button variant="outline" disabled>
            Load More Candidates
          </Button>
          <p className="text-sm text-slate-600 mt-2">
            Showing {filteredWorkers.length} of {state.workers.length} candidates
          </p>
        </div>
      )}
    </div>
  );
}

// Protect this page - only agency admins should access it
export default withAuth(CandidatesPage, ['AgencyAdmin']);
