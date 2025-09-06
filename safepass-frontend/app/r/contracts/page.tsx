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
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  ContractDetails,
  ContractTestResult,
  EscrowDeposit,
  EscrowStatistics,
  ApiError,
} from "@/lib/api-types";

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  disputedContracts: number;
  totalValue: number;
  averageValue: number;
  complianceRate: number;
}

function RegulatorContractsPage() {
  const { user } = useAuth();
  const [contractDetails, setContractDetails] = useState<ContractDetails | null>(null);
  const [testResults, setTestResults] = useState<ContractTestResult | null>(null);
  const [escrowDeposits, setEscrowDeposits] = useState<EscrowDeposit[]>([]);
  const [escrowStats, setEscrowStats] = useState<EscrowStatistics | null>(null);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [contractDetailsOpen, setContractDetailsOpen] = useState(false);

  useEffect(() => {
    fetchContractsData();
  }, []);

  const fetchContractsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        contractDetailsResponse,
        testResultsResponse,
        activeEscrowsResponse,
        escrowStatsResponse,
      ] = await Promise.all([
        apiClient.getContractDetails().catch(() => ({ success: false, contractDetails: null })),
        apiClient.testContractMethods().catch(() => ({ success: false, testResults: null })),
        apiClient.getActiveEscrows().catch(() => ({ data: [] })),
        apiClient.getEscrowStatistics().catch(() => ({ data: null })),
      ]);

      if (contractDetailsResponse.success) {
        setContractDetails(contractDetailsResponse.contractDetails);
      }

      if (testResultsResponse.success) {
        setTestResults(testResultsResponse.testResults);
      }

      setEscrowDeposits(activeEscrowsResponse.data || []);
      setEscrowStats(escrowStatsResponse.data);

      // Calculate contract stats from available data
      const deposits = activeEscrowsResponse.data || [];
      const totalContracts = deposits.length;
      const activeContracts = deposits.filter(d => d.status === "Active").length;
      const completedContracts = escrowStatsResponse.data?.released_deposits || 0;
      const disputedContracts = deposits.filter(d => d.status === "Disputed").length;
      const totalValue = deposits.reduce((sum, d) => sum + d.deposit_amount, 0);
      const averageValue = totalContracts > 0 ? totalValue / totalContracts : 0;
      const complianceRate = totalContracts > 0 ? ((activeContracts + completedContracts) / totalContracts) * 100 : 0;

      setStats({
        totalContracts,
        activeContracts,
        completedContracts,
        disputedContracts,
        totalValue,
        averageValue,
        complianceRate,
      });

    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to load contracts data");
    } finally {
      setLoading(false);
    }
  };

  const handleTestContract = async () => {
    try {
      setActionLoading("test-contract");
      const response = await apiClient.testContractMethods();
      setTestResults(response.testResults);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to test contract");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Released":
        return "secondary";
      case "Disputed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredDeposits = escrowDeposits.filter(deposit => {
    const matchesSearch = searchTerm === "" || 
      deposit.employer_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.worker_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.employment_contract_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading contracts management...</span>
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
              Contract Management
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor and oversee all employment contracts and compliance
            </p>
          </div>
          <Button onClick={fetchContractsData} variant="outline" size="sm">
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

      {/* Contract Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContracts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active: {stats?.activeContracts || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${(stats?.averageValue || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disputed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.disputedContracts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.complianceRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Based on escrow data
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contracts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contracts">Contract Deposits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employment Contract Deposits</CardTitle>
                  <CardDescription>
                    Monitor all employment contract escrow deposits
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search by contract address, employer, or worker..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </div>

              {/* Contracts Table */}
              {filteredDeposits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract Address</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Deposit Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-mono text-xs">
                          {deposit.employment_contract_address.slice(0, 10)}...
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {deposit.employer_address.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {deposit.worker_address.slice(0, 8)}...
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
                            onClick={() => setContractDetailsOpen(true)}
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
                  No contract deposits found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Analytics</CardTitle>
              <CardDescription>
                Insights and trends in contract management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Contract Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active:</span>
                      <span className="text-sm font-semibold">{stats?.activeContracts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed:</span>
                      <span className="text-sm font-semibold">{stats?.completedContracts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Disputed:</span>
                      <span className="text-sm font-semibold">{stats?.disputedContracts || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Financial Overview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Deposits:</span>
                      <span className="text-sm font-semibold">${(stats?.totalValue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average Deposit:</span>
                      <span className="text-sm font-semibold">${(stats?.averageValue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Compliance Rate:</span>
                      <span className="text-sm font-semibold">{(stats?.complianceRate || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {escrowStats && (
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Escrow Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Deposits:</span>
                      <p className="text-lg font-semibold">{escrowStats.total_deposits}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Amount:</span>
                      <p className="text-lg font-semibold">${escrowStats.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Active Amount:</span>
                      <p className="text-lg font-semibold">${escrowStats.active_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Released Amount:</span>
                      <p className="text-lg font-semibold">${escrowStats.released_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Smart contract system health and testing
                  </CardDescription>
                </div>
                <Button
                  onClick={handleTestContract}
                  disabled={actionLoading === "test-contract"}
                  size="sm"
                >
                  {actionLoading === "test-contract" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Test Contract
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {contractDetails && (
                  <div>
                    <h4 className="font-medium mb-4">Contract Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Worker:</span>
                        <p className="font-mono text-xs break-all">{contractDetails.worker}</p>
                      </div>
                      <div>
                        <span className="font-medium">Employer:</span>
                        <p className="font-mono text-xs break-all">{contractDetails.employer}</p>
                      </div>
                      <div>
                        <span className="font-medium">Salary:</span>
                        <p>{contractDetails.salary}</p>
                      </div>
                      <div>
                        <span className="font-medium">Pay Frequency:</span>
                        <p>{contractDetails.payFrequency}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge variant="outline" className="ml-2">{contractDetails.status}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Payment Status:</span>
                        <Badge variant="outline" className="ml-2">{contractDetails.paymentStatus}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Escrow Required:</span>
                        <p>{contractDetails.escrowRequirement}</p>
                      </div>
                      <div>
                        <span className="font-medium">Escrow Deposited:</span>
                        <Badge variant={contractDetails.escrowDeposited ? "default" : "destructive"} className="ml-2">
                          {contractDetails.escrowDeposited ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Worker Signed:</span>
                        <Badge variant={contractDetails.workerSigned ? "default" : "outline"} className="ml-2">
                          {contractDetails.workerSigned ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Employer Signed:</span>
                        <Badge variant={contractDetails.employerSigned ? "default" : "outline"} className="ml-2">
                          {contractDetails.employerSigned ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                    {contractDetails.escrowContract && (
                      <div className="mt-4">
                        <span className="font-medium">Escrow Contract:</span>
                        <p className="font-mono text-xs break-all bg-muted p-2 rounded mt-1">
                          {contractDetails.escrowContract}
                        </p>
                      </div>
                    )}
                    {contractDetails.nextPaymentDueDate && (
                      <div className="mt-4">
                        <span className="font-medium">Next Payment Due:</span>
                        <p className="text-sm">{contractDetails.nextPaymentDueDate}</p>
                      </div>
                    )}
                  </div>
                )}

                {testResults && (
                  <div>
                    <h4 className="font-medium mb-4">System Test Results</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm">Payment Count: {testResults.paymentCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResults.isReadyForActivation ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">Ready for Activation: {testResults.isReadyForActivation ? "Yes" : "No"}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 p-3 bg-muted rounded">
                        {testResults.message}
                      </p>
                    </div>
                  </div>
                )}

                {!contractDetails && !testResults && (
                  <div className="text-center py-8 text-slate-600">
                    No system status data available. Click "Test Contract" to run system tests.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contract Details Dialog */}
      <Dialog open={contractDetailsOpen} onOpenChange={setContractDetailsOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Contract System Details</DialogTitle>
            <DialogDescription>
              Smart contract system information and status
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {contractDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Worker Address</Label>
                    <p className="font-mono text-xs break-all">{contractDetails.worker}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employer Address</Label>
                    <p className="font-mono text-xs break-all">{contractDetails.employer}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Salary</Label>
                    <p className="font-semibold">{contractDetails.salary}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant="outline" className="mt-1">{contractDetails.status}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Escrow Contract</Label>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded mt-1">
                    {contractDetails.escrowContract || "Not available"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                No contract details available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(RegulatorContractsPage, ["Regulator"]);
