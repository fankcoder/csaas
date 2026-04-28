"use client";

import {
  BarChart3,
  CreditCard,
  LogIn,
  Newspaper,
  Shield,
  Star,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { CookieConsent } from "@/components/CookieConsent";
import { clearAuth, getUser, type StoredUser } from "@/lib/auth";

const nav = [
  { href: "/arbitrage", label: "Deals", icon: BarChart3 },
  { href: "/samples", label: "Samples", icon: Star },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/profile", label: "Account", icon: UserCircle }
];

const legalLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/disclaimer", label: "Disclaimer" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const pathname = usePathname();
  const visibleNav = user?.has_premium
    ? nav
    : nav.filter((item) => ["/samples", "/pricing", "/blog"].includes(item.href));

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="fv-app flex min-h-screen flex-col bg-[#050711] text-white">
      <header
        className="sticky top-0 z-30 border-b border-white/10 bg-[#050711]/82 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-lime-300 text-slate-950">
              <Shield className="h-5 w-5" />
            </span>
            <span className="font-mono-display">FloatVia</span>
          </Link>
          <nav className="hidden items-center gap-1 xl:flex">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/15"
                onClick={() => {
                  clearAuth();
                  setUser(null);
                  window.location.href = "/";
                }}
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md bg-lime-300 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors duration-200 hover:bg-lime-200"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </Link>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 xl:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      <footer className="border-t border-white/10 bg-[#050711]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Data analysis only. No guaranteed profit. No asset custody. No automated trading.</p>
          <nav className="flex flex-wrap gap-4">
            {legalLinks.map((item) => (
              <Link
                className="font-medium text-slate-300 hover:text-lime-200"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
