"use client";

import { useEffect } from "react";

import { getGuestMe, setStoredGuestToken } from "@/lib/guest-auth-api";

export default function GoogleAuthSuccessPage() {
  useEffect(() => {
    let cancelled = false;

    const finalizeGoogleLogin = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get("token") ?? searchParams.get("access_token");

      if (!token) {
        window.location.replace("/auth/google/error?reason=missing_token");
        return;
      }

      setStoredGuestToken(token, true);

      try {
        await getGuestMe(token);

        if (!cancelled) {
          window.location.replace("/");
        }
      } catch (error) {
        const detail =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "The returned Google session token was rejected by /guest/auth/me.";

        if (!cancelled) {
          window.location.replace(
            `/auth/google/error?reason=session_validation_failed&detail=${encodeURIComponent(detail)}`,
          );
        }
      }
    };

    void finalizeGoogleLogin();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="vh-section py-20 pt-28 md:pt-32">
      <div className="vh-container">
        <div className="mx-auto max-w-[520px] rounded-[12px] border border-white/15 bg-white/5 p-8 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-[1px] text-white">Signing You In</h1>
          <p className="mt-2 text-white/75">Finalizing your Google login...</p>
        </div>
      </div>
    </section>
  );
}
