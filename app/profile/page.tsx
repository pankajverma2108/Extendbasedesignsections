"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Crown, Sparkles } from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { StickerTag } from "@/components/shared/sticker-tag";
import { Button } from "@/components/ui/button";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

function getSeasonFromDate(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}

function buildPassportId(seed: string, createdAt: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const digits = String(hash % 1000).padStart(3, "0");
  const letters = [
    alphabet[(hash >> 5) % 26],
    alphabet[(hash >> 10) % 26],
    alphabet[(hash >> 15) % 26],
  ].join("");
  const year = new Date(createdAt).getFullYear() || new Date().getFullYear();

  return `VP-${digits}-${letters}-${year}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { guest, isAuthenticated, isRestoringSession, openAuthModal, updateGuestProfile, signOut } = useGuestAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(guest?.name ?? "");
  const [email, setEmail] = useState(guest?.email ?? "");
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [birthDate, setBirthDate] = useState(guest?.birthDate ?? "");
  const [fromLocation, setFromLocation] = useState(guest?.location ?? "");
  const [gender, setGender] = useState(guest?.gender ?? "");
  const [prefersEmail, setPrefersEmail] = useState(guest?.prefersEmail ?? true);
  const [prefersPhone, setPrefersPhone] = useState(guest?.prefersPhone ?? false);
  const [error, setError] = useState<string | null>(null);

  const memberSinceText = useMemo(() => {
    const date = new Date(guest?.created_at || "2021-09-15");
    const season = getSeasonFromDate(date);
    const year = date.getFullYear();
    return `Member since ${season} ${year}`;
  }, [guest?.created_at]);

  const passportId = useMemo(() => {
    return buildPassportId(guest?.id ?? "guest", guest?.created_at ?? "2021-09-15");
  }, [guest?.created_at, guest?.id]);

  const communicationPreference = useMemo(() => {
    const channels = [
      guest?.prefersEmail ? "Email" : null,
      guest?.prefersPhone ? "Phone" : null,
    ].filter(Boolean);

    return channels.length > 0 ? channels.join(" + ") : "Not set";
  }, [guest?.prefersEmail, guest?.prefersPhone]);

  useEffect(() => {
    if (isRestoringSession || isAuthenticated) {
      return;
    }

    openAuthModal("signin");
    router.replace("/");
  }, [isAuthenticated, isRestoringSession, openAuthModal, router]);

  if (isRestoringSession) {
    return (
      <section className="vh-section py-20 pt-28 md:pt-32">
        <div className="vh-container">
          <div className="text-center text-white/75">Loading your vibe passport...</div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated || !guest) {
    return (
      <section className="vh-section py-20 pt-28 md:pt-32">
        <div className="vh-container">
          <div className="mx-auto max-w-[520px] rounded-[12px] border border-white/15 bg-white/5 p-8 text-center">
            <h1 className="text-3xl font-bold uppercase tracking-[1px] text-white">Vibe Passport</h1>
            <p className="mt-2 text-white/75">Redirecting you to sign in...</p>
          </div>
        </div>
      </section>
    );
  }

  const startEdit = () => {
    setName(guest.name);
    setEmail(guest.email);
    setPhone(guest.phone ?? "");
    setBirthDate(guest.birthDate ?? "");
    setFromLocation(guest.location ?? "");
    setGender(guest.gender ?? "");
    setPrefersEmail(guest.prefersEmail ?? true);
    setPrefersPhone(guest.prefersPhone ?? false);
    setError(null);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (!normalizedName) {
      setError("Name is required.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    if (birthDate) {
      const dateValue = new Date(`${birthDate}T00:00:00`);
      const now = new Date();

      if (Number.isNaN(dateValue.getTime()) || dateValue > now) {
        setError("Born on date must be valid and not in the future.");
        return;
      }
    }

    if (!prefersEmail && !prefersPhone) {
      setError("Select at least one communication preference.");
      return;
    }

    updateGuestProfile({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone || null,
      birthDate: birthDate || null,
      location: fromLocation.trim() || null,
      gender: gender || null,
      prefersEmail,
      prefersPhone,
    });

    setIsEditing(false);
    setError(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  return (
    <section className="vh-section pt-28 pb-20 md:pt-32">
      <div className="vh-container">
        <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-[14px] border border-[var(--vh-pink)]/20 bg-[var(--vh-section-b)] shadow-[0_24px_60px_rgba(0,0,0,0.36)]">
          <header className="flex items-center justify-between border-b border-white/10 bg-[rgba(35,15,20,0.8)] px-4 py-3 backdrop-blur-sm">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--vh-pink)] hover:bg-white/10"
              onClick={() => router.back()}
              type="button"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <h1 className="font-['Space_Grotesk'] text-lg font-bold uppercase tracking-[0.12em] text-slate-100">
              Vibe Passport
            </h1>

            <div className="h-10 w-10" aria-hidden="true" />
          </header>

          <div className="space-y-8 px-4 py-6 md:px-6">
            {/* Section: Profile Hero Card */}
            <article className="relative overflow-visible rounded-xl border border-[var(--vh-pink)]/25 bg-[rgba(255,46,98,0.06)] px-5 py-6">
              <div className="pointer-events-none absolute right-[1px] left-[1px] top-[1px] h-[5px] rounded-t-[10px] bg-gradient-to-r from-[var(--vh-cyan)] via-[var(--vh-pink)] to-[var(--vh-lime)]" />
              <div className="absolute -top-3 right-0 z-30">
                <StickerTag
                  label="Verified Vibe"
                  bg="#39FF14"
                  text="#000000"
                  rotate="rotate-[13deg]"
                  className="rounded-[3px] border-2 border-[var(--vh-surface-2)] px-2 py-1 text-[9px] font-bold not-italic uppercase shadow-[0_3px_8px_rgba(0,0,0,0.22)]"
                />
              </div>

              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center rounded-xl border-4 border-[var(--vh-pink)] bg-gradient-to-br from-[var(--vh-pink)] to-[var(--vh-pink-soft)] text-5xl font-extrabold text-white">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -right-1 -bottom-1 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--vh-section-b)] bg-[var(--vh-cyan)] text-black">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="text-center">
                  <h2 className="font-['Space_Grotesk'] text-3xl font-bold leading-none text-slate-100">{guest.name}</h2>
                  {/* <p className="mt-2 font-['Space_Grotesk'] text-[13px] font-medium uppercase tracking-[0.22em] text-[var(--vh-pink)]">
                    Global Nomad
                  </p> */}
                  <p className="mt-3 font-mono text-xs text-slate-400">ID: {passportId}</p>
                </div>
              </div>
            </article>

            {/* Section: Member Since Tag */}
            <div className="relative flex items-center justify-center">
              <div className="vh-rot-3 relative inline-flex items-center gap-2 rounded-xl bg-[#1E293B] px-5 py-2 text-sm text-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-2 outline-[rgba(255,46,98,0.40)] -outline-offset-2">
                <Crown className="h-4 w-4 text-[var(--vh-pink)]" />
                <span className="font-['Caveat'] text-lg">{memberSinceText}</span>
              </div>
            </div>

            {/* Section: Passport Details */}
            <section className="rounded-lg border border-white/12 bg-white/[0.04] p-4">
              <h3 className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.14em] text-white/85">
                Passport Details
              </h3>
              <div className="mt-3 grid gap-3 text-sm text-white/80 sm:grid-cols-2">
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Born On</p>
                  <p className="mt-1 font-semibold text-white">{guest.birthDate || "Not set"}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">I Am From</p>
                  <p className="mt-1 font-semibold text-white">{guest.location || "Not set"}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Gender</p>
                  <p className="mt-1 font-semibold text-white">{guest.gender || "Not set"}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Communication</p>
                  <p className="mt-1 font-semibold text-white">{communicationPreference}</p>
                </div>
              </div>
            </section>

            {/* Section: Vibe Notes */}
            <section className="relative rounded-lg border border-[var(--vh-cyan)]/35 bg-[rgba(0,240,255,0.08)] p-4">
              <div className="absolute -top-2 right-0 z-10">
                <StickerTag
                  label="Top Guest"
                  bg="#FF2E62"
                  text="#FFFFFF"
                  rotate="rotate-[10deg]"
                  className="rounded-[3px] border-2 border-[var(--vh-surface-2)] px-2 py-1 text-[9px] font-bold not-italic uppercase shadow-[0_3px_8px_rgba(0,0,0,0.22)]"
                />
              </div>
              <h3 className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.14em] text-[var(--vh-cyan)]">
                Vibe Notes
              </h3>
              <p className="mt-3 font-['Caveat'] text-2xl leading-8 text-slate-200">
                Always asks for extra pillows. Loves local coffee recommendations. Prefers sunrise views over sunset.
              </p>
            </section>

            {/* Section: Profile Actions */}
            {!isEditing ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button onClick={startEdit} className="rounded-lg bg-[var(--vh-cyan)] text-black hover:opacity-90">
                  <Sparkles className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button onClick={signOut} variant="outline" className="rounded-lg border-[var(--vh-pink)] text-[var(--vh-pink)] hover:bg-[var(--vh-pink)]/10">
                  Logout
                </Button>
              </div>
            ) : (
              /* Section: Edit Profile Form */
              <section className="vh-panel-soft rounded-lg p-4">
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Full Name
                    </span>
                    <input
                      className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--vh-pink)]"
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      value={name}
                      placeholder="Your name"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Email
                    </span>
                    <input
                      className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--vh-pink)]"
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      value={email}
                      placeholder="your@email.com"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Phone
                    </span>
                    <input
                      className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--vh-pink)]"
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Optional"
                      type="tel"
                      value={phone}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                        Born On
                      </span>
                      <input
                        className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--vh-pink)]"
                        onChange={(e) => setBirthDate(e.target.value)}
                        type="date"
                        value={birthDate}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                        I Am From
                      </span>
                      <input
                        className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--vh-pink)]"
                        onChange={(e) => setFromLocation(e.target.value)}
                        placeholder="City, Country"
                        type="text"
                        value={fromLocation}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Gender
                    </span>
                    <select
                      className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--vh-pink)]"
                      onChange={(e) => setGender(e.target.value)}
                      value={gender}
                    >
                      <option className="bg-[var(--vh-surface-2)] text-white" value="">
                        Select
                      </option>
                      <option className="bg-[var(--vh-surface-2)] text-white" value="Female">
                        Female
                      </option>
                      <option className="bg-[var(--vh-surface-2)] text-white" value="Male">
                        Male
                      </option>
                      <option className="bg-[var(--vh-surface-2)] text-white" value="Non-binary">
                        Non-binary
                      </option>
                      <option className="bg-[var(--vh-surface-2)] text-white" value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </label>

                  <div className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-3">
                    <p className="mb-2 font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Communication Preferences
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-white/85">
                      <label className="inline-flex items-center gap-2">
                        <input
                          checked={prefersEmail}
                          className="h-4 w-4 accent-[var(--vh-pink)]"
                          onChange={(e) => setPrefersEmail(e.target.checked)}
                          type="checkbox"
                        />
                        Email
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          checked={prefersPhone}
                          className="h-4 w-4 accent-[var(--vh-cyan)]"
                          onChange={(e) => setPrefersPhone(e.target.checked)}
                          type="checkbox"
                        />
                        Phone
                      </label>
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="mt-3 rounded-md border border-[var(--vh-pink)]/40 bg-[var(--vh-pink)]/10 px-3 py-2 text-xs text-[#FFD3DF]">
                    {error}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button onClick={saveEdit} className="rounded-lg bg-[var(--vh-pink)]">
                    Save
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" className="rounded-lg">
                    Cancel
                  </Button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
