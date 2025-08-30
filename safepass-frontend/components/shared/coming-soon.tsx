import { Hourglass } from "lucide-react";

export function ComingSoon() {
  return (
    <main className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center p-4">
      <Hourglass className="w-24 h-24 text-sage-green" />
      <h1 className="mt-8 text-4xl font-bold text-dark-jungle-green">
        Coming Soon
      </h1>
      <p className="mt-4 text-lg text-slate-600 max-w-md">
        We&apos;re working hard to bring you this feature. Please check back
        later for exciting updates!
      </p>
    </main>
  );
}
