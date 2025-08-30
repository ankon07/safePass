"use client"; // This layout uses client-side hooks for state (e.g., mobile menu)

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Briefcase,
  FileText,
  Flag,
  LifeBuoy,
  Menu,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Navigation items for the sidebar
const navItems = [
  { href: "/w/dashboard", label: "Dashboard", icon: Home },
  { href: "/w/jobs", label: "Find Jobs", icon: Briefcase },
  { href: "/w/applications", label: "My Applications", icon: FileText },
  { href: "/w/grievances", label: "My Grievances", icon: Flag },
  { href: "/w/support", label: "Help & Support", icon: LifeBuoy },
];

export default function WorkerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const NavLink = ({ href, label, icon: Icon }: (typeof navItems)[0]) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-all hover:bg-light-grayish-green hover:text-dark-jungle-green",
        pathname === href &&
          "bg-viridian-green text-white hover:bg-viridian-green hover:text-white"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );

  const sidebarContent = (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link
          href="/w/dashboard"
          className="flex items-center gap-2 font-bold text-xl text-dark-jungle-green"
        >
          <ShieldCheck className="h-8 w-8 text-viridian-green" />
          <span>SafePass</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-slate-50 md:block">
        {sidebarContent}
      </div>
      {/* Mobile Header & Main Content */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-slate-50 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" /> {/* Spacer */}
          <Avatar>
            <AvatarImage src="https://i.pravatar.cc/150?u=worker" />
            <AvatarFallback>WK</AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 p-4 lg:p-6 bg-white">{children}</main>
      </div>
    </div>
  );
}
