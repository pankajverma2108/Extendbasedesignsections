import type { Metadata } from "next";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/footer";
import { Navigation } from "@/components/marketing/navigation";
import { siteMeta } from "@/content/site";

import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const accentFont = Playfair_Display({
  subsets: ["latin"],
  style: ["italic", "normal"],
  variable: "--font-accent",
});

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
    <html lang="en">
      <body className={`${headingFont.variable} ${accentFont.variable} vh-shell font-[var(--font-heading)]`}>
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
