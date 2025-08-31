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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  TrendingUp, 
  Award, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Star
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { 
  TrustScore, 
  TrustScoreStatistics, 
  TopAgenciesResponse,
  GenerateLicenseProofRequest,
  AgencyZKPProofsResponse,
  ApiError 
} from "@/lib/api-types";

interface TrustScorePageState {
  trustScore: TrustScore | null;
  statistics: TrustScoreStatistics | null;
  topAgencies: TopAgenciesResponse | null;
  zkpProofs: AgencyZKPProofsResponse | null;
  loading: boolean;
  error: string | null;
  licenseNumber: string;
  generatingProof: boolean;
}

function TrustScorePage() {
  const { user } = useAuth();
  const [state, setState] = useState<TrustScorePageState>({
    trustScore: null,
    statistics: null,
    topAgencies: null,
    zkpProofs: null,
    loading: true,
    error: null,
    licenseNumber: "",
    generatingProof: false,
  });

  useEffect(() => {
    const fetchTrustScoreData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Fetch all trust score related data
        const trustScorePromise = user?.agency_address 
          ? apiClient.getAgencyTrustScore(user.agency_address)
          : Promise.resolve(null);

        const [trustScore, statistics, topAgencies, zkpProofs] = await Promise.allSettled([
          trustScorePromise,
          apiClient.getTrustScoreStatistics(),
          apiClient.getTopAgencies(10),
          apiClient.getAgencyZKPProofs(),
        ]);

        setState(prev => ({
          ...prev,
          trustScore: trustScore.status === 'fulfilled' ? trustScore.value : null,
          statistics: statistics.status === 'fulfilled' ? statistics.value : null,
          topAgencies: topAgencies.status === 'fulfilled' ? topAgencies.value : null,
          zkpProofs: zkpProofs.status === 'fulfilled' ? zkpProofs.value : null,
          loading: false,
        }));
      } catch (error) {
        const apiError = error as ApiError;
        setState(prev => ({
          ...prev,
          loading: false,
          error: apiError.error || "Failed to load trust score data",
        }));
      }
    };

    fetchTrustScoreData();
  }, []);

  const handleGenerateProof = async () => {
    if (!state.licenseNumber.trim()) {
      setState(prev => ({ ...prev, error: "Please enter a license number" }));
      return;
    }

    try {
      setState(prev => ({ ...prev, generatingProof: true, error: null }));

      const request: GenerateLicenseProofRequest = {
        license_number: state.licenseNumber.trim(),
      };

      await apiClient.generateLicenseProof(request);
      
      // Refresh ZKP proofs after generating new one
      const zkpProofs = await apiClient.getAgencyZKPProofs();
      
      setState(prev => ({
        ...prev,
        zkpProofs,
        generatingProof: false,
        licenseNumber: "",
      }));
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        generatingProof: false,
        error: apiError.error || "Failed to generate license proof",
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading trust score data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Trust Score & Verification
        </h1>
        <p className="text-slate-600 mt-2">
          Manage your agency's reputation and license verification
        </p>
      </div>

      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {!user?.agency_address && (
        <Alert className="mb-6">
          <AlertDescription>
            Your agency address is not configured. Trust score and ZKP features require a valid agency address. Please complete your agency registration.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Trust Score */}
        <Card className="bg-gradient-to-br from-viridian-green/5 to-sage-green/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-viridian-green" />
              Your Trust Score
            </CardTitle>
            <CardDescription>
              Blockchain-verified reputation score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.trustScore ? (
              <div>
                <div className="text-6xl font-bold text-viridian-green mb-2">
                  {state.trustScore.trust_score_display}
                </div>
                <div className="text-sm text-slate-600 mb-4">
                  Raw Score: {state.trustScore.trust_score}/100
                </div>
                <div className="text-sm text-slate-600">
                  Last Updated: {new Date(state.trustScore.timestamp).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Address: {state.trustScore.agency_address}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No trust score available</p>
                <p className="text-sm text-slate-500">Complete your verification to get scored</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-viridian-green" />
              Platform Statistics
            </CardTitle>
            <CardDescription>
              How you compare to other agencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.statistics ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Agencies:</span>
                  <span className="font-semibold">{state.statistics.total_agencies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Average Score:</span>
                  <span className="font-semibold">{state.statistics.average_score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Highest Score:</span>
                  <span className="font-semibold text-green-600">{state.statistics.max_score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Median Score:</span>
                  <span className="font-semibold">{state.statistics.median_score}</span>
                </div>
                {state.trustScore && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Your Ranking:</span>
                      <Badge variant="secondary" className="bg-viridian-green/10 text-viridian-green">
                        {state.trustScore.trust_score >= parseFloat(state.statistics.average_score) 
                          ? "Above Average" 
                          : "Below Average"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-600">Statistics not available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ZKP License Verification */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-viridian-green" />
            License Verification (ZKP)
          </CardTitle>
          <CardDescription>
            Generate zero-knowledge proofs for your agency licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generate New Proof */}
            <div>
              <h4 className="font-medium mb-3">Generate License Proof</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Enter your license number (e.g., LIC123456)"
                  value={state.licenseNumber}
                  onChange={(e) => setState(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  disabled={state.generatingProof}
                />
                <Button 
                  onClick={handleGenerateProof}
                  disabled={state.generatingProof || !state.licenseNumber.trim()}
                  className="w-full bg-viridian-green hover:bg-sage-green"
                >
                  {state.generatingProof ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Proof...
                    </>
                  ) : (
                    "Generate ZKP Proof"
                  )}
                </Button>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Zero-Knowledge Proof</p>
                    <p>Proves you have a valid license without revealing the license number itself.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Proofs */}
            <div>
              <h4 className="font-medium mb-3">Your Proofs</h4>
              {state.zkpProofs && state.zkpProofs.proofs.length > 0 ? (
                <div className="space-y-2">
                  {state.zkpProofs.proofs.map((proof) => (
                    <div key={proof.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={proof.is_valid ? "default" : "destructive"}>
                          {proof.is_valid ? "Valid" : "Invalid"}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {proof.circuit_type}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>Created: {new Date(proof.created_at).toLocaleDateString()}</p>
                        <p>Expires: {new Date(proof.expires_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                  <Award className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">No proofs generated yet</p>
                  <p className="text-sm text-slate-500">Generate your first license proof</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Agencies Leaderboard */}
      {state.topAgencies && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-6 w-6 text-viridian-green" />
              Top Agencies Leaderboard
            </CardTitle>
            <CardDescription>
              Highest rated agencies on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.topAgencies.agencies.map((agency, index) => (
                <div key={agency.agency_address} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {agency.agency_name || `Agency ${agency.agency_address.slice(0, 8)}...`}
                      </div>
                      <div className="text-sm text-slate-600">
                        {agency.agency_address.slice(0, 20)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-viridian-green">
                      {agency.trust_score_display}
                    </div>
                    <div className="text-sm text-slate-600">
                      {agency.trust_score}/100
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Protect this page - only agency admins should access it
export default withAuth(TrustScorePage, ['AgencyAdmin']);
