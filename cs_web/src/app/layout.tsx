import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "FloatVia - CS2 Skin Arbitrage Analytics",
    template: "%s | FloatVia"
  },
  description:
    "Cross-market CS2 skin price comparison, profit calculation, liquidity filtering, price snapshots and risk analytics.",
  keywords: ["CS2 skin arbitrage", "BUFF analytics", "Waxpeer analytics", "CS2 skin trading", "FloatVia"]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
