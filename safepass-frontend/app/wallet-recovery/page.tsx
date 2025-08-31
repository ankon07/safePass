"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import Link from "next/link";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Create a dynamic schema for 12 words
const formSchema = z.object(
  Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [
      `word${i + 1}`,
      z.string().min(2, { message: "Required" }),
    ])
  )
);

export default function WalletRecoveryPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const phrase = Object.values(values).join(" ");
    console.log("Attempting to recover wallet with phrase:", phrase);
    // TODO: Implement actual wallet recovery logic
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    // On success, you would log the user in and redirect to the dashboard
    // router.push('/dashboard');
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-dark-jungle-green">
            Recover Your Wallet
          </CardTitle>
          <CardDescription>
            Enter your 12-word recovery phrase in the correct order to restore
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={`word${i + 1}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-500">{`Word ${
                          i + 1
                        }`}</FormLabel>
                        <FormControl>
                          <Input
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button
                type="submit"
                className="w-full bg-viridian-green hover:bg-sage-green"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Restore Wallet"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <p className="text-sm text-slate-500">
            Remember your login details?{" "}
            <Link href="/welcome" className="underline text-viridian-green">
              Go back to Log In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
