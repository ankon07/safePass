"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  DollarSign,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Copy,
  CheckCircle,
  Search,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { EscrowDeposit, ApiError } from "@/lib/api-types";

function WorkerEscrowPage() {
  const { user } = useAuth();
  const [escrowDeposits, setEscrowDeposits] = useState<EscrowDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<EscrowDeposit | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [searchContractAddress, setSearchContractAddress] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<EscrowDeposit | null>(null);

  useEffect(() => {
    if (user?.worker_address) {
      fetchWorkerEscrows();
    } else if (user && !user.worker_address) {
      setLoading(false);
      setError('Worker blockchain address not found. Please contact support.');
    }
  }, [user]);

  const fetchWorkerEscrows = async () => {
    if (!user?.worker_address) {
      setError('Worker blockchain address not available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWorkerEscrows(user.worker_address);
      setEscrowDeposits(response.data || []);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching worker escrows:', err);
      setError(apiError.error || 'Failed to load escrow deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEscrow = async () => {
    if (!searchContractAddress.trim()) return;

    try {
      setSearchLoading(true);
      const response = await apiClient.getEscrowDeposit(searchContractAddress.trim());
      setSearchResult(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || 'Escrow deposit not found');
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
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
          <p className="text-slate-500">Loading escrow deposits...</p>
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
              My Escrow Deposits
            </h1>
            <p className="text-slate-500">
              View escrow deposits for your employment contracts
            </p>
          </div>
          <Button onClick={fetchWorkerEscrows} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
      </div>

      {/* Search Escrow Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Escrow by Contract
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a contract address to view its escrow details
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter contract address..."
                value={searchContractAddress}
                onChange={(e) => setSearchContractAddress(e.target.value)}
                disabled={searchLoading}
              />
            </div>
            <Button 
              onClick={handleSearchEscrow}
              disabled={searchLoading || !searchContractAddress.trim()}
            >
              {searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Escrow Found</h4>
                <Badge className={getStatusColor(searchResult.status)}>
                  {searchResult.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-semibold">{formatCurrency(searchResult.deposit_amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{formatDate(searchResult.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escrow Deposits Table */}
      {escrowDeposits.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Escrow Deposits
            </h3>
            <p className="text-slate-500">
              Your escrow deposits will appear here once employers make deposits for your contracts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Escrow Deposits</CardTitle>
            <p className="text-sm text-muted-foreground">
              All escrow deposits for your employment contracts
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
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

export default withAuth(WorkerEscrowPage, ['Worker']);
