import type { ReactNode } from "react";

import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
