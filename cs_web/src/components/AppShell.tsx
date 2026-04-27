"use client";

import {
  Activity,
  BarChart3,
  Calculator,
  CreditCard,
  HelpCircle,
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
  { href: "/arbitrage", label: "利润查询", icon: BarChart3 },
  { href: "/samples", label: "样例榜", icon: Star },
  { href: "/tools/cost-simulator", label: "成本模拟", icon: Calculator },
  { href: "/blog", label: "教程", icon: Newspaper },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/status", label: "状态", icon: Activity },
  { href: "/pricing", label: "订阅", icon: CreditCard },
  { href: "/profile", label: "个人中心", icon: UserCircle }
];

const legalLinks = [
  { href: "/terms", label: "用户协议" },
  { href: "/privacy", label: "隐私政策" },
  { href: "/disclaimer", label: "免责声明" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-blue-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-800 text-white shadow-glow">
              <Shield className="h-5 w-5" />
            </span>
            <span className="font-mono-display">CS Arbitrage</span>
          </Link>
          <nav className="hidden items-center gap-1 xl:flex">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-50"
                onClick={() => {
                  clearAuth();
                  setUser(null);
                  window.location.href = "/";
                }}
              >
                退出
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4" />
                登录
              </Link>
            )}
          </div>
        </div>
        <div className="border-t border-slate-100 xl:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100"
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
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>仅提供数据分析，不保证收益，不托管资产，不自动交易。</p>
          <nav className="flex flex-wrap gap-4">
            {legalLinks.map((item) => (
              <Link className="font-medium text-slate-700 hover:text-blue-800" href={item.href} key={item.href}>
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
