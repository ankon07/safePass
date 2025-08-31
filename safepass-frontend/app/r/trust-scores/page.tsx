"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Award,
  TrendingUp,
  Calculator,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { TrustScore, TrustScoreStatistics, TopAgenciesResponse, ApiError } from "@/lib/api-types";

function TrustScoreManagementPage() {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<TrustScoreStatistics | null>(null);
  const [topAgencies, setTopAgencies] = useState<TrustScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [searchedAgency, setSearchedAgency] = useState<TrustScore | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchTrustScoreData();
  }, []);

  const fetchTrustScoreData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trust score data in parallel
      const [statisticsResponse, topAgenciesResponse] = await Promise.all([
        apiClient.getTrustScoreStatistics(),
        apiClient.getTopAgencies(20) // Get top 20 agencies
      ]);

      setStatistics(statisticsResponse);
      setTopAgencies(topAgenciesResponse.agencies);
    } catch (err) {
      console.error('Error fetching trust score data:', err);
      setError('Failed to load trust score data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAllScores = async () => {
    try {
      setCalculating(true);
      setError(null);
      
      await apiClient.calculateTrustScores();
      
      // Refresh data after calculation
      await fetchTrustScoreData();
    } catch (err) {
      console.error('Error calculating trust scores:', err);
      setError('Failed to calculate trust scores. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleSearchAgency = async () => {
    if (!searchAddress.trim()) {
      setError('Please enter an agency address to search.');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      
      const agencyScore = await apiClient.getAgencyTrustScore(searchAddress.trim());
      setSearchedAgency(agencyScore);
    } catch (err) {
      console.error('Error searching agency:', err);
      setError('Agency not found or failed to fetch trust score.');
      setSearchedAgency(null);
    } finally {
      setSearching(false);
    }
  };

  const handleCalculateSpecificAgency = async (agencyAddress: string) => {
    try {
      setCalculating(true);
      setError(null);
      
      await apiClient.calculateTrustScores(agencyAddress);
      
      // Refresh data after calculation
      await fetchTrustScoreData();
      
      // If this was the searched agency, refresh its data too
      if (searchedAgency && searchedAgency.agency_address === agencyAddress) {
        const updatedAgency = await apiClient.getAgencyTrustScore(agencyAddress);
        setSearchedAgency(updatedAgency);
      }
    } catch (err) {
      console.error('Error calculating agency trust score:', err);
      setError('Failed to calculate agency trust score. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrustScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading trust score data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Trust Score Management
        </h1>
        <p className="text-slate-500">
          Monitor and manage agency trust scores across the platform.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_agencies}</div>
              <p className="text-xs text-muted-foreground">
                With trust scores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.average_score}</div>
              <p className="text-xs text-muted-foreground">
                System average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.max_score}</div>
              <p className="text-xs text-muted-foreground">
                Best performing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.min_score}</div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Calculate Trust Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Recalculate trust scores for all agencies based on current data.
            </p>
            <Button
              onClick={handleCalculateAllScores}
              disabled={calculating}
              className="w-full"
            >
              {calculating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Calculate All Trust Scores
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Agency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter agency blockchain address..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchAgency()}
              />
              <Button
                onClick={handleSearchAgency}
                disabled={searching}
                variant="outline"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {searchedAgency && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {searchedAgency.agency_name || 'Unknown Agency'}
                  </span>
                  <Badge variant={getTrustScoreBadgeVariant(searchedAgency.trust_score)}>
                    {searchedAgency.trust_score_display}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  Address: {searchedAgency.agency_address}
                </p>
                <Button
                  size="sm"
                  onClick={() => handleCalculateSpecificAgency(searchedAgency.agency_address)}
                  disabled={calculating}
                >
                  {calculating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Recalculate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Agencies</CardTitle>
        </CardHeader>
        <CardContent>
          {topAgencies.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No agency trust scores available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Trust Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAgencies.map((agency, index) => (
                  <TableRow key={agency.agency_address}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>
                      {agency.agency_name || 'Unknown Agency'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {agency.agency_address.slice(0, 10)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getTrustScoreColor(agency.trust_score)}`}>
                          {agency.trust_score_display}
                        </span>
                        <Badge variant={getTrustScoreBadgeVariant(agency.trust_score)}>
                          {agency.trust_score >= 80 ? 'Excellent' :
                           agency.trust_score >= 60 ? 'Good' :
                           agency.trust_score >= 40 ? 'Fair' : 'Poor'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCalculateSpecificAgency(agency.agency_address)}
                        disabled={calculating}
                      >
                        {calculating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Protect this page - only regulators should access it
export default withAuth(TrustScoreManagementPage, ['Regulator']);
