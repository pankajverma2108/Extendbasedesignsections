const ZOSTEL_PATTERN = /\bzostel\b/gi;

export const BRAND_NAME = "The Daily Social";
export const BRAND_SHORT_NAME = "TDS";

function looksLikeSystemId(value: string): boolean {
  // Reservation/property identifiers should not be shown as end-user location names.
  return /^[A-Z0-9_-]{4,}$/i.test(value);
}

export function withBrandName(value?: string | null, fallback: string = BRAND_NAME): string {
  const raw = (value || "").trim();
  if (!raw) {
    return fallback;
  }

  const branded = raw.replace(ZOSTEL_PATTERN, BRAND_NAME).trim();
  if (!branded || looksLikeSystemId(branded)) {
    return fallback;
  }

  return branded;
}

export function withBrandShortName(value?: string | null, fallback: string = BRAND_SHORT_NAME): string {
  const raw = (value || "").trim();
  if (!raw) {
    return fallback;
  }

  const branded = raw.replace(ZOSTEL_PATTERN, BRAND_SHORT_NAME).trim();
  return branded || fallback;
}

export function toBrandCheckinLink(ezeeReservationId: string): string {
  const safeId = encodeURIComponent(ezeeReservationId);
  return `/bookings/${safeId}/web-check-in`;
}
