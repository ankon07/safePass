"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Key,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  RefreshCw,
  Building2,
  Share2,
  Users,
  FileCheck,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { User } from "@/lib/api-types";

function LicenseManagementPage() {
  const { user } = useAuth();
  const [validLicenses, setValidLicenses] = useState<string[]>([]);
  const [zkpSystemStatus, setZkpSystemStatus] = useState<any>(null);
  const [agencies, setAgencies] = useState<User[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [agencyLicenseNumber, setAgencyLicenseNumber] = useState("");
  const [generatedProofs, setGeneratedProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newLicense, setNewLicense] = useState("");
  const [bulkLicenses, setBulkLicenses] = useState("");

  useEffect(() => {
    fetchLicenseData();
    fetchAgencies();
    fetchGeneratedProofs();
  }, []);

  const fetchLicenseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch license data and ZKP system status in parallel
      const [licensesResponse, statusResponse] = await Promise.all([
        apiClient.getValidLicenses(),
        apiClient.checkZKPSystemStatus()
      ]);

      setValidLicenses(licensesResponse.valid_licenses);
      setZkpSystemStatus(statusResponse);
    } catch (err) {
      console.error('Error fetching license data:', err);
      setError('Failed to load license data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneratedProofs = async () => {
    try {
      const response = await apiClient.getGeneratedProofs();
      setGeneratedProofs(response.proofs);
    } catch (err) {
      console.error('Error fetching generated proofs:', err);
      // Don't set error state for this as it's not critical
    }
  };

  const fetchAgencies = async () => {
    try {
      setLoadingAgencies(true);
      const response = await apiClient.getAllUsers();
      const agencyUsers = response.users.filter(u => u.role === 'AgencyAdmin');
      setAgencies(agencyUsers);
    } catch (err) {
      console.error('Error fetching agencies:', err);
      setError('Failed to load agencies. Please try again.');
    } finally {
      setLoadingAgencies(false);
    }
  };

  const handleInitializeZKPSystem = async () => {
    try {
      setInitializing(true);
      setError(null);
      setSuccess(null);
      
      await apiClient.initializeZKPSystem();
      setSuccess('ZKP system initialized successfully.');
      
      // Refresh system status
      await fetchLicenseData();
    } catch (err) {
      console.error('Error initializing ZKP system:', err);
      setError('Failed to initialize ZKP system. Please try again.');
    } finally {
      setInitializing(false);
    }
  };

  const handleAddSingleLicense = async () => {
    if (!newLicense.trim()) {
      setError('Please enter a license number.');
      return;
    }

    const updatedLicenses = [...validLicenses, newLicense.trim()];
    await updateLicenses(updatedLicenses);
    setNewLicense("");
  };

  const handleRemoveLicense = async (licenseToRemove: string) => {
    const updatedLicenses = validLicenses.filter(license => license !== licenseToRemove);
    await updateLicenses(updatedLicenses);
  };

  const handleBulkUpdate = async () => {
    if (!bulkLicenses.trim()) {
      setError('Please enter license numbers.');
      return;
    }

    const licenseArray = bulkLicenses
      .split('\n')
      .map(license => license.trim())
      .filter(license => license.length > 0);

    if (licenseArray.length === 0) {
      setError('No valid license numbers found.');
      return;
    }

    await updateLicenses(licenseArray);
    setBulkLicenses("");
  };

  const updateLicenses = async (licenses: string[]) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);
      
      await apiClient.updateValidLicenses(licenses);
      setSuccess(`Successfully updated ${licenses.length} license(s).`);
      
      // Refresh license data
      await fetchLicenseData();
    } catch (err) {
      console.error('Error updating licenses:', err);
      setError('Failed to update licenses. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateAgencyProof = async () => {
    if (!selectedAgency || !agencyLicenseNumber.trim()) {
      setError('Please select an agency and enter a license number.');
      return;
    }

    try {
      setGeneratingProof(true);
      setError(null);
      setSuccess(null);

      // Generate proof for the selected agency
      const response = await apiClient.generateLicenseProofForAgency(selectedAgency, agencyLicenseNumber.trim());
      
      setSuccess(`Successfully generated ZKP proof for agency. Proof ID: ${response.proofId}`);
      
      // Refresh the generated proofs list to get the latest data from the database
      await fetchGeneratedProofs();
      
      // Clear form
      setSelectedAgency("");
      setAgencyLicenseNumber("");
      
    } catch (err) {
      console.error('Error generating agency proof:', err);
      setError('Failed to generate proof for agency. Please try again.');
    } finally {
      setGeneratingProof(false);
    }
  };

  const handleShareProofWithWorkers = async (proofId: string) => {
    try {
      setError(null);
      setSuccess(null);

      // This would typically send notifications to workers or create shareable links
      // For now, we'll just show a success message with the shareable URL
      const shareableUrl = `${window.location.origin}/verify-license?proofId=${proofId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareableUrl);
      
      setSuccess(`Proof sharing URL copied to clipboard! Workers can use this URL to verify the agency license.`);
      
    } catch (err) {
      console.error('Error sharing proof:', err);
      setError('Failed to share proof. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-viridian-green" />
          <p className="text-slate-500">Loading license management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          License Management & ZKP Control
        </h1>
        <p className="text-slate-500">
          Manage valid licenses and generate Zero-Knowledge Proof verifications for agencies.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* ZKP System Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ZKP System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                System Status: {' '}
                <Badge variant={zkpSystemStatus?.system_ready ? 'default' : 'destructive'}>
                  {zkpSystemStatus?.system_ready ? 'Ready' : 'Not Ready'}
                </Badge>
              </p>
              <p className="text-sm text-slate-500">
                {zkpSystemStatus?.message || 'Status unknown'}
              </p>
            </div>
            {!zkpSystemStatus?.system_ready && (
              <Button
                onClick={handleInitializeZKPSystem}
                disabled={initializing}
                variant="outline"
              >
                {initializing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Initialize System
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* License Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validLicenses.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Agencies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencies.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Proofs</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedProofs.length}</div>
            <p className="text-xs text-muted-foreground">
              Today's proofs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zkpSystemStatus?.system_ready ? 'Ready' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              ZKP verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="licenses" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="licenses">License Registry</TabsTrigger>
          <TabsTrigger value="agency-proofs">Agency ZKP Proofs</TabsTrigger>
          <TabsTrigger value="generated-proofs">Generated Proofs</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="space-y-6">
          {/* License Management Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Single License</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter license number (e.g., LIC123456)"
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSingleLicense()}
                  />
                  <Button
                    onClick={handleAddSingleLicense}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk License Update</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter license numbers, one per line:&#10;LIC123456&#10;LIC789012&#10;LIC345678"
                  value={bulkLicenses}
                  onChange={(e) => setBulkLicenses(e.target.value)}
                  rows={4}
                  className="mb-2"
                />
                <Button
                  onClick={handleBulkUpdate}
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Update All Licenses
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Valid Licenses */}
          <Card>
            <CardHeader>
              <CardTitle>Current Valid Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              {validLicenses.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No valid licenses configured. Add licenses to enable ZKP verification.
                </p>
              ) : (
                <div className="space-y-2">
                  {validLicenses.map((license, index) => (
                    <div
                      key={license}
                      className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-mono text-sm">{license}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveLicense(license)}
                        disabled={updating}
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agency-proofs" className="space-y-6">
          {/* Generate ZKP Proof for Agency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Generate ZKP Proof for Agency
              </CardTitle>
              <p className="text-sm text-slate-600">
                As a regulator, generate secure ZKP proofs for agencies to verify their licenses without revealing sensitive information.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Agency</label>
                  <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an agency..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingAgencies ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading agencies...
                          </div>
                        </SelectItem>
                      ) : agencies.length === 0 ? (
                        <SelectItem value="no-agencies" disabled>
                          No agencies found
                        </SelectItem>
                      ) : (
                        agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{agency.name}</span>
                              <span className="text-xs text-slate-500">{agency.email}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Agency License Number</label>
                  <Input
                    placeholder="Enter agency's license number"
                    value={agencyLicenseNumber}
                    onChange={(e) => setAgencyLicenseNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateAgencyProof()}
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerateAgencyProof}
                disabled={generatingProof || !selectedAgency || !agencyLicenseNumber.trim()}
                className="w-full"
              >
                {generatingProof ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating ZKP Proof...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Generate ZKP Proof for Agency
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Agency List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registered Agencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAgencies ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading agencies...
                </div>
              ) : agencies.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No agencies registered in the system.
                </p>
              ) : (
                <div className="space-y-3">
                  {agencies.map((agency) => (
                    <div
                      key={agency.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium">{agency.name}</p>
                          <p className="text-sm text-slate-500">{agency.email}</p>
                          {agency.agency_address && (
                            <p className="text-xs text-slate-400 font-mono">
                              {agency.agency_address}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {agency.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generated-proofs" className="space-y-6">
          {/* Generated Proofs List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Generated ZKP Proofs
              </CardTitle>
              <p className="text-sm text-slate-600">
                ZKP proofs generated by you for agencies. These can be shared with workers for verification.
              </p>
            </CardHeader>
            <CardContent>
              {generatedProofs.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No proofs generated yet. Generate proofs for agencies in the "Agency ZKP Proofs" tab.
                </p>
              ) : (
                <div className="space-y-4">
                  {generatedProofs.map((proof, index) => (
                    <div
                      key={proof.proofId || proof.id}
                      className="border rounded-lg p-4 bg-slate-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{proof.agency_name}</h4>
                            <Badge variant={proof.status === 'Valid' ? 'default' : 'destructive'}>
                              {proof.status || 'Valid'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">{proof.agency_email}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-slate-400 font-mono">
                              Proof ID: {proof.proofId || proof.id}
                            </p>
                            <p className="text-xs text-slate-400">
                              License: {proof.license_number ? `***${proof.license_number.slice(-4)}` : 'Hidden'}
                            </p>
                            <p className="text-xs text-slate-400">
                              Circuit: {proof.circuit_type || 'regulator_generated'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareProofWithWorkers(proof.proofId || proof.id)}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share with Workers
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(proof.proofId || proof.id)}
                          >
                            Copy Proof ID
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Generated: {new Date(proof.created_at || proof.generated_at).toLocaleString()}</span>
                          {proof.expires_at && (
                            <span>Expires: {new Date(proof.expires_at).toLocaleDateString()}</span>
                          )}
                          {proof.regulator_name && (
                            <span>By: {proof.regulator_name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {proof.agency_address && (
                            <span className="text-xs text-slate-400 font-mono">
                              {proof.agency_address.slice(0, 6)}...{proof.agency_address.slice(-4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Regulator-Controlled ZKP System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 space-y-3">
            <div>
              <strong>Enhanced Security Model:</strong> As a regulator, you now control the generation of ZKP proofs for agencies. This prevents agencies from generating false proofs and ensures only legitimate, regulator-verified licenses can be proven.
            </div>
            <div>
              <strong>How it works:</strong>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>You maintain the registry of valid license numbers</li>
                <li>You generate ZKP proofs for specific agencies using their actual license numbers</li>
                <li>Agencies receive regulator-generated proofs they can share with workers</li>
                <li>Workers can verify these proofs knowing they come from a trusted regulator</li>
              </ol>
            </div>
            <div>
              <strong>Benefits:</strong> This system ensures that only agencies with legitimate licenses verified by regulators can generate valid proofs, providing enhanced security and trust for workers.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Protect this page - only regulators should access it
export default withAuth(LicenseManagementPage, ['Regulator']);
