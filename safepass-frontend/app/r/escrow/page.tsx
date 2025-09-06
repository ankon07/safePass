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
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  EscrowDeposit,
  EscrowStatistics,
  ApiError,
} from "@/lib/api-types";

interface EscrowStats {
  totalDeposits: number;
  totalAmount: number;
  activeDeposits: number;
  completedDeposits: number;
  pendingDeposits: number;
  averageAmount: number;
}

interface ComplianceIssue {
  id: string;
  agencyId: string;
  agencyName: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  createdAt: string;
  status: "open" | "investigating" | "resolved";
}

function RegulatorEscrowPage() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<EscrowDeposit[]>([]);
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [selectedDeposit, setSelectedDeposit] = useState<EscrowDeposit | null>(null);
  const [depositDetailsOpen, setDepositDetailsOpen] = useState(false);

  useEffect(() => {
    fetchEscrowData();
  }, []);

  const fetchEscrowData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [activeResponse, statisticsResponse] = await Promise.all([
        apiClient.getActiveEscrows(),
        apiClient.getEscrowStatistics(),
      ]);

      setDeposits(activeResponse.data || []);

      // Calculate stats from API response
      const statsData = statisticsResponse.data;
      const totalDeposits = activeResponse.data?.length || 0;
      const totalAmount = activeResponse.data?.reduce((sum: number, d: EscrowDeposit) => sum + d.deposit_amount, 0) || 0;
      const activeDeposits = activeResponse.data?.filter((d: EscrowDeposit) => d.status === "Active").length || 0;
      const completedDeposits = statsData?.released_deposits || 0;
      const pendingDeposits = activeResponse.data?.filter((d: EscrowDeposit) => d.status === "Disputed").length || 0;
      const averageAmount = totalDeposits > 0 ? totalAmount / totalDeposits : 0;

      setStats({
        totalDeposits,
        totalAmount,
        activeDeposits,
        completedDeposits,
        pendingDeposits,
        averageAmount,
      });

      // Mock compliance issues for demonstration
      setComplianceIssues([
        {
          id: "1",
          agencyId: "agency-1",
          agencyName: "TechCorp Solutions",
          type: "Insufficient Deposit",
          severity: "high",
          description: "Agency has not maintained required minimum escrow balance for 3 consecutive days",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "open",
        },
        {
          id: "2",
          agencyId: "agency-2",
          agencyName: "Global Staffing Inc",
          type: "Late Payment",
          severity: "medium",
          description: "Escrow payment was 5 days overdue for contract #12345",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: "investigating",
        },
      ]);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to load escrow data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDepositDetails = (deposit: EscrowDeposit) => {
    setSelectedDeposit(deposit);
    setDepositDetailsOpen(true);
  };

  const handleUpdateComplianceStatus = async (issueId: string, newStatus: string) => {
    try {
      setActionLoading(`compliance-${issueId}`);
      // Mock API call - in real implementation, this would update the compliance issue
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setComplianceIssues(prev => 
        prev.map(issue => 
          issue.id === issueId 
            ? { ...issue, status: newStatus as "open" | "investigating" | "resolved" }
            : issue
        )
      );
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to update compliance status");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "pending":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getComplianceStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "destructive";
      case "investigating":
        return "secondary";
      case "resolved":
        return "default";
      default:
        return "outline";
    }
  };

  const filteredDeposits = deposits.filter(deposit => {
    const matchesStatus = statusFilter === "all" || deposit.status === statusFilter;
    const matchesAgency = agencyFilter === "all" || deposit.employer_address === agencyFilter;
    const matchesSearch = searchTerm === "" || 
      deposit.employer_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.employment_contract_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesAgency && matchesSearch;
  });

  const uniqueAgencies = Array.from(new Set(deposits.map(d => d.employer_address)));

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading escrow management...</span>
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
              Escrow Management
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor and oversee all escrow deposits and compliance
            </p>
          </div>
          <Button onClick={fetchEscrowData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Escrow Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDeposits || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active: {stats?.activeDeposits || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${(stats?.averageAmount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingDeposits || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceIssues.filter(i => i.status === "open").length}</div>
            <p className="text-xs text-muted-foreground">
              Open issues
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deposits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deposits">All Deposits</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Escrow Deposits</CardTitle>
                  <CardDescription>
                    Monitor all escrow deposits across agencies
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search by agency or contract ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by agency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agencies</SelectItem>
                    {uniqueAgencies.map(agency => (
                      <SelectItem key={agency} value={agency}>{agency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Deposits Table */}
              {filteredDeposits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agency</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-medium">{deposit.employer_address}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {deposit.employment_contract_address || "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${deposit.deposit_amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(deposit.status)}>
                            {deposit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(deposit.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDepositDetails(deposit)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  No deposits found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Escrow Requirements</CardTitle>
              <CardDescription>
                Current escrow requirements and policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Standard Employment Contract</h4>
                    <Badge variant="outline">Employment</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    Minimum escrow requirement for standard employment contracts
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Minimum Amount:</span> $5,000
                    </div>
                    <div>
                      <span className="font-medium">Percentage:</span> 15%
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">High-Risk Contract</h4>
                    <Badge variant="outline">High-Risk</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    Enhanced escrow requirement for high-risk employment contracts
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Minimum Amount:</span> $10,000
                    </div>
                    <div>
                      <span className="font-medium">Percentage:</span> 25%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Issues</CardTitle>
              <CardDescription>
                Monitor and resolve escrow compliance violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complianceIssues.length > 0 ? (
                <div className="space-y-4">
                  {complianceIssues.map((issue) => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{issue.type}</h4>
                          <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <Badge variant={getComplianceStatusBadgeVariant(issue.status)}>
                            {issue.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        <span className="font-medium">Agency:</span> {issue.agencyName}
                      </p>
                      <p className="text-sm text-slate-600 mb-3">
                        {issue.description}
                      </p>
                      <div className="flex gap-2">
                        {issue.status === "open" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateComplianceStatus(issue.id, "investigating")}
                            disabled={actionLoading === `compliance-${issue.id}`}
                          >
                            {actionLoading === `compliance-${issue.id}` && (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            )}
                            Start Investigation
                          </Button>
                        )}
                        {issue.status === "investigating" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateComplianceStatus(issue.id, "resolved")}
                            disabled={actionLoading === `compliance-${issue.id}`}
                          >
                            {actionLoading === `compliance-${issue.id}` && (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            )}
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  No compliance issues found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Escrow Analytics</CardTitle>
              <CardDescription>
                Insights and trends in escrow management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Deposit Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active:</span>
                      <span className="text-sm font-semibold">{stats?.activeDeposits || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed:</span>
                      <span className="text-sm font-semibold">{stats?.completedDeposits || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pending:</span>
                      <span className="text-sm font-semibold">{stats?.pendingDeposits || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Financial Overview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Value:</span>
                      <span className="text-sm font-semibold">${(stats?.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Deposit:</span>
                      <span className="text-sm font-semibold">${(stats?.averageAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Agencies:</span>
                      <span className="text-sm font-semibold">{uniqueAgencies.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deposit Details Dialog */}
      <Dialog open={depositDetailsOpen} onOpenChange={setDepositDetailsOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Deposit Details</DialogTitle>
            <DialogDescription>
              Detailed information about the escrow deposit
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Deposit ID</Label>
                  <p className="font-mono text-sm">{selectedDeposit.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedDeposit.status)} className="mt-1">
                    {selectedDeposit.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Employer Address</Label>
                  <p className="font-mono text-sm">{selectedDeposit.employer_address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="font-semibold">${selectedDeposit.deposit_amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Contract Address</Label>
                  <p className="font-mono text-sm">{selectedDeposit.employment_contract_address || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-sm">{new Date(selectedDeposit.created_at).toLocaleString()}</p>
                </div>
              </div>
              {selectedDeposit.transaction_hash && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Transaction Hash</Label>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded mt-1">
                    {selectedDeposit.transaction_hash}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(RegulatorEscrowPage, ["Regulator"]);
