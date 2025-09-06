"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Shield,
  DollarSign,
  Calendar,
  Plus,
  Calculator,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Copy,
  CheckCircle,
  Search,
  TrendingUp,
  Building,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { EscrowDeposit, EscrowStatistics, ApiError } from "@/lib/api-types";

interface RecordDepositForm {
  employment_contract_address: string;
  employer_address: string;
  worker_address: string;
  deposit_amount: string;
  transaction_hash: string;
}

interface CalculateRequirementForm {
  salary: string;
  pay_frequency_days: string;
}

function AgencyEscrowPage() {
  const { user } = useAuth();
  const [escrowDeposits, setEscrowDeposits] = useState<EscrowDeposit[]>([]);
  const [escrowStats, setEscrowStats] = useState<EscrowStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<EscrowDeposit | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [recordForm, setRecordForm] = useState<RecordDepositForm>({
    employment_contract_address: "",
    employer_address: "",
    worker_address: "",
    deposit_amount: "",
    transaction_hash: "",
  });

  const [calculatorForm, setCalculatorForm] = useState<CalculateRequirementForm>({
    salary: "",
    pay_frequency_days: "30",
  });

  const [calculationResult, setCalculationResult] = useState<any>(null);

  useEffect(() => {
    if (user?.agency_address) {
      fetchAgencyEscrows();
    }
  }, [user]);

  const fetchAgencyEscrows = async () => {
    if (!user?.agency_address) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEmployerEscrows(user.agency_address);
      setEscrowDeposits(response.data || []);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching agency escrows:', err);
      setError(apiError.error || 'Failed to load escrow deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDeposit = async () => {
    try {
      setActionLoading('record-deposit');
      await apiClient.recordEscrowDeposit({
        employment_contract_address: recordForm.employment_contract_address,
        employer_address: recordForm.employer_address,
        worker_address: recordForm.worker_address,
        deposit_amount: parseFloat(recordForm.deposit_amount),
        transaction_hash: recordForm.transaction_hash,
      });
      
      setRecordDialogOpen(false);
      setRecordForm({
        employment_contract_address: "",
        employer_address: "",
        worker_address: "",
        deposit_amount: "",
        transaction_hash: "",
      });
      await fetchAgencyEscrows();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || 'Failed to record escrow deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCalculateRequirement = async () => {
    try {
      setActionLoading('calculate');
      const response = await apiClient.calculateEscrowRequirement(
        parseFloat(calculatorForm.salary),
        parseInt(calculatorForm.pay_frequency_days)
      );
      setCalculationResult(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || 'Failed to calculate escrow requirement');
    } finally {
      setActionLoading(null);
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

  const openDetailsDialog = (deposit: EscrowDeposit) => {
    setSelectedDeposit(deposit);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Released':
        return 'bg-blue-500';
      case 'Disputed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  const getTotalEscrowed = () => {
    return escrowDeposits.reduce((total, deposit) => total + deposit.deposit_amount, 0);
  };

  const getActiveEscrows = () => {
    return escrowDeposits.filter(deposit => deposit.status === 'Active');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading escrow management...</p>
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
              Escrow Management
            </h1>
            <p className="text-slate-500">
              Manage escrow deposits for your employment contracts
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={calculatorDialogOpen} onOpenChange={setCalculatorDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Requirement
                </Button>
              </DialogTrigger>
            </Dialog>
            <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Deposit
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button onClick={fetchAgencyEscrows} variant="outline" size="sm">
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Escrowed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalEscrowed())}</div>
            <p className="text-xs text-muted-foreground">
              Across {escrowDeposits.length} contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Escrows</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveEscrows().length}</div>
            <p className="text-xs text-muted-foreground">
              Currently protected contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getActiveEscrows().reduce((total, deposit) => total + deposit.deposit_amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              In active escrows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contracts</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escrowDeposits.length}</div>
            <p className="text-xs text-muted-foreground">
              Total employment contracts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Deposits Table */}
      {escrowDeposits.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Escrow Deposits
            </h3>
            <p className="text-slate-500">
              Record your first escrow deposit to get started with contract protection.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Escrow Deposits</CardTitle>
            <p className="text-sm text-muted-foreground">
              All escrow deposits for your agency's employment contracts
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escrowDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>
                      <div className="font-mono text-xs">
                        {deposit.employment_contract_address.slice(0, 10)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">
                        {deposit.worker_address.slice(0, 10)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(deposit.deposit_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(deposit.status)}>
                        {deposit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(deposit.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsDialog(deposit)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(deposit.employment_contract_address, `contract-${deposit.id}`)}
                        >
                          {copySuccess === `contract-${deposit.id}` ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Record Deposit Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Record Escrow Deposit
            </DialogTitle>
            <DialogDescription>
              Record a new escrow deposit from a blockchain transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="contract-address">Employment Contract Address</Label>
                <Input
                  id="contract-address"
                  value={recordForm.employment_contract_address}
                  onChange={(e) => setRecordForm({ ...recordForm, employment_contract_address: e.target.value })}
                  placeholder="0x..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employer-address">Employer Address</Label>
                  <Input
                    id="employer-address"
                    value={recordForm.employer_address}
                    onChange={(e) => setRecordForm({ ...recordForm, employer_address: e.target.value })}
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <Label htmlFor="worker-address">Worker Address</Label>
                  <Input
                    id="worker-address"
                    value={recordForm.worker_address}
                    onChange={(e) => setRecordForm({ ...recordForm, worker_address: e.target.value })}
                    placeholder="0x..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit-amount">Deposit Amount (USD)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.01"
                    value={recordForm.deposit_amount}
                    onChange={(e) => setRecordForm({ ...recordForm, deposit_amount: e.target.value })}
                    placeholder="1000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="transaction-hash">Transaction Hash</Label>
                  <Input
                    id="transaction-hash"
                    value={recordForm.transaction_hash}
                    onChange={(e) => setRecordForm({ ...recordForm, transaction_hash: e.target.value })}
                    placeholder="0x..."
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordDeposit}
              disabled={actionLoading === 'record-deposit'}
            >
              {actionLoading === 'record-deposit' && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Record Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculator Dialog */}
      <Dialog open={calculatorDialogOpen} onOpenChange={setCalculatorDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Escrow Requirement Calculator
            </DialogTitle>
            <DialogDescription>
              Calculate the required escrow amount for a contract
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="salary">Monthly Salary (USD)</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={calculatorForm.salary}
                onChange={(e) => setCalculatorForm({ ...calculatorForm, salary: e.target.value })}
                placeholder="5000.00"
              />
            </div>
            <div>
              <Label htmlFor="pay-frequency">Pay Frequency (Days)</Label>
              <Input
                id="pay-frequency"
                type="number"
                value={calculatorForm.pay_frequency_days}
                onChange={(e) => setCalculatorForm({ ...calculatorForm, pay_frequency_days: e.target.value })}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Common values: 7 (weekly), 14 (bi-weekly), 30 (monthly)
              </p>
            </div>

            {calculationResult && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Calculation Result</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Salary:</span>
                    <span className="font-semibold">{formatCurrency(calculationResult.salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pay Frequency:</span>
                    <span>{calculationResult.pay_frequency_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span>{calculationResult.calculation_method}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Required Escrow:</span>
                    <span className="text-green-600">{formatCurrency(calculationResult.escrow_requirement)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCalculatorDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={handleCalculateRequirement}
              disabled={actionLoading === 'calculate'}
            >
              {actionLoading === 'calculate' && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Calculate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Escrow Deposit Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this escrow deposit
            </DialogDescription>
          </DialogHeader>

          {selectedDeposit && (
            <div className="space-y-6">
              {/* Status and Amount */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {formatCurrency(selectedDeposit.deposit_amount)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Escrow Amount</p>
                </div>
                <Badge className={getStatusColor(selectedDeposit.status)} variant="outline">
                  {selectedDeposit.status}
                </Badge>
              </div>

              {/* Contract Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Contract Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contract Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                        {selectedDeposit.employment_contract_address}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(selectedDeposit.employment_contract_address, 'contract-details')}
                      >
                        {copySuccess === 'contract-details' ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Employer Address</Label>
                      <p className="font-mono text-sm bg-muted p-2 rounded mt-1 break-all">
                        {selectedDeposit.employer_address}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Worker Address</Label>
                      <p className="font-mono text-sm bg-muted p-2 rounded mt-1 break-all">
                        {selectedDeposit.worker_address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Transaction Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transaction Hash</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                        {selectedDeposit.transaction_hash}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(selectedDeposit.transaction_hash, 'tx-hash')}
                      >
                        {copySuccess === 'tx-hash' ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://etherscan.io/tx/${selectedDeposit.transaction_hash}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                      <p className="text-sm mt-1">{formatDate(selectedDeposit.created_at)}</p>
                    </div>
                    {selectedDeposit.updated_at && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                        <p className="text-sm mt-1">{formatDate(selectedDeposit.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Release Reason (if applicable) */}
              {selectedDeposit.release_reason && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Release Reason</Label>
                  <p className="text-sm bg-muted p-3 rounded">{selectedDeposit.release_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {copySuccess && (
        <Alert className="fixed bottom-4 right-4 w-auto">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {copySuccess.includes('contract') ? 'Contract address copied!' : 
             copySuccess.includes('tx') ? 'Transaction hash copied!' : 
             'Copied to clipboard!'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default withAuth(AgencyEscrowPage, ['AgencyAdmin']);
