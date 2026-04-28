import type { Metadata } from "next";

import { LegalDocument } from "@/components/LegalDocument";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy | FloatVia CS2 Skin Arbitrage Analytics",
  description:
    "FloatVia Privacy Policy explaining account information, subscription data, usage logs, Steam-related configuration, cookies, local storage, and data security practices.",
  keywords: [
    "Privacy Policy",
    "CS2 skin arbitrage",
    "personal information",
    "Steam account",
    "data security"
  ],
  alternates: {
    canonical: absoluteUrl("/privacy")
  }
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Privacy"
      title="Privacy Policy"
      updatedAt="2026-04-28"
      description="This policy explains the types of information FloatVia may collect, use, store, and protect while providing data analytics SaaS services."
      sections={[
        {
          title: "1. Information We May Collect",
          body:
            "To provide registration, login, subscription, data query, and account-security features, FloatVia may collect account information, email addresses, login state, subscription orders, usage logs, device and browser information, Steam IDs configured by users, trade links, or marketplace account mapping information."
        },
        {
          title: "2. How We Use Information",
          body:
            "Information is primarily used for authentication, subscription entitlement checks, data queries, fraud and risk review, troubleshooting, product improvement, customer support, and compliance retention. FloatVia does not use this information to execute trades for users or custody user skins or funds."
        },
        {
          title: "3. Steam And Third-Party Marketplace Information",
          body:
            "If users voluntarily connect Steam or configure third-party marketplace information, FloatVia uses that information only to display inventory, match items, generate marketplace links, or improve the analytics experience. Users should avoid submitting unnecessary sensitive credentials and should regularly review third-party authorizations."
        },
        {
          title: "4. Information Sharing",
          body:
            "FloatVia does not sell user personal information to unrelated third parties. Information may be shared only when required by law, authorized by the user, or necessary for payment, infrastructure, analytics, email, security, or support services. If formal providers are added, this policy should be updated with provider names and purposes."
        },
        {
          title: "5. Cookies And Local Storage",
          body:
            "The frontend may use cookies or browser local storage to save login tokens, basic user state, language preference, and cookie consent choices. This helps keep users logged in, complete security checks, and improve product experience. Users can clear local state by logging out, deleting browser data, or changing future preference settings."
        },
        {
          title: "6. Data Security",
          body:
            "FloatVia should use access controls, audit logs, least-privilege permissions, secret isolation, and encrypted transport to protect data. No internet service can guarantee absolute security, and users should also protect their own accounts, devices, passwords, and marketplace credentials."
        },
        {
          title: "7. User Rights",
          body:
            "Depending on applicable law, users may request access to, correction of, or deletion of personal information, or withdraw certain authorizations. If these actions affect account identification, subscription verification, or security controls, some features may no longer be available."
        },
        {
          title: "8. Policy Updates",
          body:
            "FloatVia may update this policy when product features, data-processing practices, third-party services, or legal requirements change. The updated date will be shown on this page. Before production launch, this policy should be reviewed against the laws of target regions."
        }
      ]}
    />
  );
}
