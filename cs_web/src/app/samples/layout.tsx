import type { ReactNode } from "react";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Live CS2 Skin Arbitrage Samples",
  description:
    "Preview limited FloatVia CS2 skin arbitrage sample routes with profit, liquidity and risk signals before unlocking the full deal table.",
  path: "/samples",
  keywords: ["CS2 skin arbitrage samples", "CS2 skin deals", "CS2 profit signals"]
});

export default function SamplesLayout({ children }: { children: ReactNode }) {
  return children;
}
