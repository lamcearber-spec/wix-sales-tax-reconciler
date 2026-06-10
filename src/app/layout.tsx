import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Tax Reconciler for Wix",
  description: "Read-only US sales-tax collected-vs-expected reconciliation for Wix merchants.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
