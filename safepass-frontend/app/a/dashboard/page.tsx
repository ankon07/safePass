import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, CheckCircle2, Clock, Users } from "lucide-react";
import Link from "next/link";

export default function AnalyticsDashboardPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-dark-jungle-green mb-6">
        Agency Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Main Trust Score Card */}
        <Card className="md:col-span-2 lg:col-span-2 bg-light-grayish-green border-none">
          <CardHeader>
            <CardTitle className="text-dark-jungle-green">
              Agent Trust Score
            </CardTitle>
            <CardDescription>
              Your on-chain reputation based on performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-7xl font-bold text-dark-jungle-green">
                91
              </span>
              <Link
                href="/a/dashboard/trust-score"
                className="flex items-center text-sm text-viridian-green hover:underline"
              >
                View Details
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Successful Placements</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <span className="text-5xl font-bold">132</span>
            <Users className="h-10 w-10 text-sage-green" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avg. Time-to-Fill</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <span className="text-5xl font-bold">45</span>
            <span className="text-lg text-slate-500 -mb-1 ml-1">Days</span>
            <Clock className="h-10 w-10 text-sage-green" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">
              Dispute-Free Placement Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <span className="text-5xl font-bold">98%</span>
            <CheckCircle2 className="h-10 w-10 text-sage-green" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
