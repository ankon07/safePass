import { Button } from "@/components/ui/button";
import { AnimatedHeroBackground } from "@/components/shared/animated-hero-background";
import { MoveRight, ShieldCheck, Users, FileText } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen text-dark-jungle-green">
      {/* Header (No change) */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center p-4 px-4 md:px-8 z-10 bg-white/80 backdrop-blur-sm">
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

      {/* Hero Section - UPDATED */}
      <section className="relative flex min-h-screen items-center py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          {/* Left Column: Text Content */}
          <div className="text-center md:text-left z-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Ethical Recruitment, Verified Talent.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-slate-700 max-w-2xl md:max-w-none mx-auto md:mx-0">
              SafePass is the blockchain-powered ecosystem connecting verified
              migrant workers with ethical recruitment agencies and global
              employers.
            </p>
            <div className="mt-8">
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

          {/* Right Column: 3D Animation */}
          <div className="relative h-96 md:h-[600px] w-full md:w-full z-0">
            <Suspense
              fallback={
                <div className="absolute top-0 left-0 w-full h-full bg-light-grayish-green" />
              }
            >
              <AnimatedHeroBackground />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Remaining sections (Features, How It Works, Footer) are unchanged */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Why Choose SafePass?</h2>
          <p className="mt-2 text-slate-600">
            A foundation of trust, transparency, and technology.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="p-6 border rounded-lg">
              <ShieldCheck className="w-10 h-10 text-viridian-green mb-4" />
              <h3 className="font-semibold text-lg">Immutable Contracts</h3>
              <p className="mt-2 text-slate-600">
                Smart contracts prevent fraud and substitution, ensuring the
                terms you agree to are the terms you get.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <Users className="w-10 h-10 text-viridian-green mb-4" />
              <h3 className="font-semibold text-lg">Verified Credentials</h3>
              <p className="mt-2 text-slate-600">
                Workers control their own verifiable digital identity,
                streamlining the hiring process for employers and agencies.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <FileText className="w-10 h-10 text-viridian-green mb-4" />
              <h3 className="font-semibold text-lg">Transparent Reputation</h3>
              <p className="mt-2 text-slate-600">
                Our on-chain Trust Score incentivizes ethical behavior, making
                it easy to identify trusted recruitment partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold">A Simple, Secure Process</h2>
          <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-8">
            <p className="p-6 border-2 border-dashed rounded-full h-40 w-40 flex items-center text-center">
              1. Workers create a secure digital wallet.
            </p>
            <p className="text-2xl text-sage-green">→</p>
            <p className="p-6 border-2 border-dashed rounded-full h-40 w-40 flex items-center text-center">
              2. Agencies & Workers connect and sign immutable smart contracts.
            </p>
            <p className="text-2xl text-sage-green">→</p>
            <p className="p-6 border-2 border-dashed rounded-full h-40 w-40 flex items-center text-center">
              3. Employers hire pre-verified talent with confidence.
            </p>
          </div>
        </div>
      </section>

      <footer className="text-center p-8 bg-dark-jungle-green text-light-grayish-green">
        <p>
          © {new Date().getFullYear()} SafePass. A new standard for ethical
          migration.
        </p>
      </footer>
    </main>
  );
}
