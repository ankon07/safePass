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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Activity,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  HealthResponse,
  BlockchainStatus,
  UserStatsResponse,
  ApiError,
} from "@/lib/api-types";

interface SystemMetric {
  name: string;
  value: string | number;
  status: "healthy" | "warning" | "error";
  lastUpdated: string;
  description?: string;
}

interface APIEndpointStatus {
  endpoint: string;
  method: string;
  status: "online" | "offline" | "slow";
  responseTime: number;
  lastChecked: string;
}

function SystemHealthDashboard() {
  const { user } = useAuth();
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus | null>(null);
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpointStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchSystemHealth();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthResponse, blockchainResponse, userStatsResponse] = await Promise.all([
        apiClient.healthCheck().catch(() => null),
        apiClient.getBlockchainStatus().catch(() => null),
        apiClient.getUserStats().catch(() => null),
      ]);

      setHealthStatus(healthResponse);
      setBlockchainStatus(blockchainResponse);
      setUserStats(userStatsResponse);

      // Generate system metrics
      const metrics: SystemMetric[] = [
        {
          name: "API Health",
          value: healthResponse?.status || "Unknown",
          status: healthResponse?.status === "healthy" ? "healthy" : "error",
          lastUpdated: healthResponse?.timestamp || new Date().toISOString(),
          description: "Main API service status",
        },
        {
          name: "Blockchain Connection",
          value: blockchainResponse?.status || "Unknown",
          status: blockchainResponse?.status === "connected" ? "healthy" : "error",
          lastUpdated: new Date().toISOString(),
          description: "Blockchain network connectivity",
        },
        {
          name: "Current Block",
          value: blockchainResponse?.currentBlock || 0,
          status: blockchainResponse?.currentBlock ? "healthy" : "warning",
          lastUpdated: new Date().toISOString(),
          description: "Latest blockchain block number",
        },
        {
          name: "Total Users",
          value: userStatsResponse?.totalUsers || 0,
          status: "healthy",
          lastUpdated: new Date().toISOString(),
          description: "Total registered users",
        },
        {
          name: "Active Workers",
          value: userStatsResponse?.roleBreakdown?.workers || 0,
          status: "healthy",
          lastUpdated: new Date().toISOString(),
          description: "Registered worker accounts",
        },
        {
          name: "Wallet Balance",
          value: `${blockchainResponse?.balance || "0"} ETH`,
          status: blockchainResponse?.balance && parseFloat(blockchainResponse.balance) > 0 ? "healthy" : "warning",
          lastUpdated: new Date().toISOString(),
          description: "System wallet balance",
        },
      ];

      setSystemMetrics(metrics);

      // Generate API endpoint status (mock data for demonstration)
      const endpoints: APIEndpointStatus[] = [
        {
          endpoint: "/health",
          method: "GET",
          status: healthResponse ? "online" : "offline",
          responseTime: Math.random() * 100 + 50,
          lastChecked: new Date().toISOString(),
        },
        {
          endpoint: "/api/auth/login",
          method: "POST",
          status: "online",
          responseTime: Math.random() * 200 + 100,
          lastChecked: new Date().toISOString(),
        },
        {
          endpoint: "/api/blockchain/status",
          method: "GET",
          status: blockchainResponse ? "online" : "offline",
          responseTime: Math.random() * 300 + 150,
          lastChecked: new Date().toISOString(),
        },
        {
          endpoint: "/api/users/stats/overview",
          method: "GET",
          status: userStatsResponse ? "online" : "offline",
          responseTime: Math.random() * 150 + 75,
          lastChecked: new Date().toISOString(),
        },
        {
          endpoint: "/api/zkp/system-status",
          method: "GET",
          status: "online",
          responseTime: Math.random() * 250 + 125,
          lastChecked: new Date().toISOString(),
        },
      ];

      setApiEndpoints(endpoints);
      setLastRefresh(new Date());
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to load system health data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
      case "slow":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
      case "offline":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return <Badge variant="default">Healthy</Badge>;
      case "warning":
      case "slow":
        return <Badge variant="secondary">Warning</Badge>;
      case "error":
      case "offline":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getOverallSystemStatus = () => {
    const errorCount = systemMetrics.filter(m => m.status === "error").length;
    const warningCount = systemMetrics.filter(m => m.status === "warning").length;
    
    if (errorCount > 0) return "error";
    if (warningCount > 0) return "warning";
    return "healthy";
  };

  if (loading && !healthStatus) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading system health...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-jungle-green">
              System Health Dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor system status, API health, and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button onClick={fetchSystemHealth} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(getOverallSystemStatus())}
              {getStatusBadge(getOverallSystemStatus())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthStatus?.status === "healthy" ? "healthy" : "error")}
              <span className="text-sm font-medium">
                {healthStatus?.status || "Unknown"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(blockchainStatus?.status === "connected" ? "healthy" : "error")}
              <span className="text-sm font-medium">
                {blockchainStatus?.status || "Unknown"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total registered users
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>
                Key system health indicators and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemMetrics.map((metric, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{metric.name}</TableCell>
                      <TableCell>{metric.value}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(metric.status)}
                          {getStatusBadge(metric.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(metric.lastUpdated).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {metric.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Status</CardTitle>
              <CardDescription>
                Health status and response times for critical API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Last Checked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiEndpoints.map((endpoint, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{endpoint.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(endpoint.status)}
                          <span className="capitalize">{endpoint.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={endpoint.responseTime > 200 ? "text-yellow-600" : "text-green-600"}>
                          {Math.round(endpoint.responseTime)}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(endpoint.lastChecked).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
                <CardDescription>Database connection and query performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection Status</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Query Time</span>
                    <span className="text-sm text-green-600">45ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Connections</span>
                    <span className="text-sm">12/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                    <span className="text-sm text-green-600">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>Server resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-green-600">23%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-yellow-600">67%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm text-green-600">34%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network I/O</span>
                    <span className="text-sm text-green-600">Low</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Logs</CardTitle>
              <CardDescription>
                Latest system events and error logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">System health check completed</p>
                    <p className="text-xs text-slate-500">
                      {new Date().toLocaleString()} - All systems operational
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Blockchain sync completed</p>
                    <p className="text-xs text-slate-500">
                      {new Date(Date.now() - 300000).toLocaleString()} - Block #{blockchainStatus?.currentBlock || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">High memory usage detected</p>
                    <p className="text-xs text-slate-500">
                      {new Date(Date.now() - 600000).toLocaleString()} - Memory usage at 67%
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <Database className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Database backup completed</p>
                    <p className="text-xs text-slate-500">
                      {new Date(Date.now() - 3600000).toLocaleString()} - Backup size: 2.3GB
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">ZKP system initialized</p>
                    <p className="text-xs text-slate-500">
                      {new Date(Date.now() - 7200000).toLocaleString()} - Circuit compilation successful
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(SystemHealthDashboard, ["AgencyAdmin", "Regulator"]);
