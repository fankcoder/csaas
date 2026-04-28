import type { Metadata } from "next";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://floatvia.com").replace(/\/$/, "");

export const siteName = "FloatVia";

export const defaultTitle = "FloatVia - CS2 Skin Arbitrage Analytics";

export const defaultDescription =
  "Cross-market CS2 skin arbitrage analytics across BUFF, YouPin, Waxpeer, ShadowPay and global CS2 skin marketplaces.";

export const defaultKeywords = [
  "CS2 skin arbitrage",
  "CS2 skin trading",
  "BUFF arbitrage",
  "Waxpeer analytics",
  "ShadowPay analytics",
  "CS2 skin price comparison",
  "CS2 marketplace analytics",
  "FloatVia"
];

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

export function publicPageMetadata({
  title,
  description,
  path,
  keywords = []
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    alternates: {
      canonical: absoluteUrl(path)
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: absoluteUrl("/icon.svg"),
  sameAs: []
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  description: defaultDescription,
  inLanguage: "en"
};
