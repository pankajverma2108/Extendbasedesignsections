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
    id: "60765",
    label: "TDS, Property A - Koramangala",
    href: buildPropertyHref("60765"),
  },
];

export const primaryHostelHref = hostelNavItems[0]?.href ?? "/property";
