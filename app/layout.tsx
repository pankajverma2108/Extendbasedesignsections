import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/footer";
import { Navigation } from "@/components/marketing/navigation";
import { siteMeta } from "@/content/site";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteMeta.name,
    template: `%s | ${siteMeta.name}`,
  },
  description: siteMeta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="vh-shell font-sora">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
