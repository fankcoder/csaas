import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "CS2 饰品套利数据分析平台",
    template: "%s | CS2 饰品套利数据分析平台"
  },
  description:
    "跨平台 CS2 饰品价格比较、利润计算、销量过滤、价格快照和风险控制数据分析工具。",
  keywords: ["CS2 饰品套利", "BUFF 教程", "Waxpeer 教程", "Steam 交易限制", "饰品价格分析"]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
