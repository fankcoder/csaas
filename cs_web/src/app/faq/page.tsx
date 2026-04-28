import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | FloatVia CS2 Skin Arbitrage Analytics",
  description:
    "Frequently asked questions about FloatVia CS2 skin arbitrage analytics, including data sources, profit calculation, liquidity filters, subscriptions, payments, privacy, and trading risk.",
  keywords: [
    "CS2 skin arbitrage FAQ",
    "CS2 trading risk",
    "skin profit analytics",
    "BUFF Waxpeer arbitrage",
    "FloatVia FAQ"
  ]
};

const faqGroups = [
  {
    title: "Data And Profit Calculation",
    items: [
      {
        question: "How does FloatVia calculate profit?",
        answer:
          "FloatVia converts quotes from connected marketplaces into CNY, then compares the lowest eligible buy price with the selected sell-side net price. Sell-side fees are deducted where applicable, and USD-based markets are converted using the configured exchange rate."
      },
      {
        question: "Why can the same item show multiple profit results?",
        answer:
          "The buy side uses the lowest eligible quote within the current filters, while the sell side can be evaluated across multiple exit platforms. The default view highlights the best route, and paid users can filter by a specific sell platform."
      },
      {
        question: "Why are low-volume opportunities filtered out?",
        answer:
          "A spread is only useful if it can realistically be executed. FloatVia applies liquidity thresholds so quotes with insufficient listed volume are not treated as reliable buy or sell routes."
      },
      {
        question: "What does the last updated time mean?",
        answer:
          "Older quotes have a higher chance of becoming stale. The platform shows quote update times so users can judge freshness before manually checking and executing on the marketplace."
      }
    ]
  },
  {
    title: "Marketplace And Account Setup",
    items: [
      {
        question: "Which marketplace accounts should I prepare?",
        answer:
          "At minimum, users should prepare Steam and the marketplaces they want to use, such as BUFF, YouPin, Waxpeer, ShadowPay, C5, or other connected venues. Each marketplace may require its own identity, payment, trade-link, or API setup."
      },
      {
        question: "Why does Steam account readiness matter?",
        answer:
          "CS2 skin trading depends on Steam inventory state, trade confirmations, market restrictions, device authorization, and inventory visibility. Any Steam-side restriction can affect execution speed or make a route unusable."
      },
      {
        question: "Does FloatVia trade automatically for me?",
        answer:
          "No. FloatVia is an analytics and opportunity discovery tool. It does not custody assets, hold balances, place orders, or execute trades. Users must verify and complete any transaction manually on the relevant marketplace."
      }
    ]
  },
  {
    title: "Subscription, Payment, And Risk",
    items: [
      {
        question: "What do paid plans unlock?",
        answer:
          "Paid plans unlock broader deal visibility, search and filtering, platform-specific route analysis, and premium workflow features such as saved opportunities, reports, alerts, exports, API access, or extended history depending on the plan."
      },
      {
        question: "Is profit guaranteed?",
        answer:
          "No. Arbitrage outcomes can be affected by inventory locks, fees, exchange rates, price movement, withdrawal costs, liquidity, and execution speed. FloatVia provides data for analysis, but final trading risk belongs to the user."
      },
      {
        question: "Does FloatVia custody my skins or funds?",
        answer:
          "No. FloatVia does not receive user skins, cash balances, payment account credentials, private keys, or control of third-party marketplace accounts."
      },
      {
        question: "Where can I find the terms, privacy policy, and disclaimer?",
        answer:
          "Links to the Terms, Privacy Policy, and Disclaimer are available in the site footer. Before production launch, these documents should be reviewed against the target markets, payment flow, and actual data-processing practices."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="eyebrow">FAQ</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              Frequently Asked Questions
            </h1>
            <p className="mt-3 muted-copy">
              Learn how FloatVia handles market data, profit calculations, account preparation, subscriptions, payment flow, and trading risk boundaries.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:px-8">
        {faqGroups.map((group) => (
          <div key={group.title} className="data-card">
            <h2 className="text-lg font-semibold text-slate-950">{group.title}</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {group.items.map((item) => (
                <details key={item.question} className="group py-4 first:pt-0 last:pb-0">
                  <summary className="cursor-pointer list-none font-medium text-slate-900">
                    <span className="inline-flex w-full items-center justify-between gap-4">
                      {item.question}
                      <span className="text-sm text-blue-700 group-open:hidden">Expand</span>
                      <span className="hidden text-sm text-blue-700 group-open:inline">Collapse</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
