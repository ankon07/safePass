"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AgencyProfileEditorPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    // TODO: Implement API call to update profile and upload logo
    console.log("Saving profile...", { logoFile });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSaving(false);
    // TODO: Show a success toast/notification
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Manage Public Profile
        </h1>
        <p className="text-slate-500">
          This information will be visible to workers and employers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agency Logo</CardTitle>
          <CardDescription>
            Upload a high-quality logo for your agency.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={logoPreview ?? undefined} />
            <AvatarFallback className="text-3xl bg-light-grayish-green">
              GR
            </AvatarFallback>
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Logo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agency Details</CardTitle>
          <CardDescription>
            Update your agency&apos;s public information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agencyName">Agency Name</Label>
            <Input
              id="agencyName"
              defaultValue="Global Recruiters Ltd."
              readOnly
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Public Description / Bio</Label>
            <Textarea
              id="description"
              placeholder="Tell us about your agency's mission and specialization..."
              defaultValue="Specializing in construction and hospitality placements in the GCC region."
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveChanges}
          className="bg-viridian-green hover:bg-sage-green"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
