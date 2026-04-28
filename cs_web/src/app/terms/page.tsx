import type { Metadata } from "next";

import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service | FloatVia CS2 Skin Arbitrage Analytics",
  description:
    "FloatVia Terms of Service covering service scope, user responsibilities, subscriptions, third-party marketplace relationships, prohibited use, and trading risk boundaries.",
  keywords: [
    "Terms of Service",
    "CS2 skin arbitrage",
    "data analytics platform",
    "no automated trading",
    "no asset custody"
  ]
};

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Terms"
      title="Terms of Service"
      updatedAt="2026-04-28"
      description="Please read these Terms before using FloatVia. They define the service boundaries, user responsibilities, and usage rules for the platform."
      sections={[
        {
          title: "1. Service Scope",
          body:
            "FloatVia provides CS2 skin market data aggregation, price comparison, fee estimation, liquidity filtering, opportunity ranking, and educational content. The platform does not provide investment advice, financial advice, legal advice, or any guaranteed-profit service."
        },
        {
          title: "2. Analytics Only; No Trade Execution",
          body:
            "FloatVia does not custody user assets, receive user skins, place orders for users, execute trades automatically, or control any third-party marketplace account. All purchases, sales, deposits, withdrawals, transfers, and trade confirmations are completed manually by users on the relevant marketplace."
        },
        {
          title: "3. User Responsibilities",
          body:
            "Users are responsible for verifying the account status, trading restrictions, fees, regional limitations, and compliance requirements of Steam, BUFF, YouPin, Waxpeer, ShadowPay, C5, and any other marketplace they use. Users must protect their accounts, passwords, tokens, API keys, trade links, and payment information."
        },
        {
          title: "4. Data And Results",
          body:
            "Data displayed on FloatVia may come from public pages, authorized APIs, user configuration, or other accessible data sources. Due to network latency, marketplace updates, exchange-rate movement, inventory changes, mapping errors, or third-party limitations, data may be delayed, incomplete, or inaccurate. Users must not treat displayed results as certain profit."
        },
        {
          title: "5. Subscriptions And Payments",
          body:
            "FloatVia may offer premium plans that unlock advanced data queries, filters, saved opportunities, reports, alerts, exports, API access, or other features. Subscription benefits, pricing, billing periods, and refund rules are governed by the purchase page shown at the time of purchase. If formal payment providers are added, orders will also be subject to the relevant provider's terms."
        },
        {
          title: "6. Prohibited Use",
          body:
            "Users may not use FloatVia for illegal or abusive activity, fraud, money laundering, account theft, bypassing marketplace risk controls, bulk attacks against third-party services, infringement of others' rights, or any activity that violates Steam or marketplace rules."
        },
        {
          title: "7. Third-Party Marketplaces",
          body:
            "FloatVia is not an agent, guarantor, partner, employee, or authorized representative of Steam, Valve, BUFF, YouPin, Waxpeer, ShadowPay, C5, or any other third-party marketplace. Third-party rules, fees, APIs, data, and services may change at any time. Users should rely on the official pages and terms of each marketplace."
        },
        {
          title: "8. Changes To These Terms",
          body:
            "FloatVia may update these Terms to reflect business, legal, compliance, or product changes. The updated date will be shown on this page. Continued use of the platform after an update means the user accepts the revised Terms."
        }
      ]}
    />
  );
}
