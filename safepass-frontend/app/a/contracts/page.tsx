"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Copy,
  User,
  Building,
  Shield,
  TrendingUp,
  TestTube,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { ContractDetails, ContractTestResult, ApiError } from "@/lib/api-types";

function AgencyContractsPage() {
  const { user } = useAuth();
  const [contractDetails, setContractDetails] = useState<ContractDetails | null>(null);
  const [testResults, setTestResults] = useState<ContractTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchContractDetails();
  }, []);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getContractDetails();
      setContractDetails(response.contractDetails);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching contract details:', err);
      setError(apiError.error || 'Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  const handleTestContract = async () => {
    try {
      setTestLoading(true);
      const response = await apiClient.testContractMethods();
      setTestResults(response.testResults);
      setTestDialogOpen(true);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error testing contract:', err);
      setError(apiError.error || 'Failed to test contract methods');
    } finally {
      setTestLoading(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '0': // Draft
        return 'bg-gray-500';
      case '1': // Active
        return 'bg-green-500';
      case '2': // Completed
        return 'bg-blue-500';
      case '3': // Terminated
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case '0':
        return 'Draft';
      case '1':
        return 'Active';
      case '2':
        return 'Completed';
      case '3':
        return 'Terminated';
      default:
        return 'Unknown';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case '0': // Pending
        return 'bg-yellow-500';
      case '1': // Paid
        return 'bg-green-500';
      case '2': // Overdue
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case '0':
        return 'Pending';
      case '1':
        return 'Paid';
      case '2':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount) / 1e18; // Convert from wei
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return format(date, "PPP");
  };

  const formatFrequency = (frequency: string) => {
    const days = parseInt(frequency) / (24 * 60 * 60); // Convert seconds to days
    if (days === 7) return 'Weekly';
    if (days === 14) return 'Bi-weekly';
    if (days === 30) return 'Monthly';
    return `Every ${days} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading contract management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-jungle-green">
              Contract Management
            </h1>
            <p className="text-slate-500">
              Manage and monitor employment contracts
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTestContract} variant="outline" size="sm" disabled={testLoading}>
              {testLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Contract
            </Button>
            <Button onClick={fetchContractDetails} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!contractDetails ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Contract Found
            </h3>
            <p className="text-slate-500">
              No employment contract details are available at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Contract Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contract Status</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(contractDetails.status)}>
                  {getStatusText(contractDetails.status)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={getPaymentStatusColor(contractDetails.paymentStatus)}>
                  {getPaymentStatusText(contractDetails.paymentStatus)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Escrow Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {contractDetails.escrowDeposited ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {contractDetails.escrowDeposited ? 'Deposited' : 'Not Deposited'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Signatures</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {contractDetails.workerSigned ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs">Worker</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {contractDetails.employerSigned ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs">Employer</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contract Details Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payment">Payment Terms</TabsTrigger>
              <TabsTrigger value="escrow">Escrow Details</TabsTrigger>
              <TabsTrigger value="parties">Contract Parties</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Contract Overview
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    High-level contract information and status
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Contract Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(contractDetails.status)}>
                            {getStatusText(contractDetails.status)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPaymentStatusColor(contractDetails.paymentStatus)}>
                            {getPaymentStatusText(contractDetails.paymentStatus)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Salary</Label>
                        <p className="text-2xl font-bold">{formatCurrency(contractDetails.salary)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Pay Frequency</Label>
                        <p className="text-lg">{formatFrequency(contractDetails.payFrequency)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Terms
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Salary and payment schedule details
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Salary Amount</Label>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(contractDetails.salary)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Frequency</Label>
                        <p className="text-lg font-semibold">{formatFrequency(contractDetails.payFrequency)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Next Payment Due</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <p className="text-lg font-semibold">{formatDate(contractDetails.nextPaymentDueDate)}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                        <Badge className={getPaymentStatusColor(contractDetails.paymentStatus)} variant="outline">
                          {getPaymentStatusText(contractDetails.paymentStatus)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="escrow" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Escrow Protection
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Escrow deposit and protection details
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Required Escrow</Label>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(contractDetails.escrowRequirement)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Deposit Status</Label>
                        <div className="flex items-center gap-2">
                          {contractDetails.escrowDeposited ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-lg font-semibold">
                            {contractDetails.escrowDeposited ? 'Deposited' : 'Not Deposited'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Escrow Contract Address</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                            {contractDetails.escrowContract}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(contractDetails.escrowContract, 'escrow')}
                          >
                            {copySuccess === 'escrow' ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parties" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contract Parties
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Worker and employer information and signatures
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Worker Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Worker
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Wallet Address</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                              {contractDetails.worker}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(contractDetails.worker, 'worker')}
                            >
                              {copySuccess === 'worker' ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Signature Status</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {contractDetails.workerSigned ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm font-semibold">
                              {contractDetails.workerSigned ? 'Signed' : 'Not Signed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Employer Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Employer
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Wallet Address</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                              {contractDetails.employer}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(contractDetails.employer, 'employer')}
                            >
                              {copySuccess === 'employer' ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Signature Status</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {contractDetails.employerSigned ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm font-semibold">
                              {contractDetails.employerSigned ? 'Signed' : 'Not Signed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Available actions for contract management
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Raw Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                      <DialogTitle>Raw Contract Data</DialogTitle>
                      <DialogDescription>
                        Complete contract information in JSON format
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                        {JSON.stringify(contractDetails, null, 2)}
                      </pre>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report (Coming Soon)
                </Button>

                <Button disabled>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Payment (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Contract Test Results
            </DialogTitle>
            <DialogDescription>
              Results from testing contract methods
            </DialogDescription>
          </DialogHeader>

          {testResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Count</Label>
                      <p className="text-2xl font-bold">{testResults.paymentCount}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Ready for Activation</Label>
                      <div className="flex items-center gap-2">
                        {testResults.isReadyForActivation ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-lg font-semibold">
                          {testResults.isReadyForActivation ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-muted-foreground">Test Message</Label>
                    <p className="text-sm bg-background p-2 rounded mt-1">{testResults.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {copySuccess && (
        <Alert className="fixed bottom-4 right-4 w-auto">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {copySuccess === 'worker' ? 'Worker address copied!' : 
             copySuccess === 'employer' ? 'Employer address copied!' : 
             copySuccess === 'escrow' ? 'Escrow contract copied!' : 
             'Copied to clipboard!'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default withAuth(AgencyContractsPage, ['AgencyAdmin']);
