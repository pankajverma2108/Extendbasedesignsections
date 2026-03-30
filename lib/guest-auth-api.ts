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

const DEFAULT_API_BASE_URL = "https://vibehousebackend-production.up.railway.app";
const DEFAULT_GOOGLE_AUTH_PATH = "/guest/auth/google";

const LOCAL_STORAGE_KEY = "vh_guest_access_token";
const SESSION_STORAGE_KEY = "vh_guest_access_token_session";

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}

function parseApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const message = (data as { message?: unknown }).message;

  if (Array.isArray(message)) {
    return message.join(". ");
  }

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

async function requestJson<T>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    token?: string;
  },
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const rawText = await response.text();
  let data: unknown = null;

  if (rawText.trim()) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(parseApiError(data, "Request failed. Please try again."));
  }

  return data as T;
}

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
  return process.env.NEXT_PUBLIC_GUEST_GOOGLE_AUTH_URL?.trim() || `${apiBaseUrl()}${DEFAULT_GOOGLE_AUTH_PATH}`;
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
