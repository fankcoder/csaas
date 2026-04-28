import type { Metadata } from "next";

import { LegalDocument } from "@/components/LegalDocument";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Disclaimer | FloatVia CS2 Skin Arbitrage Analytics",
  description:
    "FloatVia disclaimer stating that the platform provides data analytics only, does not guarantee profit, does not custody assets, and does not execute automated trades.",
  keywords: [
    "Disclaimer",
    "no guaranteed profit",
    "no asset custody",
    "no automated trading",
    "CS2 skin arbitrage risk"
  ],
  alternates: {
    canonical: absoluteUrl("/disclaimer")
  }
};

export default function DisclaimerPage() {
  return (
    <LegalDocument
      eyebrow="Disclaimer"
      title="Disclaimer"
      updatedAt="2026-04-28"
      description="This disclaimer clarifies the boundary between FloatVia's information display and each user's independent trading decisions."
      sections={[
        {
          title: "1. No Profit Guarantee",
          body:
            "Spreads, profit margins, volumes, update times, and trend charts displayed by FloatVia are data-analysis outputs only. They do not represent guaranteed executable prices and do not constitute profit promises, investment advice, trading advice, or financial advice."
        },
        {
          title: "2. No Asset Custody",
          body:
            "FloatVia does not custody Steam skins, marketplace assets, cash balances, payment accounts, private keys, or credentials. Any deposits, withdrawals, purchases, sales, or transfers on third-party marketplaces are completed by users independently."
        },
        {
          title: "3. No Automated Trading",
          body:
            "FloatVia does not automatically place orders, list items, buy items, sell items, transfer inventory, or confirm Steam trades on behalf of users. Any trade execution requires users to log in to the relevant marketplace and make their own decision."
        },
        {
          title: "4. Data May Be Inaccurate",
          body:
            "Due to third-party APIs, webpage changes, network latency, exchange rates, fees, inventory changes, price units, item mapping, risk-control limits, or data-source errors, FloatVia data may be delayed, incomplete, or inaccurate. Users should verify all information on the relevant marketplace before taking action."
        },
        {
          title: "5. Users Bear Trading Risk",
          body:
            "CS2 skin prices can fluctuate, and trades may be affected by account restrictions, marketplace rules, cooldown periods, payment channels, withdrawal costs, KYC, regional limitations, or policy changes. Users are responsible for assessing risk and accepting all outcomes of their own trades."
        },
        {
          title: "6. Third-Party Responsibility",
          body:
            "FloatVia is not responsible for service interruptions, rule changes, fee changes, account restrictions, asset freezes, or data abnormalities caused by Steam, Valve, BUFF, YouPin, Waxpeer, ShadowPay, C5, or any other third-party marketplace."
        },
        {
          title: "7. Educational Content Boundary",
          body:
            "FAQ, blog posts, guides, and tool explanations are provided for product education and market knowledge. They are not guaranteed to be complete, current, or suitable for every user. Marketplace-specific rules should always be checked against the official third-party documentation."
        }
      ]}
    />
  );
}
