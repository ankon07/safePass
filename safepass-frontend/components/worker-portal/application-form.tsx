"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface ApplicationFormProps {
  jobId: string;
  agencyName: string;
  requiredCredentials: { id: string; name: string }[];
}

export function ApplicationForm({
  jobId,
  agencyName,
  requiredCredentials,
}: ApplicationFormProps) {
  const [selectedCredentials, setSelectedCredentials] = useState<
    Record<string, boolean>
  >({});
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCheckboxChange = (credentialId: string, checked: boolean) => {
    setSelectedCredentials((prev) => ({ ...prev, [credentialId]: checked }));
  };

  const allRequiredChecked = requiredCredentials.every(
    (cred) => selectedCredentials[cred.id]
  );
  const canSubmit = allRequiredChecked && hasConsented && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const selectedCredentialIds = Object.keys(selectedCredentials).filter(
        (k) => selectedCredentials[k]
      );
      
      // Prepare application data
      const applicationData = {
        jobId,
        coverLetter: `I am interested in applying for this position. I have provided the following credentials: ${selectedCredentialIds.join(', ')}.`,
        credentialIds: selectedCredentialIds,
      };

      console.log('Submitting application:', applicationData);
      
      // Submit the application
      const response = await apiClient.applyForJob(applicationData);
      
      console.log('Application submitted successfully:', response);
      setSuccess(true);
      
      // Redirect to applications page after a short delay
      setTimeout(() => {
        router.push("/w/applications");
      }, 2000);
      
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(
        err.message || 
        err.error || 
        'Failed to submit application. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-600 mb-2">
          Application Submitted Successfully!
        </h3>
        <p className="text-slate-600 mb-4">
          Your application has been sent to {agencyName}. You can track its status in your applications dashboard.
        </p>
        <p className="text-sm text-slate-500">
          Redirecting to your applications...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h3 className="font-semibold text-lg">Required Credentials</h3>
        <p className="text-sm text-slate-500">
          Select the credentials to share for this application.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        {requiredCredentials.map((cred) => (
          <div key={cred.id} className="flex items-center space-x-3">
            <Checkbox
              id={cred.id}
              onCheckedChange={(checked) =>
                handleCheckboxChange(cred.id, checked as boolean)
              }
              disabled={isLoading}
            />
            <Label htmlFor={cred.id} className="flex-1 text-base font-normal">
              {cred.name}
            </Label>
          </div>
        ))}
      </div>

      <div className="flex items-start space-x-3 rounded-lg border p-4 bg-slate-50">
        <Checkbox
          id="consent"
          checked={hasConsented}
          onCheckedChange={(checked) => setHasConsented(checked as boolean)}
          disabled={isLoading}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="consent">Consent to Share</Label>
          <p className="text-sm text-muted-foreground">
            I consent to securely share the selected credentials with{" "}
            <span className="font-semibold">{agencyName}</span> for the purpose
            of this job application.
          </p>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full bg-viridian-green hover:bg-sage-green"
        size="lg"
      >
        {isLoading ? "Submitting..." : "Confirm and Submit Application"}
      </Button>
    </div>
  );
}
