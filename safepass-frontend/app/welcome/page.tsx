"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import Link from "next/link";
import { Globe, ShieldCheck } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

// Validation Schema for the Sign Up form remains the same
const signUpSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSignUp(values: z.infer<typeof signUpSchema>) {
    setIsLoading(true);
    // TODO: Handle sign-up logic
    console.log("Signing up with:", values);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    // On success, redirect to the wallet creation screen
    // router.push('/wallet-creation');
  }

  const handleLogin = async () => {
    setIsLoading(true);
    // TODO: Handle login logic
    console.log("Logging in...");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    // On success, redirect to the worker dashboard
    // router.push('/dashboard');
  };

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* Left Pane: Branding */}
      <div className="hidden md:flex flex-col items-center justify-center bg-light-grayish-green p-12 text-center">
        <ShieldCheck className="w-24 h-24 text-viridian-green" />
        <h1 className="mt-6 text-4xl font-bold text-dark-jungle-green">
          Your Secure Path to Global Opportunities
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Join a trusted ecosystem for ethical labor migration, powered by
          verifiable credentials and blockchain technology.
        </p>
      </div>

      {/* Right Pane: Authentication Form */}
      <div className="flex items-center justify-center bg-slate-50 p-8">
        <Tabs defaultValue="signup" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Log In</TabsTrigger>
          </TabsList>

          {/* Sign Up Tab */}
          <TabsContent value="signup">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-dark-jungle-green">
                Create your Account
              </h2>
              <p className="text-slate-500">Begin your SafePass journey.</p>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSignUp)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-viridian-green hover:bg-sage-green mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          {/* Login Tab */}
          <TabsContent value="login">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-dark-jungle-green">
                Welcome Back
              </h2>
              <p className="text-slate-500">
                Access your digital wallet and job feed.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email or Phone</Label>
                <Input id="email-login" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Password</Label>
                <Input
                  id="password-login"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <Button
                onClick={handleLogin}
                className="w-full bg-viridian-green hover:bg-sage-green mt-6"
                disabled={isLoading}
              >
                {isLoading ? "Logging In..." : "Log In"}
              </Button>
              <div className="text-center text-sm pt-4">
                <Link
                  href="/wallet-recovery"
                  className="underline text-slate-600 hover:text-viridian-green"
                >
                  Forgot Password / Recover Wallet?
                </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
