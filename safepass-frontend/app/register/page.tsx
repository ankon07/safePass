"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { agencyRegistrationSchema } from "@/lib/validators";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AgencyRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof agencyRegistrationSchema>>({
    resolver: zodResolver(agencyRegistrationSchema),
    defaultValues: {
      agencyName: "",
      email: "",
      address: "",
      licenseNumber: "",
    },
  });

  async function onSubmit(values: z.infer<typeof agencyRegistrationSchema>) {
    setIsLoading(true);
    // TODO: Implement API call for registration and verification
    console.log(values);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay
    setIsLoading(false);
    // On success, redirect to the agency dashboard
    router.push("/a/dashboard");
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="text-2xl text-dark-jungle-green">
            Register Your Agency
          </CardTitle>
          <CardDescription>
            Join the SafePass platform to connect with verified talent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="agencyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Agency Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Global Recruiters Ltd." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="contact@globalrecruiters.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Gulshan Ave, Dhaka" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BMET License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="RL-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-viridian-green hover:bg-sage-green"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
