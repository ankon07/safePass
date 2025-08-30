import { Button } from "@/components/ui/button";
import { Frown } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <Frown className="w-24 h-24 text-sage-green" />
      <h1 className="mt-8 text-4xl font-bold text-dark-jungle-green">
        404 - Page Not Found
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Sorry, the page you are looking for does not exist.
      </p>
      <div className="mt-8">
        <Button className="bg-viridian-green hover:bg-sage-green" asChild>
          <Link href="/">Return to Homepage</Link>
        </Button>
      </div>
    </main>
  );
}
