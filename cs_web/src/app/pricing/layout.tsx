import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "FloatVia Pricing - CS2 Skin Arbitrage Plans",
  description:
    "Compare FloatVia Free, Pro and Elite plans for CS2 skin arbitrage analytics, market coverage, history, alerts and workflow features.",
  path: "/pricing",
  keywords: ["CS2 arbitrage pricing", "CS2 skin analytics subscription", "FloatVia Pro"]
});

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
