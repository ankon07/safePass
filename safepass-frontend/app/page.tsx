import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center p-4 px-4 md:px-8 border-b">
        <Link href="/" className="text-2xl font-bold text-dark-jungle-green">
          SafePass
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button className="bg-viridian-green hover:bg-sage-green" asChild>
            <Link href="/register">Register Agency</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center text-center p-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-dark-jungle-green tracking-tight">
            Ethical Recruitment, Verified Talent.
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            SafePass is the blockchain-powered ecosystem connecting verified
            migrant workers with ethical recruitment agencies and global
            employers.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-viridian-green hover:bg-sage-green"
              asChild
            >
              <Link href="/register">
                Get Started <MoveRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center p-4 text-sm text-slate-500">
        © {new Date().getFullYear()} SafePass. All rights reserved.
      </footer>
    </main>
  );
}
