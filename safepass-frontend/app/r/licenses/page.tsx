"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Key,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  RefreshCw,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

function LicenseManagementPage() {
  const { user } = useAuth();
  const [validLicenses, setValidLicenses] = useState<string[]>([]);
  const [zkpSystemStatus, setZkpSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newLicense, setNewLicense] = useState("");
  const [bulkLicenses, setBulkLicenses] = useState("");

  useEffect(() => {
    fetchLicenseData();
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
          License Management
        </h1>
        <p className="text-slate-500">
          Manage valid licenses for Zero-Knowledge Proof verification system.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Now</div>
            <p className="text-xs text-muted-foreground">
              License database
            </p>
          </CardContent>
        </Card>
      </div>

      {/* License Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      {/* Help Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About License Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>Zero-Knowledge Proof (ZKP) License Verification:</strong> This system allows agencies to prove they have valid licenses without revealing the actual license numbers.
            </p>
            <p>
              <strong>How it works:</strong> Agencies can generate cryptographic proofs that their license numbers are in the valid set, and these proofs can be verified by anyone without exposing the license details.
            </p>
            <p>
              <strong>Managing Licenses:</strong> Add or remove valid license numbers from the system. Only licenses in this list can be used to generate valid ZKP proofs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Protect this page - only regulators should access it
export default withAuth(LicenseManagementPage, ['Regulator']);
