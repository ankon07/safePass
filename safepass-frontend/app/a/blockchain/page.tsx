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
import { Textarea } from "@/components/ui/textarea";
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
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Server,
  Wallet,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  BlockchainStatus,
  BlockchainCredential,
  WorkerCredentials,
  ApiError,
} from "@/lib/api-types";

interface ContractEvent {
  id: string;
  contract: string;
  event: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: string;
  data: any;
}

interface WorkerLookupResult {
  address: string;
  credentials: BlockchainCredential[];
  totalCredentials: number;
  verifiedCredentials: number;
}

interface RegisterContractForm {
  name: string;
  address: string;
  abi: string;
}

interface DeployContractForm {
  name: string;
  abi: string;
  bytecode: string;
  constructorArgs: string;
}

function BlockchainDashboard() {
  const { user } = useAuth();
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus | null>(null);
  const [credentials, setCredentials] = useState<BlockchainCredential[]>([]);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [workerLookupResults, setWorkerLookupResults] = useState<WorkerLookupResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [registerForm, setRegisterForm] = useState<RegisterContractForm>({
    name: "",
    address: "",
    abi: "",
  });
  const [deployForm, setDeployForm] = useState<DeployContractForm>({
    name: "",
    abi: "",
    bytecode: "",
    constructorArgs: "",
  });

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [workerLookupDialogOpen, setWorkerLookupDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<string>("");
  const [newCredentialStatus, setNewCredentialStatus] = useState<string>("");

  // Filter states
  const [credentialSearchTerm, setCredentialSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState({
    eventType: "",
    contractAddress: "",
    dateFrom: "",
    dateTo: "",
  });
  const [workerSearchAddress, setWorkerSearchAddress] = useState("");

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusResponse, eventsResponse] = await Promise.all([
        apiClient.getBlockchainStatus(),
        apiClient.getContractEvents("AgencyRegistry", "AgencyRegistered").catch(() => ({ events: [] })),
      ]);

      setBlockchainStatus(statusResponse);
      setEvents(eventsResponse.events || []);
      
      // For now, we'll use empty credentials array since the API method doesn't exist yet
      setCredentials([]);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to load blockchain data");
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCredential = async () => {
    try {
      setActionLoading("issue-credential");
      await apiClient.issueCredentialOnBlockchain("issue");
      await fetchBlockchainData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to issue credential");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCredentialStatus = async () => {
    if (!selectedCredential || !newCredentialStatus) return;

    try {
      setActionLoading("update-status");
      await apiClient.updateCredentialStatus(selectedCredential, newCredentialStatus);
      setCredentialDialogOpen(false);
      setSelectedCredential("");
      setNewCredentialStatus("");
      await fetchBlockchainData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to update credential status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegisterContract = async () => {
    try {
      setActionLoading("register-contract");
      const abi = JSON.parse(registerForm.abi);
      await apiClient.registerContract(registerForm.name, registerForm.address, abi);
      setRegisterDialogOpen(false);
      setRegisterForm({ name: "", address: "", abi: "" });
      await fetchBlockchainData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to register contract");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeployContract = async () => {
    try {
      setActionLoading("deploy-contract");
      const abi = JSON.parse(deployForm.abi);
      const constructorArgs = deployForm.constructorArgs
        ? JSON.parse(deployForm.constructorArgs)
        : [];
      
      await apiClient.deployContract(
        deployForm.name,
        abi,
        deployForm.bytecode,
        constructorArgs
      );
      
      setDeployDialogOpen(false);
      setDeployForm({ name: "", abi: "", bytecode: "", constructorArgs: "" });
      await fetchBlockchainData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to deploy contract");
    } finally {
      setActionLoading(null);
    }
  };

  const handleWorkerLookup = async () => {
    if (!workerSearchAddress.trim()) return;

    try {
      setActionLoading("worker-lookup");
      const response = await apiClient.getWorkerCredentialsFromBlockchain(workerSearchAddress);
      
      const lookupResult: WorkerLookupResult = {
        address: workerSearchAddress,
        credentials: response.credentials.map((c: any) => ({
          credentialId: c.id,
          status: c.status,
          issuer: 'Unknown',
          holder: workerSearchAddress,
          issuanceDate: c.issuanceDate,
        })),
        totalCredentials: response.credentials.length,
        verifiedCredentials: response.credentials.filter((c: any) => c.status === 'verified').length,
      };

      setWorkerLookupResults([lookupResult, ...workerLookupResults.slice(0, 4)]); // Keep last 5 searches
      setWorkerLookupDialogOpen(false);
      setWorkerSearchAddress("");
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to lookup worker credentials");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = credentialSearchTerm === "" || 
      credential.credentialId.toLowerCase().includes(credentialSearchTerm.toLowerCase()) ||
      credential.status.toLowerCase().includes(credentialSearchTerm.toLowerCase()) ||
      credential.holder.toLowerCase().includes(credentialSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filteredEvents = events.filter(event => {
    const matchesEventType = eventFilter.eventType === "" || event.event === eventFilter.eventType;
    const matchesContract = eventFilter.contractAddress === "" || 
      event.contract.toLowerCase().includes(eventFilter.contractAddress.toLowerCase());
    
    let matchesDate = true;
    if (eventFilter.dateFrom || eventFilter.dateTo) {
      const eventDate = new Date(event.timestamp);
      if (eventFilter.dateFrom) {
        matchesDate = matchesDate && eventDate >= new Date(eventFilter.dateFrom);
      }
      if (eventFilter.dateTo) {
        matchesDate = matchesDate && eventDate <= new Date(eventFilter.dateTo);
      }
    }
    
    return matchesEventType && matchesContract && matchesDate;
  });

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading blockchain data...</span>
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
              Blockchain Dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor blockchain status and manage smart contracts
            </p>
          </div>
          <Button onClick={fetchBlockchainData} variant="outline" size="sm">
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

      {/* Blockchain Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge
                variant={blockchainStatus?.status === "connected" ? "default" : "destructive"}
              >
                {blockchainStatus?.status || "Unknown"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Address</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono break-all">
              {blockchainStatus?.walletAddress || "Not connected"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blockchainStatus?.balance || "0"} ETH
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Block</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blockchainStatus?.currentBlock || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contracts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Smart Contracts</CardTitle>
                  <CardDescription>
                    Manage and deploy smart contracts on the blockchain
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Register Contract
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Register Existing Contract</DialogTitle>
                        <DialogDescription>
                          Register an existing smart contract to monitor its events
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="contract-name">Contract Name</Label>
                          <Input
                            id="contract-name"
                            value={registerForm.name}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, name: e.target.value })
                            }
                            placeholder="e.g., AgencyRegistry"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contract-address">Contract Address</Label>
                          <Input
                            id="contract-address"
                            value={registerForm.address}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, address: e.target.value })
                            }
                            placeholder="0x..."
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contract-abi">Contract ABI (JSON)</Label>
                          <Textarea
                            id="contract-abi"
                            value={registerForm.abi}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, abi: e.target.value })
                            }
                            placeholder="[...]"
                            rows={6}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleRegisterContract}
                          disabled={actionLoading === "register-contract"}
                        >
                          {actionLoading === "register-contract" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Register Contract
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Deploy Contract
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Deploy New Contract</DialogTitle>
                        <DialogDescription>
                          Deploy a new smart contract to the blockchain
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="deploy-name">Contract Name</Label>
                          <Input
                            id="deploy-name"
                            value={deployForm.name}
                            onChange={(e) =>
                              setDeployForm({ ...deployForm, name: e.target.value })
                            }
                            placeholder="e.g., MyContract"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="deploy-abi">Contract ABI (JSON)</Label>
                          <Textarea
                            id="deploy-abi"
                            value={deployForm.abi}
                            onChange={(e) =>
                              setDeployForm({ ...deployForm, abi: e.target.value })
                            }
                            placeholder="[...]"
                            rows={4}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="deploy-bytecode">Bytecode</Label>
                          <Textarea
                            id="deploy-bytecode"
                            value={deployForm.bytecode}
                            onChange={(e) =>
                              setDeployForm({ ...deployForm, bytecode: e.target.value })
                            }
                            placeholder="0x..."
                            rows={4}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="constructor-args">Constructor Arguments (JSON)</Label>
                          <Input
                            id="constructor-args"
                            value={deployForm.constructorArgs}
                            onChange={(e) =>
                              setDeployForm({ ...deployForm, constructorArgs: e.target.value })
                            }
                            placeholder="[]"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleDeployContract}
                          disabled={actionLoading === "deploy-contract"}
                        >
                          {actionLoading === "deploy-contract" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Deploy Contract
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blockchainStatus?.registeredContracts?.length ? (
                  blockchainStatus.registeredContracts.map((contract, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{contract}</div>
                        <div className="text-sm text-slate-600">Registered Contract</div>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-600">
                    No contracts registered yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blockchain Credentials</CardTitle>
                  <CardDescription>
                    Manage credentials stored on the blockchain
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={workerLookupDialogOpen} onOpenChange={setWorkerLookupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        Worker Lookup
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Worker Credential Lookup</DialogTitle>
                        <DialogDescription>
                          Search for a worker's blockchain credentials by address
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="worker-address">Worker Address/DID</Label>
                          <Input
                            id="worker-address"
                            value={workerSearchAddress}
                            onChange={(e) => setWorkerSearchAddress(e.target.value)}
                            placeholder="0x... or did:..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleWorkerLookup}
                          disabled={actionLoading === "worker-lookup" || !workerSearchAddress.trim()}
                        >
                          {actionLoading === "worker-lookup" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Search
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={handleIssueCredential}
                    disabled={actionLoading === "issue-credential"}
                    size="sm"
                  >
                    {actionLoading === "issue-credential" && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Issue Credential
                  </Button>

                  <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Credential Status</DialogTitle>
                        <DialogDescription>
                          Change the status of a blockchain credential
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="credential-id">Credential ID</Label>
                          <Input
                            id="credential-id"
                            value={selectedCredential}
                            onChange={(e) => setSelectedCredential(e.target.value)}
                            placeholder="Enter credential ID"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-status">New Status</Label>
                          <Select value={newCredentialStatus} onValueChange={setNewCredentialStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="revoked">Revoked</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleUpdateCredentialStatus}
                          disabled={actionLoading === "update-status"}
                        >
                          {actionLoading === "update-status" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Update Status
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search credentials by ID, type, or holder..."
                    value={credentialSearchTerm}
                    onChange={(e) => setCredentialSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </div>

              {/* Worker Lookup Results */}
              {workerLookupResults.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Recent Worker Lookups</h4>
                  <div className="space-y-4">
                    {workerLookupResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-mono text-sm">{result.address.slice(0, 20)}...</div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {result.totalCredentials} Total
                            </Badge>
                            <Badge variant="default">
                              {result.verifiedCredentials} Verified
                            </Badge>
                          </div>
                        </div>
                        {result.credentials.length > 0 && (
                          <div className="text-sm text-slate-600">
                            Latest: {result.credentials[0]?.status || 'N/A'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credentials List */}
              {filteredCredentials.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Credential ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Holder</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCredentials.map((credential) => (
                      <TableRow key={credential.credentialId}>
                        <TableCell className="font-mono text-xs">
                          {credential.credentialId.slice(0, 10)}...
                        </TableCell>
                        <TableCell>{credential.status}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {credential.holder.slice(0, 10)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant={credential.status === 'verified' ? 'default' : 'outline'}>
                            {credential.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(credential.issuanceDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
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
                  {credentials.length === 0 
                    ? "No blockchain credentials found. Issue a credential to get started."
                    : "No credentials match your search criteria."
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Events</CardTitle>
              <CardDescription>
                Recent events from registered smart contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Event Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label htmlFor="event-type">Event Type</Label>
                  <Select value={eventFilter.eventType} onValueChange={(value) => 
                    setEventFilter({ ...eventFilter, eventType: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Events</SelectItem>
                      <SelectItem value="AgencyRegistered">Agency Registered</SelectItem>
                      <SelectItem value="CredentialIssued">Credential Issued</SelectItem>
                      <SelectItem value="CredentialRevoked">Credential Revoked</SelectItem>
                      <SelectItem value="ContractDeployed">Contract Deployed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contract-filter">Contract Address</Label>
                  <Input
                    id="contract-filter"
                    placeholder="0x..."
                    value={eventFilter.contractAddress}
                    onChange={(e) => setEventFilter({ ...eventFilter, contractAddress: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date-from">From Date</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={eventFilter.dateFrom}
                    onChange={(e) => setEventFilter({ ...eventFilter, dateFrom: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date-to">To Date</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={eventFilter.dateTo}
                    onChange={(e) => setEventFilter({ ...eventFilter, dateTo: e.target.value })}
                  />
                </div>
              </div>

              {filteredEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{event.contract}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.event}</Badge>
                        </TableCell>
                        <TableCell>{event.blockNumber}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {event.transactionHash?.slice(0, 10)}...
                        </TableCell>
                        <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          {event.data && (
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  {events.length === 0 
                    ? "No contract events found"
                    : "No events match your filter criteria"
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(BlockchainDashboard, ["AgencyAdmin"]);
