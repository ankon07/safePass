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
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { ContractDetails, ContractTestResult, ApiError } from "@/lib/api-types";

function WorkerContractsPage() {
  const { user } = useAuth();
  const [contractDetails, setContractDetails] = useState<ContractDetails | null>(null);
  const [testResults, setTestResults] = useState<ContractTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
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
    const timestampNum = parseInt(timestamp);
    if (timestampNum === 0) {
      return "Not set";
    }
    const date = new Date(timestampNum * 1000);
    return format(date, "PPP");
  };

  const formatFrequency = (frequency: string) => {
    const days = parseInt(frequency); // Contract returns days directly
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
          <p className="text-slate-500">Loading contract details...</p>
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
              Employment Contract
            </h1>
            <p className="text-slate-500">
              View your employment contract details and status
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTestContract} variant="outline" size="sm" disabled={testLoading}>
              {testLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
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
                <CardTitle className="text-sm font-medium">Worker Signed</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {contractDetails.workerSigned ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {contractDetails.workerSigned ? 'Signed' : 'Not Signed'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employer Signed</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {contractDetails.employerSigned ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {contractDetails.employerSigned ? 'Signed' : 'Not Signed'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Details
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Employment contract information and terms
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parties */}
                <div className="space-y-4">
                  <h4 className="font-medium">Contract Parties</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Worker Address</Label>
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
                      <Label className="text-sm font-medium text-muted-foreground">Employer Address</Label>
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
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="space-y-4">
                  <h4 className="font-medium">Payment Terms</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Salary</Label>
                      <p className="text-lg font-semibold">{formatCurrency(contractDetails.salary)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Pay Frequency</Label>
                      <p className="text-sm">{formatFrequency(contractDetails.payFrequency)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Next Payment Due</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <p className="text-sm">{formatDate(contractDetails.nextPaymentDueDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Escrow Information */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Escrow Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Escrow Requirement</Label>
                    <p className="text-lg font-semibold">{formatCurrency(contractDetails.escrowRequirement)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Escrow Status</Label>
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
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Escrow Contract</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs bg-muted p-1 rounded break-all">
                        {contractDetails.escrowContract.slice(0, 10)}...
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

          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Contract Test Results
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latest contract method test results
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Test Message</Label>
                    <p className="text-sm bg-muted p-2 rounded">{testResults.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Available actions for this contract
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                      <DialogTitle>Complete Contract Details</DialogTitle>
                      <DialogDescription>
                        All contract information in raw format
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                        {JSON.stringify(contractDetails, null, 2)}
                      </pre>
                    </div>
                  </DialogContent>
                </Dialog>

                {!contractDetails.workerSigned && (
                  <Button disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Sign Contract (Coming Soon)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

export default withAuth(WorkerContractsPage, ['Worker']);
