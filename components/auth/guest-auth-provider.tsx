"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { GuestAuthModal } from "@/components/auth/guest-auth-modal";
import {
  type GuestProfile,
  clearStoredGuestToken,
  getGuestGoogleAuthUrl,
  getGuestMe,
  getStoredGuestToken,
  loginGuest,
  setStoredGuestToken,
  signupGuest,
} from "@/lib/guest-auth-api";

type AuthMode = "signin" | "signup";

type GuestProfileUpdatePayload = {
  name: string;
  email: string;
  phone: string | null;
  birthDate?: string | null;
  location?: string | null;
  gender?: string | null;
  prefersEmail?: boolean;
  prefersPhone?: boolean;
};

type AuthContextValue = {
  isModalOpen: boolean;
  mode: AuthMode;
  guest: GuestProfile | null;
  isAuthenticated: boolean;
  isPending: boolean;
  isRestoringSession: boolean;
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  updateGuestProfile: (payload: GuestProfileUpdatePayload) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const PROFILE_OVERRIDES_KEY = "vh_guest_profile_overrides";

type ProfileOverrides = {
  name: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  location: string | null;
  gender: string | null;
  prefersEmail: boolean;
  prefersPhone: boolean;
};

function readProfileOverrides(): ProfileOverrides | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(PROFILE_OVERRIDES_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProfileOverrides>;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" || parsed.phone === null ? parsed.phone : null,
      birthDate: typeof parsed.birthDate === "string" || parsed.birthDate === null ? parsed.birthDate : null,
      location: typeof parsed.location === "string" || parsed.location === null ? parsed.location : null,
      gender: typeof parsed.gender === "string" || parsed.gender === null ? parsed.gender : null,
      prefersEmail: typeof parsed.prefersEmail === "boolean" ? parsed.prefersEmail : true,
      prefersPhone: typeof parsed.prefersPhone === "boolean" ? parsed.prefersPhone : false,
    };
  } catch {
    return null;
  }
}

function mergeWithOverrides(guest: GuestProfile): GuestProfile {
  const overrides = readProfileOverrides();
  if (!overrides) {
    return guest;
  }

  return {
    ...guest,
    name: overrides.name || guest.name,
    email: overrides.email || guest.email,
    phone: overrides.phone ?? guest.phone,
    birthDate: overrides.birthDate ?? guest.birthDate ?? null,
    location: overrides.location ?? guest.location ?? null,
    gender: overrides.gender ?? guest.gender ?? null,
    prefersEmail: overrides.prefersEmail ?? guest.prefersEmail ?? true,
    prefersPhone: overrides.prefersPhone ?? guest.prefersPhone ?? false,
  };
}

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    const token = getStoredGuestToken();
    if (!token) {
      setIsRestoringSession(false);
      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const me = await getGuestMe(token);
        if (!cancelled) {
          setGuest(mergeWithOverrides(me));
        }
      } catch {
        clearStoredGuestToken();
        if (!cancelled) {
          setGuest(null);
        }
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!getStoredGuestToken()) {
      setIsRestoringSession(false);
    }
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false);
    setErrorMessage(null);
  }, []);

  const openAuthModal = useCallback((nextMode: AuthMode = "signin") => {
    setMode(nextMode);
    setErrorMessage(null);
    setIsModalOpen(true);
  }, []);

  const onSwitchMode = useCallback((nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
  }, []);

  const signOut = useCallback(() => {
    clearStoredGuestToken();

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_OVERRIDES_KEY);
    }

    setGuest(null);
  }, []);

  const onSignIn = useCallback(async (payload: { email: string; password: string; rememberMe: boolean }) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await loginGuest({ email: payload.email, password: payload.password });
      setStoredGuestToken(response.access_token, payload.rememberMe);
      const me = await getGuestMe(response.access_token).catch(() => response.guest);
      setGuest(mergeWithOverrides(me));
      closeAuthModal();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in right now.");
    } finally {
      setIsPending(false);
    }
  }, [closeAuthModal]);

  const onSignUp = useCallback(async (payload: { name: string; email: string; password: string; phone?: string }) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await signupGuest(payload);
      setStoredGuestToken(response.access_token);
      const me = await getGuestMe(response.access_token).catch(() => response.guest);
      setGuest(mergeWithOverrides(me));
      closeAuthModal();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign up right now.");
    } finally {
      setIsPending(false);
    }
  }, [closeAuthModal]);

  const onGoogleAuth = useCallback(() => {
    const googleAuthUrl = getGuestGoogleAuthUrl();
    window.location.href = googleAuthUrl;
  }, []);

  const updateGuestProfile = useCallback((payload: GuestProfileUpdatePayload) => {
    setGuest((current) => {
      if (!current) {
        return current;
      }

      const nextProfile: GuestProfile = {
        ...current,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        birthDate: payload.birthDate ?? current.birthDate ?? null,
        location: payload.location ?? current.location ?? null,
        gender: payload.gender ?? current.gender ?? null,
        prefersEmail: payload.prefersEmail ?? current.prefersEmail ?? true,
        prefersPhone: payload.prefersPhone ?? current.prefersPhone ?? false,
      };

      if (typeof window !== "undefined") {
        const overrides: ProfileOverrides = {
          name: nextProfile.name,
          email: nextProfile.email,
          phone: nextProfile.phone,
          birthDate: nextProfile.birthDate ?? null,
          location: nextProfile.location ?? null,
          gender: nextProfile.gender ?? null,
          prefersEmail: nextProfile.prefersEmail ?? true,
          prefersPhone: nextProfile.prefersPhone ?? false,
        };

        window.localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(overrides));
      }

      return nextProfile;
    });
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      isModalOpen,
      mode,
      guest,
      isAuthenticated: Boolean(guest),
      isPending,
      isRestoringSession,
      openAuthModal,
      closeAuthModal,
      updateGuestProfile,
      signOut,
    }),
    [closeAuthModal, guest, isModalOpen, isPending, isRestoringSession, mode, openAuthModal, signOut, updateGuestProfile],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      <GuestAuthModal
        errorMessage={errorMessage}
        mode={mode}
        onClose={closeAuthModal}
        onGoogleAuth={onGoogleAuth}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onSwitchMode={onSwitchMode}
        open={isModalOpen}
        pending={isPending}
      />
    </AuthContext.Provider>
  );
}

export function useGuestAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useGuestAuth must be used within GuestAuthProvider");
  }

  return context;
}
