"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { GuestAuthModal } from "@/components/auth/guest-auth-modal";
import {
  type GuestProfile,
  clearStoredGuestToken,
  rememberPostAuthRedirect,
  getPostAuthRedirect,
  getGuestGoogleAuthUrl,
  getGuestMe,
  getStoredGuestToken,
  loginGuest,
  setStoredGuestToken,
  signupGuest,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
} from "@/lib/guest-auth-api";

export type AuthMode =
  | "signin"
  | "signup"
  | "verify-otp"
  | "forgot-password"
  | "forgot-password-otp"
  | "set-new-password";

type GuestProfileUpdatePayload = {
  name: string;
  email: string;
  phone: string | null;
  birthDate?: string | null;
  location?: string | null;
  nationality?: string | null;
  emergencyContact?: string | null;
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
  resendVerificationCode: (email: string) => Promise<void>;
  updateGuestProfile: (payload: GuestProfileUpdatePayload) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const PROFILE_OVERRIDES_KEY = "vh_guest_profile_overrides";
const GUEST_PROFILE_CACHE_KEY = "vh_guest_profile_cache";

type ProfileOverrides = {
  name: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  location: string | null;
  nationality: string | null;
  emergencyContact: string | null;
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
      nationality: typeof parsed.nationality === "string" || parsed.nationality === null ? parsed.nationality : null,
      emergencyContact:
        typeof parsed.emergencyContact === "string" || parsed.emergencyContact === null ? parsed.emergencyContact : null,
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
    nationality: overrides.nationality ?? guest.nationality ?? null,
    emergencyContact: overrides.emergencyContact ?? guest.emergencyContact ?? null,
    gender: overrides.gender ?? guest.gender ?? null,
    prefersEmail: overrides.prefersEmail ?? guest.prefersEmail ?? true,
    prefersPhone: overrides.prefersPhone ?? guest.prefersPhone ?? false,
  };
}

function readCachedGuestProfile(): GuestProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(GUEST_PROFILE_CACHE_KEY) || window.sessionStorage.getItem(GUEST_PROFILE_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as GuestProfile;
    if (!parsed || typeof parsed !== "object" || typeof parsed.id !== "string") {
      return null;
    }

    return mergeWithOverrides(parsed);
  } catch {
    return null;
  }
}

function writeCachedGuestProfile(guest: GuestProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  const tokenInLocalStorage = window.localStorage.getItem("vh_guest_access_token");
  const targetStorage = tokenInLocalStorage ? window.localStorage : window.sessionStorage;
  targetStorage.setItem(GUEST_PROFILE_CACHE_KEY, JSON.stringify(guest));
}

function clearCachedGuestProfile(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(GUEST_PROFILE_CACHE_KEY);
  window.sessionStorage.removeItem(GUEST_PROFILE_CACHE_KEY);
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
      clearCachedGuestProfile();
      setIsRestoringSession(false);
      return;
    }

    const cachedGuest = readCachedGuestProfile();
    if (cachedGuest) {
      setGuest(cachedGuest);
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const me = await getGuestMe(token);
        if (!cancelled) {
          const nextGuest = mergeWithOverrides(me);
          setGuest(nextGuest);
          writeCachedGuestProfile(nextGuest);
        }
      } catch {
        clearStoredGuestToken();
        clearCachedGuestProfile();
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
    rememberPostAuthRedirect();
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
    clearCachedGuestProfile();

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
      const nextGuest = mergeWithOverrides(me);
      setGuest(nextGuest);
      writeCachedGuestProfile(nextGuest);
      setIsRestoringSession(false);
      toast.success("Signed in successfully", {
        description: `Welcome back, ${me.name.split(" ")[0] ?? "Guest"}.`,
      });
      closeAuthModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in right now.";
      setErrorMessage(message);
      toast.error("Sign in failed", { description: message });
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
      const nextGuest = mergeWithOverrides(me);
      setGuest(nextGuest);
      writeCachedGuestProfile(nextGuest);
      setIsRestoringSession(false);
      
      if (response.otp_sent) {
        toast.success("Account created", {
          description: "Please check your email for the verification code.",
        });
        setMode("verify-otp");
      } else {
        toast.success("Account created", {
          description: `Great to have you here, ${me.name.split(" ")[0] ?? "Guest"}.`,
        });
        closeAuthModal();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign up right now.";
      setErrorMessage(message);
      toast.error("Sign up failed", { description: message });
    } finally {
      setIsPending(false);
    }
  }, [closeAuthModal]);

  const onVerifyOtp = useCallback(async (payload: { email: string; otp: string }) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await verifyOtp(payload);
      setStoredGuestToken(response.access_token);
      const me = await getGuestMe(response.access_token).catch(() => response.guest);
      const nextGuest = mergeWithOverrides(me);
      setGuest(nextGuest);
      writeCachedGuestProfile(nextGuest);
      setIsRestoringSession(false);
      toast.success("Email verified", {
        description: "Your email has been successfully verified.",
      });
      closeAuthModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to verify code.";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  }, [closeAuthModal]);

  const onSendOtp = useCallback(async (email: string) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      await sendOtp({ email });
      toast.success("Code sent", {
        description: `We've sent a new code to ${email}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send code.";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  }, []);

  const onForgotPassword = useCallback(async (payload: { email: string }) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      await forgotPassword(payload);
      setMode("forgot-password-otp");
      toast.success("OTP sent", {
        description: `We've sent a 6-digit password reset code to ${payload.email}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send reset email.";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  }, []);

  const onResetPassword = useCallback(async (payload: { email: string; otp: string; newPassword: string }) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const response = await resetPassword(payload);
      setStoredGuestToken(response.access_token);
      const me = await getGuestMe(response.access_token).catch(() => response.guest);
      const nextGuest = mergeWithOverrides(me);
      setGuest(nextGuest);
      writeCachedGuestProfile(nextGuest);
      setIsRestoringSession(false);
      toast.success("Password reset", {
        description: "Your password was updated successfully.",
      });
      closeAuthModal();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reset password.";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  }, [closeAuthModal]);

  const onGoogleAuth = useCallback(() => {
    rememberPostAuthRedirect();
    const returnPath = getPostAuthRedirect() || undefined;
    const googleAuthUrl = getGuestGoogleAuthUrl(returnPath);
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
        nationality: payload.nationality ?? current.nationality ?? null,
        emergencyContact: payload.emergencyContact ?? current.emergencyContact ?? null,
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
          nationality: nextProfile.nationality ?? null,
          emergencyContact: nextProfile.emergencyContact ?? null,
          gender: nextProfile.gender ?? null,
          prefersEmail: nextProfile.prefersEmail ?? true,
          prefersPhone: nextProfile.prefersPhone ?? false,
        };

        window.localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(overrides));
      }

      writeCachedGuestProfile(nextProfile);

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
      resendVerificationCode: onSendOtp,
      updateGuestProfile,
      signOut,
    }),
    [closeAuthModal, guest, isModalOpen, isPending, isRestoringSession, mode, onSendOtp, openAuthModal, signOut, updateGuestProfile],
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
        onVerifyOtp={onVerifyOtp}
        onSendOtp={onSendOtp}
        onForgotPassword={onForgotPassword}
        onResetPassword={onResetPassword}
        onSwitchMode={onSwitchMode}
        open={isModalOpen}
        pending={isPending}
        prefillEmail={guest?.email ?? ""}
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
