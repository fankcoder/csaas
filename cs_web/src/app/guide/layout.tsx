import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Beginner CS2 Skin Arbitrage Roadmap",
  description:
    "A beginner-friendly roadmap for CS2 skin arbitrage by budget, liquidity, marketplace coverage and execution risk.",
  path: "/guide",
  keywords: ["CS2 skin arbitrage guide", "CS2 trading roadmap", "Steam skin trading guide"]
});

export default function GuideLayout({ children }: { children: ReactNode }) {
  return children;
}
