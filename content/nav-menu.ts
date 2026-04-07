export type HostelNavItem = {
  id: string;
  label: string;
  href: string;
};

function buildPropertyHref(propertyId: string): string {
  return `/property?property_id=${encodeURIComponent(propertyId)}`;
}

export const hostelNavItems: HostelNavItem[] = [
  {
    id: "tds-koramangala-a",
    label: "TDS, Property A - Koramangala",
    href: buildPropertyHref("tds-koramangala-a"),
  },
  {
    id: "tds-koramangala-2",
    label: "TDS, Property B - Koramangala",
    href: buildPropertyHref("tds-koramangala-b"),
  },
];

export const primaryHostelHref = hostelNavItems[0]?.href ?? "/property";
