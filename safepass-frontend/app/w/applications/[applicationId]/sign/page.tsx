"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Fingerprint, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DigitalSignaturePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSignContract = async () => {
    setIsLoading(true);
    // TODO: In a real app, this is where you would trigger the Web Authentication API (WebAuthn)
    // to prompt the user for their biometrics or passkey.
    console.log("Simulating blockchain signature process...");
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setIsLoading(false);
    setIsSuccess(true);
  };

  // Conditionally render the success screen
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full max-w-lg mx-auto">
        <CheckCircle2 className="h-24 w-24 text-viridian-green mb-6" />
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Contract Signed Successfully!
        </h1>
        <p className="mt-4 text-slate-600">
          Your employment contract has been securely signed and recorded. Your
          agency will be in touch with the next steps for your pre-departure
          checklist.
        </p>
        <Button asChild className="mt-8 bg-viridian-green hover:bg-sage-green">
          <Link href="/w/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Render the initial confirmation screen
  return (
    <div className="flex flex-col items-center justify-center text-center h-full max-w-lg mx-auto">
      <Fingerprint className="h-24 w-24 text-viridian-green mb-6" />
      <h1 className="text-3xl font-bold text-dark-jungle-green">
        Final Confirmation
      </h1>
      <p className="mt-4 text-slate-600">
        You are about to create a legally binding digital signature for your
        employment contract. This action will be recorded immutably on the
        blockchain and cannot be undone.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="lg"
            className="mt-8 bg-viridian-green hover:bg-sage-green"
          >
            Proceed to Sign
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Signature</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. By confirming, you agree to all terms
              and conditions outlined in the contract. Do you wish to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignContract}
              className="bg-viridian-green hover:bg-sage-green"
              disabled={isLoading}
            >
              {isLoading && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading ? "Signing..." : "Confirm & Sign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
