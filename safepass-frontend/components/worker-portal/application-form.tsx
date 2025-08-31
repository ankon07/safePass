"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface ApplicationFormProps {
  agencyName: string;
  requiredCredentials: { id: string; name: string }[];
}

export function ApplicationForm({
  agencyName,
  requiredCredentials,
}: ApplicationFormProps) {
  const [selectedCredentials, setSelectedCredentials] = useState<
    Record<string, boolean>
  >({});
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCheckboxChange = (credentialId: string, checked: boolean) => {
    setSelectedCredentials((prev) => ({ ...prev, [credentialId]: checked }));
  };

  const allRequiredChecked = requiredCredentials.every(
    (cred) => selectedCredentials[cred.id]
  );
  const canSubmit = allRequiredChecked && hasConsented;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    // TODO: Implement API call to share VCs and submit application
    console.log(
      "Submitting application with credentials:",
      Object.keys(selectedCredentials).filter((k) => selectedCredentials[k])
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    // On success, redirect to the application tracking dashboard
    router.push("/w/applications");
  };

  return (
    <div className="space-y-6">
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
        disabled={!canSubmit || isLoading}
        className="w-full bg-viridian-green hover:bg-sage-green"
        size="lg"
      >
        {isLoading ? "Submitting..." : "Confirm and Submit Application"}
      </Button>
    </div>
  );
}
