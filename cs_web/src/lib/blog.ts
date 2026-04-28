export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  updatedAt: string;
  keywords: string[];
  sections: Array<{
    heading: string;
    body: string;
  }>;
  references?: Array<{
    label: string;
    href: string;
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "steam-account-setup",
    title: "Steam account setup before trading CS2 skins",
    description:
      "A practical pre-flight checklist for Steam Guard, public inventory settings, trade URLs and common account restrictions.",
    tag: "Starter Guide",
    updatedAt: "2026-04-28",
    keywords: ["Steam Guard", "Steam trade URL", "CS2 skin trading", "inventory privacy"],
    sections: [
      {
        heading: "Check Steam Guard before chasing spreads",
        body:
          "CS2 skin execution depends on account security status. New device logins, password changes, Steam Guard resets and account recovery can trigger trading limits. Confirm the account can send and confirm trades before using any pricing signal."
      },
      {
        heading: "Keep inventory visibility and trade URLs clean",
        body:
          "Third-party markets often need inventory visibility, trade URLs or platform authorization. A missing or stale trade URL can turn a profitable-looking spread into a route you cannot execute."
      },
      {
        heading: "Treat the account as part of the execution checklist",
        body:
          "Price is only one side of the route. Account restrictions, platform region rules, deposits, withdrawals and cooldowns all affect whether an opportunity can be acted on."
      }
    ],
    references: [
      {
        label: "Steam Subscriber Agreement",
        href: "https://store.steampowered.com/subscriber_agreement/"
      }
    ]
  },
  {
    slug: "buff-guide",
    title: "BUFF guide: price, volume and fee signals",
    description:
      "How to read BUFF listings for CS2 skin arbitrage, with focus on executable buy prices, volume fields and sell-side fees.",
    tag: "Market Guide",
    updatedAt: "2026-04-28",
    keywords: ["BUFF guide", "BUFF CS2 skins", "BUFF fees", "CS2 arbitrage"],
    sections: [
      {
        heading: "Use executable prices, not decorative prices",
        body:
          "The relevant number is the currently executable buy or sell quote, not a stale reference value. Cross-check low prices when the last update time is old or the volume is thin."
      },
      {
        heading: "Volume filters protect the deal table",
        body:
          "FloatVia uses BUFF volume fields to avoid ranking markets that look profitable but may not have enough liquidity to exit."
      },
      {
        heading: "Fees change the real spread",
        body:
          "BUFF sell routes should be calculated on net proceeds after the platform fee. A spread that ignores fees is not a tradeable profit estimate."
      }
    ]
  },
  {
    slug: "waxpeer-guide",
    title: "Waxpeer guide: USD prices, CNY conversion and fees",
    description:
      "How FloatVia normalizes Waxpeer USD quotes, converts them to CNY and applies sell-side fee assumptions.",
    tag: "Market Guide",
    updatedAt: "2026-04-28",
    keywords: ["Waxpeer guide", "Waxpeer fees", "USD CNY conversion", "CS2 Waxpeer"],
    sections: [
      {
        heading: "Normalize units first",
        body:
          "Waxpeer source prices may use a platform-specific minor unit. The backend converts the source value into USD, then into CNY, before comparing it with domestic venues."
      },
      {
        heading: "Apply the sell-side fee on exit routes",
        body:
          "When Waxpeer is the sell platform, the displayed net price should account for the assumed platform fee. This keeps the profit number closer to execution reality."
      },
      {
        heading: "FX and payout costs remain external risks",
        body:
          "USD/CNY rates, deposits, withdrawals and payment rails can all move between data capture and execution. The tool ranks opportunities; it does not guarantee final cash proceeds."
      }
    ]
  },
  {
    slug: "buff-waxpeer-shadowpay-profit",
    title: "Why each sell platform needs its own profit calculation",
    description:
      "The same CS2 item can have different net profit on BUFF, YouPin, Waxpeer and ShadowPay because fees and liquidity differ.",
    tag: "Profit Logic",
    updatedAt: "2026-04-28",
    keywords: ["CS2 skin arbitrage", "sell platform profit", "ShadowPay fees", "Direction B"],
    sections: [
      {
        heading: "Direction A picks the lowest eligible buy price",
        body:
          "The buy side should select the cheapest route that still passes freshness and volume checks. A quote with no liquidity is not a reliable entry price."
      },
      {
        heading: "Direction B is calculated per platform",
        body:
          "Each sell platform has its own fee rate, volume signal, currency handling and update cadence. FloatVia calculates platform-specific net profit before selecting the best default route."
      },
      {
        heading: "Default to best profit, allow platform filters",
        body:
          "The main table defaults to the highest net profit per item. Users can still filter Direction B to one marketplace to evaluate a specific exit strategy."
      }
    ]
  },
  {
    slug: "steam-trade-restrictions",
    title: "Steam trade restrictions that can break a CS2 skin route",
    description:
      "Common Steam account limits, market restrictions and cooldowns that should be checked before acting on a pricing spread.",
    tag: "Risk Control",
    updatedAt: "2026-04-28",
    keywords: ["Steam trade restrictions", "Steam market cooldown", "CS2 trade hold", "CS2 skin risk"],
    sections: [
      {
        heading: "A profitable spread can still be blocked",
        body:
          "If the account is under a trade hold, market restriction or security review, you may not be able to move inventory quickly enough for the spread to matter."
      },
      {
        heading: "Cooldowns increase capital cycle risk",
        body:
          "Trade cooldowns and market delays extend the time between purchase and sale. Longer cycles increase price volatility and opportunity decay."
      },
      {
        heading: "Use official Steam notices as the source of truth",
        body:
          "Platform rules change. Treat FloatVia content as operational education and verify account-specific restrictions directly inside Steam before execution."
      }
    ],
    references: [
      {
        label: "Steam Security and Trading Update",
        href: "https://store.steampowered.com/news/20631/"
      }
    ]
  },
  {
    slug: "fee-calculation",
    title: "CS2 skin fee calculation: gross price, net price and real profit",
    description:
      "A simple formula for comparing buy price, sell price, platform fee, FX assumptions and extra costs.",
    tag: "Profit Logic",
    updatedAt: "2026-04-28",
    keywords: ["CS2 skin fees", "arbitrage formula", "net profit", "platform fee"],
    sections: [
      {
        heading: "Start with a net sell price",
        body:
          "Net sell price equals gross sell quote multiplied by one minus the platform fee rate. Profit equals net sell price minus buy cost and extra costs."
      },
      {
        heading: "Convert currencies before comparing platforms",
        body:
          "Domestic and overseas venues cannot be compared until prices share the same currency. FloatVia normalizes overseas USD quotes into CNY using the configured exchange rate."
      },
      {
        heading: "Execution costs are still user-specific",
        body:
          "Deposits, withdrawals, payment provider spreads and capital delays differ by user. The calculator gives a baseline, not a final accounting statement."
      }
    ]
  },
  {
    slug: "liquidity-risk-filter",
    title: "How liquidity filters remove non-executable CS2 skin deals",
    description:
      "Why volume, freshness, platform coverage and abnormal margins matter as much as headline profit.",
    tag: "Risk Control",
    updatedAt: "2026-04-28",
    keywords: ["CS2 skin volume", "liquidity score", "arbitrage risk", "low volume filter"],
    sections: [
      {
        heading: "Low volume means weak exit confidence",
        body:
          "A price gap is not enough. If the sell venue has no recent volume, the opportunity may be a stale quote rather than a route that can clear."
      },
      {
        heading: "Freshness helps detect stale spreads",
        body:
          "The arbitrage terminal exposes the last update time for each quote. Hovering over a platform quote shows the timestamp immediately."
      },
      {
        heading: "Extreme margins need manual review",
        body:
          "Very high margins can come from item mapping errors, source anomalies or outdated quotes. High-profit rows should be verified on the marketplace page before action."
      }
    ]
  },
  {
    slug: "arbitrage-risk",
    title: "CS2 skin arbitrage risks: prices, accounts and platform rules",
    description:
      "FloatVia provides data analysis, not guaranteed returns. Understand the operational risks before trading.",
    tag: "Risk Control",
    updatedAt: "2026-04-28",
    keywords: ["CS2 arbitrage risk", "no guaranteed profit", "CS2 skin trading risk", "data analysis only"],
    sections: [
      {
        heading: "Prices can move before execution",
        body:
          "Inventory depth, market attention, API lag and listing changes can all alter the spread after data collection. A ranked deal is not a guaranteed executable result."
      },
      {
        heading: "Account and platform rules are outside FloatVia",
        body:
          "Steam and third-party markets can restrict accounts, regions, payments, withdrawals or listings. Users must verify and accept those risks directly."
      },
      {
        heading: "FloatVia does not custody assets or trade automatically",
        body:
          "The platform ranks data and provides analysis. It does not hold user items or funds, does not place orders and does not control third-party marketplace accounts."
      }
    ],
    references: [
      {
        label: "Steam Subscriber Agreement",
        href: "https://store.steampowered.com/subscriber_agreement/"
      }
    ]
  }
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
