import { getApiBaseUrl, requestJson } from "@/lib/vibehouse-api";

export type GuestProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  profile_photo_url: string | null;
  created_at: string;
  birthDate?: string | null;
  location?: string | null;
  gender?: string | null;
  prefersEmail?: boolean;
  prefersPhone?: boolean;
  bookings?: GuestBookingSummary[];
};

export type GuestBookingSummary = {
  ezee_reservation_id: string;
  role: "PRIMARY" | "SECONDARY";
  status: "APPROVED" | "PENDING_APPROVAL" | "REJECTED";
  checkin_date: string;
  checkout_date: string;
  room_type_name: string;
  property_id: string;
};

export type GuestAuthResponse = {
  access_token: string;
  guest: GuestProfile;
};

export type GuestSignupPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export type GuestLoginPayload = {
  email: string;
  password: string;
};

const DEFAULT_GOOGLE_AUTH_PATH = "/guest/auth/google";

const LOCAL_STORAGE_KEY = "vh_guest_access_token";
const SESSION_STORAGE_KEY = "vh_guest_access_token_session";

export async function signupGuest(payload: GuestSignupPayload): Promise<GuestAuthResponse> {
  return requestJson<GuestAuthResponse>("/guest/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export async function loginGuest(payload: GuestLoginPayload): Promise<GuestAuthResponse> {
  return requestJson<GuestAuthResponse>("/guest/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function getGuestMe(token: string): Promise<GuestProfile> {
  return requestJson<GuestProfile>("/guest/auth/me", {
    method: "GET",
    token,
  });
}

export function getGuestGoogleAuthUrl(): string {
  return process.env.NEXT_PUBLIC_GUEST_GOOGLE_AUTH_URL?.trim() || `${getApiBaseUrl()}${DEFAULT_GOOGLE_AUTH_PATH}`;
}

export function getStoredGuestToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(LOCAL_STORAGE_KEY) || window.sessionStorage.getItem(SESSION_STORAGE_KEY);
}

export function setStoredGuestToken(token: string, persist = true): void {
  if (typeof window === "undefined") {
    return;
  }

  if (persist) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, token);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, token);
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function clearStoredGuestToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
