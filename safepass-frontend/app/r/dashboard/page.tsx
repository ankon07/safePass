"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileCheck,
  Users,
  Award,
  Key,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { UserStatsResponse, TrustScoreStatistics, Document, ApiError } from "@/lib/api-types";

function RegulatorDashboard() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [trustScoreStats, setTrustScoreStats] = useState<TrustScoreStatistics | null>(null);
  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data in parallel
        const [userStatsResponse, trustScoreStatsResponse, pendingDocsResponse] = await Promise.all([
          apiClient.getUserStats(),
          apiClient.getTrustScoreStatistics(),
          apiClient.getPendingDocuments()
        ]);

        setUserStats(userStatsResponse);
        setTrustScoreStats(trustScoreStatsResponse);
        setPendingDocuments(pendingDocsResponse.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        const apiError = err as ApiError;
        setError(apiError.error || 'Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Regulator Dashboard
        </h1>
        <p className="text-slate-500">
          Welcome back, {user?.name}. Monitor system activity and manage verifications.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trustScoreStats?.total_agencies || 0}</div>
            <p className="text-xs text-muted-foreground">
              With trust scores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trust Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trustScoreStats?.average_score || "0.0"}</div>
            <p className="text-xs text-muted-foreground">
              System average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Role Breakdown */}
      {userStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Workers</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{userStats.roleBreakdown.workers}</Badge>
                    <span className="text-sm text-slate-500">
                      {((userStats.roleBreakdown.workers / userStats.totalUsers) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Agency Admins</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{userStats.roleBreakdown.agencyAdmins}</Badge>
                    <span className="text-sm text-slate-500">
                      {((userStats.roleBreakdown.agencyAdmins / userStats.totalUsers) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Regulators</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{userStats.roleBreakdown.regulators}</Badge>
                    <span className="text-sm text-slate-500">
                      {((userStats.roleBreakdown.regulators / userStats.totalUsers) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trust Score Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {trustScoreStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Score</span>
                    <Badge variant="default">{trustScoreStats.average_score}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Highest Score</span>
                    <Badge variant="default">{trustScoreStats.max_score}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Lowest Score</span>
                    <Badge variant="outline">{trustScoreStats.min_score}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Median Score</span>
                    <Badge variant="secondary">{trustScoreStats.median_score}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No trust score data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/r/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <FileCheck className="h-8 w-8 text-viridian-green mx-auto mb-2" />
                <h3 className="font-semibold">Review Documents</h3>
                <p className="text-sm text-slate-500">
                  {pendingDocuments.length} pending
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/r/trust-scores">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Award className="h-8 w-8 text-viridian-green mx-auto mb-2" />
                <h3 className="font-semibold">Manage Trust Scores</h3>
                <p className="text-sm text-slate-500">
                  {trustScoreStats?.total_agencies || 0} agencies
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/r/licenses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Key className="h-8 w-8 text-viridian-green mx-auto mb-2" />
                <h3 className="font-semibold">License Management</h3>
                <p className="text-sm text-slate-500">ZKP system</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/r/users">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-viridian-green mx-auto mb-2" />
                <h3 className="font-semibold">User Management</h3>
                <p className="text-sm text-slate-500">
                  {userStats?.totalUsers || 0} total users
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

// Protect this page - only regulators should access it
export default withAuth(RegulatorDashboard, ['Regulator']);
