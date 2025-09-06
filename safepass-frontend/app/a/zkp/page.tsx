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
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  GenerateLicenseProofRequest,
  GenerateLicenseProofResponse,
  VerifyLicenseProofRequest,
  VerifyLicenseProofResponse,
  AgencyZKPProofsResponse,
  AgencyZKPProof,
  ApiError,
} from "@/lib/api-types";

interface ZKPSystemStatus {
  initialized: boolean;
  circuitReady: boolean;
  validLicensesCount: number;
  lastUpdate: string;
}

interface ValidLicense {
  license_number: string;
  added_at: string;
}

function ZKPManagement() {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState<ZKPSystemStatus | null>(null);
  const [agencyProofs, setAgencyProofs] = useState<AgencyZKPProof[]>([]);
  const [validLicenses, setValidLicenses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [licenseNumber, setLicenseNumber] = useState("");
  const [newLicenses, setNewLicenses] = useState("");
  const [verifyProofData, setVerifyProofData] = useState("");
  const [proofResult, setProofResult] = useState<GenerateLicenseProofResponse | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerifyLicenseProofResponse | null>(null);

  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [licensesDialogOpen, setLicensesDialogOpen] = useState(false);
  const [proofDetailsDialogOpen, setProofDetailsDialogOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<GenerateLicenseProofResponse | null>(null);

  useEffect(() => {
    fetchZKPData();
  }, []);

  const fetchZKPData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusResponse, proofsResponse, licensesResponse] = await Promise.all([
        apiClient.checkZKPSystemStatus().catch(() => ({ initialized: false, circuitReady: false })),
        apiClient.getAgencyZKPProofs().catch(() => ({ proofs: [], count: 0 })),
        apiClient.getValidLicenses().catch(() => ({ valid_licenses: [], count: 0 })),
      ]);

      setSystemStatus({
        initialized: statusResponse.initialized || false,
        circuitReady: statusResponse.circuitReady || false,
        validLicensesCount: licensesResponse.count || 0,
        lastUpdate: (licensesResponse as any).timestamp || new Date().toISOString(),
      });

      setAgencyProofs(proofsResponse.proofs || []);
      setValidLicenses(licensesResponse.valid_licenses || []);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to load ZKP data");
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSystem = async () => {
    try {
      setActionLoading("initialize");
      await apiClient.initializeZKPSystem();
      await fetchZKPData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to initialize ZKP system");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateProof = async () => {
    if (!licenseNumber.trim()) return;

    try {
      setActionLoading("generate-proof");
      const response = await apiClient.generateLicenseProof({ license_number: licenseNumber });
      setProofResult(response);
      setLicenseNumber("");
      setGenerateDialogOpen(false);
      await fetchZKPData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to generate proof");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyProof = async () => {
    if (!verifyProofData.trim()) return;

    try {
      setActionLoading("verify-proof");
      const proofData = JSON.parse(verifyProofData);
      const response = await apiClient.verifyLicenseProof(proofData);
      setVerificationResult(response);
      setVerifyProofData("");
      setVerifyDialogOpen(false);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to verify proof");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateValidLicenses = async () => {
    if (!newLicenses.trim()) return;

    try {
      setActionLoading("update-licenses");
      const licenseNumbers = newLicenses
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      await apiClient.updateValidLicenses(licenseNumbers);
      setNewLicenses("");
      setLicensesDialogOpen(false);
      await fetchZKPData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to update valid licenses");
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidateProof = async (proofId: string) => {
    try {
      setActionLoading(`validate-${proofId}`);
      const response = await apiClient.validateProofExists(proofId);
      // Handle validation result
      console.log("Proof validation result:", response);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to validate proof");
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading ZKP system...</span>
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
              Zero-Knowledge Proof Management
            </h1>
            <p className="text-slate-600 mt-2">
              Generate and verify privacy-preserving license proofs
            </p>
          </div>
          <Button onClick={fetchZKPData} variant="outline" size="sm">
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

      {proofResult && (
        <Alert className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Proof generated successfully! Proof ID: {proofResult.proofId}
            <Button
              variant="link"
              size="sm"
              className="ml-2 p-0 h-auto"
              onClick={() => {
                setSelectedProof(proofResult);
                setProofDetailsDialogOpen(true);
              }}
            >
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {verificationResult && (
        <Alert variant={verificationResult.isValid ? "default" : "destructive"} className="mb-6">
          {verificationResult.isValid ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            Proof verification: {verificationResult.isValid ? "Valid" : "Invalid"} - {verificationResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={systemStatus?.initialized ? "default" : "destructive"}>
                {systemStatus?.initialized ? "Initialized" : "Not Initialized"}
              </Badge>
              {!systemStatus?.initialized && (
                <Button
                  size="sm"
                  onClick={handleInitializeSystem}
                  disabled={actionLoading === "initialize"}
                >
                  {actionLoading === "initialize" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Initialize
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Circuit Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={systemStatus?.circuitReady ? "default" : "secondary"}>
              {systemStatus?.circuitReady ? "Ready" : "Not Ready"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.validLicensesCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Proofs</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencyProofs.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Proof</TabsTrigger>
          <TabsTrigger value="verify">Verify Proof</TabsTrigger>
          <TabsTrigger value="proofs">My Proofs</TabsTrigger>
          <TabsTrigger value="licenses">Valid Licenses</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generate License Proof</CardTitle>
                  <CardDescription>
                    Create a zero-knowledge proof for your license without revealing the license number
                  </CardDescription>
                </div>
                <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!systemStatus?.initialized}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate License Proof</DialogTitle>
                      <DialogDescription>
                        Enter your license number to generate a zero-knowledge proof
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="license-number">License Number</Label>
                        <Input
                          id="license-number"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="Enter your license number"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleGenerateProof}
                        disabled={actionLoading === "generate-proof" || !licenseNumber.trim()}
                      >
                        {actionLoading === "generate-proof" && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Generate Proof
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!systemStatus?.initialized ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    ZKP system needs to be initialized before generating proofs
                  </p>
                  <Button onClick={handleInitializeSystem} disabled={actionLoading === "initialize"}>
                    {actionLoading === "initialize" && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Initialize System
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShieldCheck className="h-12 w-12 text-viridian-green mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    System is ready to generate zero-knowledge proofs for your licenses
                  </p>
                  <p className="text-sm text-slate-500">
                    Click "Generate Proof" to create a privacy-preserving proof of license ownership
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Verify License Proof</CardTitle>
                  <CardDescription>
                    Verify a zero-knowledge proof without learning the license number
                  </CardDescription>
                </div>
                <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Verify Proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Verify License Proof</DialogTitle>
                      <DialogDescription>
                        Paste the proof data to verify its validity
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="proof-data">Proof Data (JSON)</Label>
                        <Textarea
                          id="proof-data"
                          value={verifyProofData}
                          onChange={(e) => setVerifyProofData(e.target.value)}
                          placeholder="Paste the complete proof JSON here..."
                          rows={8}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleVerifyProof}
                        disabled={actionLoading === "verify-proof" || !verifyProofData.trim()}
                      >
                        {actionLoading === "verify-proof" && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Verify Proof
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  Verify zero-knowledge proofs from other agencies or workers
                </p>
                <p className="text-sm text-slate-500">
                  The verification process confirms proof validity without revealing sensitive information
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proofs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Generated Proofs</CardTitle>
              <CardDescription>
                Zero-knowledge proofs generated by your agency - Share proof IDs with workers for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agencyProofs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proof ID</TableHead>
                      <TableHead>Circuit Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agencyProofs.map((proof) => (
                      <TableRow key={proof.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs">
                              {proof.id.slice(0, 8)}...
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(proof.id)}
                              title="Copy full Proof ID"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{proof.circuit_type}</TableCell>
                        <TableCell>
                          <Badge variant={proof.is_valid ? "default" : "destructive"}>
                            {proof.is_valid ? "Valid" : "Invalid"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(proof.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(proof.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidateProof(proof.id)}
                              disabled={actionLoading === `validate-${proof.id}`}
                            >
                              {actionLoading === `validate-${proof.id}` && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              )}
                              Validate
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="default">
                                  Share
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Share Proof with Workers</DialogTitle>
                                  <DialogDescription>
                                    Workers can use this Proof ID to verify your agency's license
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Proof ID for Sharing</Label>
                                    <div className="flex items-center space-x-2">
                                      <Input 
                                        value={proof.id} 
                                        readOnly 
                                        className="font-mono text-sm"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => copyToClipboard(proof.id)}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                    <h4 className="font-medium text-sm">How to Share:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      <li>• Copy the Proof ID above</li>
                                      <li>• Share it with workers who want to verify your license</li>
                                      <li>• Workers can use it in their "Verify License" page</li>
                                      <li>• Your license number remains private</li>
                                    </ul>
                                  </div>

                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                                      <div>
                                        <h4 className="font-medium text-blue-900 text-sm">Privacy Protected</h4>
                                        <p className="text-blue-700 text-sm">
                                          This proof verifies your license validity without revealing the actual license number.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm">Proof Details</Label>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant={proof.is_valid ? "default" : "destructive"} className="ml-2">
                                          {proof.is_valid ? "Valid" : "Invalid"}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Expires:</span>
                                        <span className="ml-2">{new Date(proof.expires_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  No proofs generated yet. Create your first proof to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Share Section */}
          {agencyProofs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Quick Share Latest Proof
                </CardTitle>
                <CardDescription>
                  Share your most recent valid proof with workers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const latestValidProof = agencyProofs
                    .filter(proof => proof.is_valid)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  
                  if (!latestValidProof) {
                    return (
                      <div className="text-center py-4 text-muted-foreground">
                        No valid proofs available to share
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">Latest Valid Proof</div>
                          <div className="text-sm text-muted-foreground">
                            Created: {new Date(latestValidProof.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">Valid</Badge>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(latestValidProof.id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Proof ID
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-900 text-sm">Ready to Share</h4>
                            <p className="text-green-700 text-sm">
                              Workers can verify your agency license using this Proof ID at: 
                              <span className="font-mono ml-1">/w/verify-license</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="licenses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Valid Licenses</CardTitle>
                  <CardDescription>
                    Manage the list of valid license numbers for proof generation
                  </CardDescription>
                </div>
                <Dialog open={licensesDialogOpen} onOpenChange={setLicensesDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Update Licenses
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Update Valid Licenses</DialogTitle>
                      <DialogDescription>
                        Add or update the list of valid license numbers (one per line)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="new-licenses">License Numbers</Label>
                        <Textarea
                          id="new-licenses"
                          value={newLicenses}
                          onChange={(e) => setNewLicenses(e.target.value)}
                          placeholder="LIC001&#10;LIC002&#10;LIC003"
                          rows={8}
                        />
                        <p className="text-sm text-slate-500">
                          Enter one license number per line
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleUpdateValidLicenses}
                        disabled={actionLoading === "update-licenses" || !newLicenses.trim()}
                      >
                        {actionLoading === "update-licenses" && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Update Licenses
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {validLicenses.length > 0 ? (
                <div className="space-y-2">
                  {validLicenses.map((license, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="font-mono text-sm">{license}</div>
                      <Badge variant="outline">Valid</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  No valid licenses configured. Add licenses to enable proof generation.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Proof Details Dialog */}
      <Dialog open={proofDetailsDialogOpen} onOpenChange={setProofDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Proof Details</DialogTitle>
            <DialogDescription>
              Generated zero-knowledge proof information
            </DialogDescription>
          </DialogHeader>
          {selectedProof && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Proof ID</Label>
                <div className="flex items-center space-x-2">
                  <Input value={selectedProof.proofId} readOnly />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedProof.proofId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Public Signals</Label>
                <Textarea
                  value={JSON.stringify(selectedProof.publicSignals, null, 2)}
                  readOnly
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>Proof Data</Label>
                <Textarea
                  value={JSON.stringify(selectedProof.proof, null, 2)}
                  readOnly
                  rows={6}
                />
              </div>
              <div className="text-sm text-slate-500">
                Generated at: {new Date(selectedProof.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(ZKPManagement, ["AgencyAdmin"]);
