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
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Wallet,
  Shield,
  Settings,
  Users,
  FileText,
  Search,
  Copy,
  Eye,
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

interface CredentialForm {
  credentialId: string;
  status: string;
}

interface WorkerLookupForm {
  workerDid: string;
}

function RegulatorBlockchainPage() {
  const { user } = useAuth();
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus | null>(null);
  const [credentials, setCredentials] = useState<BlockchainCredential[]>([]);
  const [workerCredentials, setWorkerCredentials] = useState<WorkerCredentials | null>(null);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [workerLookupDialogOpen, setWorkerLookupDialogOpen] = useState(false);

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
  const [credentialForm, setCredentialForm] = useState<CredentialForm>({
    credentialId: "",
    status: "",
  });
  const [workerLookupForm, setWorkerLookupForm] = useState<WorkerLookupForm>({
    workerDid: "",
  });

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
    if (!credentialForm.credentialId || !credentialForm.status) return;

    try {
      setActionLoading("update-status");
      await apiClient.updateCredentialStatus(credentialForm.credentialId, credentialForm.status);
      setCredentialDialogOpen(false);
      setCredentialForm({ credentialId: "", status: "" });
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
    if (!workerLookupForm.workerDid) return;

    try {
      setActionLoading("worker-lookup");
      const response = await apiClient.getWorkerCredentialsFromBlockchain(workerLookupForm.workerDid);
      setWorkerCredentials(response);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to lookup worker credentials");
      setWorkerCredentials(null);
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

  const convertBigIntToString = (obj: any): any => {
    if (typeof obj === 'bigint') {
      return obj.toString();
    } else if (Array.isArray(obj)) {
      return obj.map(convertBigIntToString);
    } else if (obj !== null && typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          converted[key] = convertBigIntToString(obj[key]);
        }
      }
      return converted;
    }
    return obj;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading blockchain management...</span>
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
              Blockchain Management
            </h1>
            <p className="text-slate-600 mt-2">
              Comprehensive blockchain system administration and monitoring
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
          <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="workers">Worker Lookup</TabsTrigger>
          <TabsTrigger value="events">System Events</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Smart Contract Management</CardTitle>
                  <CardDescription>
                    Deploy and manage smart contracts on the blockchain
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
                          Register an existing smart contract for monitoring
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
                  <CardTitle>Credential Management</CardTitle>
                  <CardDescription>
                    Issue and manage blockchain credentials
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleIssueCredential}
                    disabled={actionLoading === "issue-credential"}
                    size="sm"
                  >
                    {actionLoading === "issue-credential" && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <Shield className="h-4 w-4 mr-2" />
                    Issue Credential
                  </Button>

                  <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
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
                            value={credentialForm.credentialId}
                            onChange={(e) => setCredentialForm({ ...credentialForm, credentialId: e.target.value })}
                            placeholder="Enter credential ID"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-status">New Status</Label>
                          <Select value={credentialForm.status} onValueChange={(value) => setCredentialForm({ ...credentialForm, status: value })}>
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
              <div className="text-center py-8 text-slate-600">
                No blockchain credentials found. Issue a credential to get started.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Worker Credential Lookup</CardTitle>
              <CardDescription>
                Search and view worker credentials on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter worker DID..."
                    value={workerLookupForm.workerDid}
                    onChange={(e) => setWorkerLookupForm({ workerDid: e.target.value })}
                    disabled={actionLoading === "worker-lookup"}
                  />
                </div>
                <Button 
                  onClick={handleWorkerLookup}
                  disabled={actionLoading === "worker-lookup" || !workerLookupForm.workerDid.trim()}
                >
                  {actionLoading === "worker-lookup" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {workerCredentials && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="font-medium mb-4">Worker Credentials Found</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Worker DID</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                          {workerCredentials.workerDid}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(workerCredentials.workerDid, 'worker-did')}
                        >
                          {copySuccess === 'worker-did' ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Credentials ({workerCredentials.credentials.length})</Label>
                      {workerCredentials.credentials.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {workerCredentials.credentials.map((cred, index) => (
                            <div key={index} className="bg-muted p-3 rounded">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">ID:</span> {cred.id}
                                </div>
                                <div>
                                  <span className="font-medium">Type:</span> {cred.type}
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span> 
                                  <Badge variant="outline" className="ml-2">{cred.status}</Badge>
                                </div>
                                <div>
                                  <span className="font-medium">Issued:</span> {new Date(cred.issuanceDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">No credentials found for this worker.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Events</CardTitle>
              <CardDescription>
                Recent blockchain events and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{event.contract}</TableCell>
                        <TableCell>{event.event}</TableCell>
                        <TableCell>{event.blockNumber}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {event.transactionHash?.slice(0, 10)}...
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(event.transactionHash, `tx-${index}`)}
                          >
                            {copySuccess === `tx-${index}` ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  No system events found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>
                Monitor blockchain system health and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Network Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={blockchainStatus?.status === "connected" ? "default" : "destructive"}>
                        {blockchainStatus?.status || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Block:</span>
                      <span className="text-sm font-mono">{blockchainStatus?.currentBlock || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Balance:</span>
                      <span className="text-sm font-mono">{blockchainStatus?.balance || "0"} ETH</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Contract Registry</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Registered Contracts:</span>
                      <span className="text-sm font-semibold">{blockchainStatus?.registeredContracts?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">System Events:</span>
                      <span className="text-sm font-semibold">{events.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated:</span>
                      <span className="text-sm font-semibold">{new Date().toLocaleTimeString()}</span>
                    </div>
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

export default withAuth(RegulatorBlockchainPage, ["Regulator"]);
