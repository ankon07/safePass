"use client";

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { grievanceSchema } from "@/lib/validators";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileUp, X } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function GrievanceFilingFormPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof grievanceSchema>>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: {
      subject: "",
      description: "",
      isAnonymous: false,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles((prevFiles) => [
        ...prevFiles,
        ...Array.from(event.target.files!),
      ]);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  async function onSubmit(values: z.infer<typeof grievanceSchema>) {
    setIsLoading(true);
    // TODO: Implement API call to submit grievance and upload files
    console.log("Form Values:", values);
    console.log(
      "Attached Files:",
      files.map((f) => f.name)
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    // On success, redirect to the grievance tracking dashboard
    router.push("/w/grievances");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          File a Grievance Report
        </h1>
        <p className="text-slate-500">
          Your report is confidential and will be sent to an impartial case
          manager.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject of the Issue</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Unpaid Overtime for August"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please describe the issue in as much detail as possible. Include dates, names, and any relevant events."
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Label>Attach Evidence (Optional)</Label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Add Photos or Documents
            </Button>
            {files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {files.map((file) => (
                  <Badge key={file.name} variant="secondary">
                    {file.name}
                    <button
                      type="button"
                      onClick={() => removeFile(file.name)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Submit Anonymously</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    If you check this, your personal details will not be shared
                    with the recruitment agency.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-viridian-green hover:bg-sage-green"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
