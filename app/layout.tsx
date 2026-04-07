import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GuestAuthProvider } from "@/components/auth/guest-auth-provider";
import { Footer } from "@/components/marketing/footer";
import { Navigation } from "@/components/marketing/navigation";
import { Toaster } from "@/components/ui/sonner";
import { siteMeta } from "@/content/site";

import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL("https://thedailysocial.co.in"),
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
    <html lang="en" data-scroll-behavior="smooth" className={cn("font-sans", geist.variable)}>
      <body className="vh-shell font-sora">
        <GuestAuthProvider>
          <Navigation />
          <main>{children}</main>
          <Footer />
          <Toaster position="top-right" />
        </GuestAuthProvider>
      </body>
    </html>
  );
}
