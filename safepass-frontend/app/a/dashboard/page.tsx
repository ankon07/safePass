"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpRight, CheckCircle2, Clock, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { UserStatsResponse, TrustScore, ApiError } from "@/lib/api-types";

interface DashboardStats {
  userStats: UserStatsResponse | null;
  trustScore: TrustScore | null;
  loading: boolean;
  error: string | null;
}

function AgencyDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    userStats: null,
    trustScore: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Fetch user statistics
        const userStatsPromise = apiClient.getUserStats();
        
        // Get trust score using the user's agency address if available
        let trustScorePromise: Promise<TrustScore | null> = Promise.resolve(null);
        if (user?.agency_address) {
          trustScorePromise = apiClient.getAgencyTrustScore(user.agency_address).catch(() => null);
        }

        const [userStats, trustScore] = await Promise.all([
          userStatsPromise,
          trustScorePromise,
        ]);

        setStats({
          userStats,
          trustScore,
          loading: false,
          error: null,
        });
      } catch (error) {
        const apiError = error as ApiError;
        setStats(prev => ({
          ...prev,
          loading: false,
          error: apiError.error || "Failed to load dashboard data",
        }));
      }
    };

    fetchDashboardData();
  }, []);

  if (stats.loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Agency Dashboard
        </h1>
        {user && (
          <p className="text-slate-600 mt-2">Welcome back, {user.name}!</p>
        )}
      </div>

      {stats.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{stats.error}</AlertDescription>
        </Alert>
      )}

      {!user?.agency_address && (
        <Alert className="mb-6">
          <AlertDescription>
            Your agency address is not configured. Trust score features will be limited until you complete your agency registration.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Main Trust Score Card */}
        <Card className="md:col-span-2 lg:col-span-2 bg-light-grayish-green border-none">
          <CardHeader>
            <CardTitle className="text-dark-jungle-green">
              Agency Trust Score
            </CardTitle>
            <CardDescription>
              Your on-chain reputation based on performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-7xl font-bold text-dark-jungle-green">
                {stats.trustScore ? stats.trustScore.trust_score_display : "N/A"}
              </span>
              <Link
                href="/a/dashboard/trust-score"
                className="flex items-center text-sm text-viridian-green hover:underline"
              >
                View Details
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            {stats.trustScore && (
              <p className="text-sm text-slate-600 mt-2">
                Last updated: {new Date(stats.trustScore.timestamp).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* User Statistics Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <span className="text-5xl font-bold">
              {stats.userStats?.totalUsers || 0}
            </span>
            <Users className="h-10 w-10 text-sage-green" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Workers</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <span className="text-5xl font-bold">
              {stats.userStats?.roleBreakdown.workers || 0}
            </span>
            <Users className="h-10 w-10 text-viridian-green" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agency Admins</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <span className="text-5xl font-bold">
              {stats.userStats?.roleBreakdown.agencyAdmins || 0}
            </span>
            <CheckCircle2 className="h-10 w-10 text-sage-green" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regulators</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <span className="text-5xl font-bold">
              {stats.userStats?.roleBreakdown.regulators || 0}
            </span>
            <Clock className="h-10 w-10 text-sage-green" />
          </CardContent>
        </Card>

        {/* System Overview Card */}
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Platform Overview</CardTitle>
            <CardDescription>
              Real-time statistics from the SafePass platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-viridian-green">
                  {stats.userStats?.totalUsers || 0}
                </div>
                <div className="text-sm text-slate-600">Total Platform Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-viridian-green">
                  {stats.trustScore ? "Active" : "Pending"}
                </div>
                <div className="text-sm text-slate-600">Trust Score Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-viridian-green">
                  {user?.role || "Unknown"}
                </div>
                <div className="text-sm text-slate-600">Your Role</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-dark-jungle-green mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/a/jobs/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-viridian-green/10 rounded-lg">
                    <Users className="h-5 w-5 text-viridian-green" />
                  </div>
                  <div>
                    <div className="font-medium">Post New Job</div>
                    <div className="text-sm text-slate-600">Create job listing</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/a/candidates">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-viridian-green/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-viridian-green" />
                  </div>
                  <div>
                    <div className="font-medium">View Candidates</div>
                    <div className="text-sm text-slate-600">Browse worker profiles</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/a/settings/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-viridian-green/10 rounded-lg">
                    <Clock className="h-5 w-5 text-viridian-green" />
                  </div>
                  <div>
                    <div className="font-medium">Agency Settings</div>
                    <div className="text-sm text-slate-600">Manage your profile</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Protect this page - only agency admins should access it
export default withAuth(AgencyDashboardPage, ['AgencyAdmin']);
