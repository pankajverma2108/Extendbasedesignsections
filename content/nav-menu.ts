import { getDefaultPropertyDestinationHref } from "@/lib/cx-api";

export type HostelNavItem = {
  id: string;
  label: string;
  href: string;
};

export const hostelNavItems: HostelNavItem[] = [
  {
    id: "60765",
    label: "TDSocial Koramangala Hostel",
    href: getDefaultPropertyDestinationHref("60765"),
  },
  {
    id: "tdsocial-stay-koramangala",
    label: "TDSocial Stay at Koramangala",
    href: "/launching-soon?property=TDSocial%20Stay%20at%20Koramangala",
  },
  {
    id: "buteak-suites-koramangala-club-rd",
    label: "Buteak Suites Koramangala Club Road",
    href: "/launching-soon?property=Buteak%20Suites%20Koramangala%20Club%20Rd",
  },
];

export const primaryHostelHref = hostelNavItems[0]?.href ?? "/property";
