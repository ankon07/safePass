"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Navigation items tailored for the agency
const navItems = [
  { href: "/a/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/a/jobs", label: "Job Listings", icon: Briefcase },
  { href: "/a/placements", label: "Placements", icon: Users },
  { href: "/a/settings/profile", label: "Settings", icon: Settings },
];

export default function AgencyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Reusable NavLink component for consistent styling
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

  // Reusable Sidebar content for both desktop and mobile
  const sidebarContent = (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link
          href="/dashboard"
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
      <div className="hidden border-r bg-slate-50/70 md:block">
        {sidebarContent}
      </div>

      {/* Mobile Header & Main Content */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-slate-50/70 px-4 lg:h-[60px] lg:px-6">
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
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="https://api.dicebear.com/8.x/initials/svg?seed=Global%20Recruiters" />
                  <AvatarFallback>GR</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Global Recruiters Ltd.</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 bg-white">{children}</main>
      </div>
    </div>
  );
}
