"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { getGuestGoogleAuthUrl } from "@/lib/guest-auth-api";

type ReasonDetails = {
  title: string;
  description: string;
};

const reasonMap: Record<string, ReasonDetails> = {
  callback_failed: {
    title: "Google Login Could Not Be Completed",
    description: "We could not finish the callback handshake. This is usually a temporary server-side issue.",
  },
  auth_failed: {
    title: "Google Authentication Failed",
    description: "We could not exchange the Google sign-in response for your account session. Please try again.",
  },
  login_failed: {
    title: "Account Login Could Not Be Completed",
    description: "Google sign-in succeeded, but we could not finish creating your account session. Please try again.",
  },
  missing_token: {
    title: "Google Login Did Not Return A Token",
    description: "Google sign-in finished, but no session token reached the app.",
  },
  unknown: {
    title: "Login Could Not Be Completed",
    description: "Something interrupted sign-in before your session was created.",
  },
};

export default function GoogleAuthErrorPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "unknown";
  const reasonDetails = reasonMap[reason] ?? reasonMap.unknown;

  return (
    <section className="vh-section py-20 pt-28 md:pt-32">
      <div className="vh-container">
        <div className="mx-auto max-w-[560px] rounded-[14px] border border-[#ff2e62]/45 bg-[#2a1118] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
          <h1 className="text-3xl font-bold uppercase tracking-[1px] text-white">{reasonDetails.title}</h1>
          <p className="mt-3 text-white/80">{reasonDetails.description}</p>
          <p className="mt-2 text-sm text-white/60">Reason: {reason}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--vh-pink)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--vh-pink-soft)]"
              onClick={() => {
                window.location.href = getGuestGoogleAuthUrl();
              }}
              type="button"
            >
              Try Google Sign-In Again
            </button>

            <Link
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
              href="/"
            >
              Go To Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
