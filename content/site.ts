import type { NavItem } from "@/content/types";

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Events", href: "/events" },
  { label: "About", href: "/about" },
];

export const footerLinks = {
  quickLinks: navItems,
  legal: [
    { label: "Guest Policies", href: "/policies/guest" },
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Refund Policy", href: "/policies/refund" },
    { label: "Terms & Conditions", href: "/policies/terms" },
  ],
};

export const siteMeta = {
  name: "Vibe House",
  tagline: "Stay. Mix. Repeat.",
  description:
    "A vibrant hostel marketing site for travelers looking for community, safe stays, and memorable nights.",
  contact: {
    phoneDisplay: "+91 98765 43210",
    phoneHref: "tel:+919876543210",
    email: "hello@vibehouse.com",
    emailHref: "mailto:hello@vibehouse.com",
    addressLines: ["123 Backpacker Street", "Mumbai 400001"],
    instagramHref: "https://instagram.com/vibehouse",
    mapsHref: "https://maps.google.com",
  },
};
