"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Flag,
  Mail,
  Phone,
  Sparkles,
  UserCircle2,
  VenusAndMars,
} from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import ReflectiveCard from "@/components/profile/reflective-card";
import { StickerTag } from "@/components/shared/sticker-tag";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { upcomingEvents } from "@/content/events";
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from "@/lib/guest-form-validation";

type EventCardsProps = {
  events: typeof upcomingEvents;
  accent: string;
  border: string;
};

function EventCards({ events, accent, border }: EventCardsProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl p-3" style={{ backgroundColor: "rgba(0,0,0,0.26)" }}>
      <div className="grid h-full grid-rows-[1fr_auto] gap-3">
        <div className="grid min-h-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.title}
              href={event.href}
              className="group relative block min-h-[190px] overflow-hidden rounded-2xl border shadow-[0_14px_32px_rgba(0,0,0,0.35)]"
              style={{ borderColor: border }}
            >
              <ImageWithFallback alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={event.image} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="line-clamp-2 text-sm font-bold leading-5 text-white">{event.title}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-white/75">{event.time}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-center pb-1">
          <Button
            onClick={() => (window.location.href = "/events")}
            className="h-9 rounded-full px-4 text-xs font-bold uppercase tracking-[0.12em] text-white hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            View All Events
          </Button>
        </div>
      </div>
    </div>
  );
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

const CORAL_THEME = {
  label: "Red",
  accent: "#c62828",
  accentMuted: "#8e1b1b",
  accentSoft: "rgba(198, 40, 40, 0.16)",
  panel: "rgba(198, 40, 40, 0.08)",
  panelStrong: "rgba(198, 40, 40, 0.12)",
  border: "rgba(198, 40, 40, 0.44)",
  text: "#fff4ef",
  chip: "rgba(255, 255, 255, 0.06)",
  glow: "rgba(198, 40, 40, 0.24)",
};

export default function ProfilePage() {
  const router = useRouter();
  const { guest, isAuthenticated, isRestoringSession, openAuthModal, updateGuestProfile, signOut } = useGuestAuth();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(guest?.name ?? "");
  const [email, setEmail] = useState(guest?.email ?? "");
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [birthDate, setBirthDate] = useState(guest?.birthDate ?? "");
  const [nationality, setNationality] = useState(guest?.nationality ?? "");
  const [fromLocation, setFromLocation] = useState(guest?.location ?? "");
  const [gender, setGender] = useState(guest?.gender ?? "");
  const [error, setError] = useState<string | null>(null);
  const guestId = guest?.id;

  const passportId = useMemo(() => {
    return buildPassportId(guestId ?? "guest", guest?.created_at ?? "2021-09-15");
  }, [guest?.created_at, guestId]);

  const featuredEvents = useMemo(() => upcomingEvents.slice(0, 3), []);

  const theme = CORAL_THEME;

  useEffect(() => {
    if (isRestoringSession || isAuthenticated) {
      return;
    }

    openAuthModal("signin");
    router.replace("/");
  }, [isAuthenticated, isRestoringSession, openAuthModal, router]);

  useEffect(() => {
    if (!rootRef.current || !guestId || isRestoringSession || !isAuthenticated) {
      return;
    }

    const root = rootRef.current;

    const context = gsap.context(() => {
      const hero = root.querySelector("[data-gsap='hero']");
      const side = root.querySelector("[data-gsap='side']");
      const details = root.querySelector("[data-gsap='details']");
      const fields = root.querySelectorAll(".vh-field-enter");

      if (hero) {
        gsap.fromTo(hero, { y: 22, opacity: 0, scale: 0.985 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" });
      }

      if (side) {
        gsap.fromTo(side, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.72, ease: "power3.out", delay: 0.08 });
      }

      if (details) {
        gsap.fromTo(details, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: "power3.out", delay: 0.16 });
      }

      if (fields.length > 0) {
        gsap.fromTo(fields, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, ease: "power2.out", stagger: 0.045, delay: 0.08 });
      }
    }, rootRef);

    return () => context.revert();
  }, [guestId, isAuthenticated, isEditing, isRestoringSession]);

  if (isRestoringSession) {
    return (
      <section className="vh-section py-20 pt-28 md:pt-32">
        <div className="vh-container">
          <div className="mx-auto w-full max-w-[1060px] space-y-5 rounded-[20px] bg-white/[0.02] p-4 md:p-6">
            <Skeleton className="h-10 w-56 rounded-full bg-white/10" />
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Skeleton className="h-[280px] rounded-2xl bg-white/8" />
              <Skeleton className="h-[280px] rounded-2xl bg-white/8" />
            </div>
            <Skeleton className="h-[320px] rounded-2xl bg-white/8" />
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated || !guest) {
    return (
      <section className="vh-section py-20 pt-28 md:pt-32">
        <div className="vh-container">
          <div className="mx-auto w-full max-w-[560px] space-y-4 rounded-[16px] bg-white/[0.03] p-6">
            <Skeleton className="mx-auto h-8 w-48 rounded-full bg-white/10" />
            <Skeleton className="h-14 w-full rounded-xl bg-white/8" />
            <Skeleton className="h-14 w-full rounded-xl bg-white/8" />
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
    setNationality(guest.nationality ?? "");
    setFromLocation(guest.location ?? "");
    setGender(guest.gender ?? "");
    setError(null);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const normalizedName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedName) {
      setError("Name is required.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!isValidPhone(normalizedPhone, { optional: true })) {
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

    updateGuestProfile({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone || null,
      birthDate: birthDate || null,
      location: fromLocation.trim() || null,
      nationality: nationality.trim() || null,
      gender: gender || null,
    });

    setIsEditing(false);
    setError(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  return (
    <section ref={rootRef} className="vh-section relative overflow-x-hidden pt-28 pb-8 md:pt-32 md:pb-10">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -left-24 top-32 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: theme.glow }} />
        <div className="absolute -right-20 top-52 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: theme.accentSoft }} />
        <div className="absolute left-1/2 top-20 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl" style={{ backgroundColor: theme.accentSoft }} />
      </div>

      <div className="vh-container">
        <div
          className="relative mx-auto w-full max-w-[1060px] overflow-hidden rounded-[20px] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          style={{
            backgroundColor: "rgba(18, 16, 20, 0.96)",
          }}
        >
          <header className="flex items-center justify-between border-b border-white/10 bg-[rgba(20,16,18,0.62)] px-4 py-3 backdrop-blur-sm md:px-6 md:py-4 vh-reveal">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
              style={{ color: theme.accent }}
              onClick={() => router.back()}
              type="button"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="text-center">
              <p className="font-['Caveat'] text-xl md:text-2xl" style={{ color: theme.accentMuted }}>
                Your signature guest identity
              </p>
              <h1 className="font-['Space_Grotesk'] text-lg font-bold uppercase tracking-[0.12em] text-slate-100 md:text-xl">
                Daily Social Passport
              </h1>
            </div>

            <div className="h-10 w-10" aria-hidden="true" />
          </header>

          <div className="space-y-8 px-4 py-6 md:px-6 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <article
                data-gsap="hero"
                className="relative overflow-visible rounded-2xl px-3 py-3 vh-reveal vh-delay-2"
                style={{ backgroundColor: theme.panel }}
              >
                <div className="absolute -top-3 right-0 z-30">
                  <StickerTag
                    label="Verified Guest"
                    bg={theme.accent}
                    text="#ffffff"
                    rotate="rotate-[8deg]"
                    className="rounded-[3px] border-2 border-[var(--vh-surface-2)] px-2 py-1 text-[9px] font-bold not-italic uppercase shadow-[0_3px_8px_rgba(0,0,0,0.22)]"
                  />
                </div>

                <div className="mx-auto w-full max-w-[320px]">
                  <ReflectiveCard
                    name={guest.name.toUpperCase()}
                    roleLabel="The Daily Passport"
                    idLabel={passportId}
                    overlayColor="rgba(0, 0, 0, 0.2)"
                    blurStrength={12}
                    glassDistortion={30}
                    metalness={1}
                    roughness={0.75}
                    displacementStrength={20}
                    noiseScale={1}
                    specularConstant={5}
                    grayscale={0.15}
                    color="#ffffff"
                    useCamera={false}
                    className="h-[440px] w-full"
                  />
                </div>
              </article>

              <section
                data-gsap="side"
                className="relative min-h-[452px] rounded-2xl p-2 vh-reveal vh-delay-3"
                style={{ backgroundColor: theme.panelStrong }}
              >
                <div className="absolute -top-2 right-0 z-20">
                  <StickerTag
                    label="Event Gallery"
                    bg={theme.accentMuted}
                    text="#ffffff"
                    rotate="rotate-[10deg]"
                    className="rounded-[3px] border-2 border-[var(--vh-surface-2)] px-2 py-1 text-[9px] font-bold not-italic uppercase"
                  />
                </div>

                <div className="flex h-full w-full flex-col">
                  <h3 className="text-center font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.16em] text-white/85">
                    Upcoming Experiences
                  </h3>
                  <div className="mt-2 min-h-0 flex-1">
                    <EventCards events={featuredEvents} accent={theme.accent} border={theme.border} />
                  </div>
                </div>
              </section>
            </div>

            <section data-gsap="details" className="rounded-2xl p-4 md:p-5 vh-reveal vh-delay-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-['Space_Grotesk'] text-base font-bold uppercase tracking-[0.14em] text-white/90">
                  Profile Screen
                </h3>
                <StickerTag
                  label="Premium Guest"
                  bg={theme.accentMuted}
                  text="#ffffff"
                  rotate="rotate-[10deg]"
                  className="rounded-[3px] border-2 border-[var(--vh-surface-2)] px-2 py-1 text-[9px] font-bold not-italic uppercase"
                />
              </div>

              {!isEditing ? (
                <>
                  <div className="grid gap-3 text-sm text-white/85 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { icon: <UserCircle2 className="h-3.5 w-3.5" />, label: "Full Name", value: guest.name || "Not set" },
                      { icon: <VenusAndMars className="h-3.5 w-3.5" />, label: "Gender", value: guest.gender || "Not set" },
                      { icon: <CalendarDays className="h-3.5 w-3.5" />, label: "Date Of Birth", value: guest.birthDate || "Not set" },
                      { icon: <Flag className="h-3.5 w-3.5" />, label: "Nationality", value: guest.nationality || "Not set" },
                      { icon: <Phone className="h-3.5 w-3.5" />, label: "Phone", value: guest.phone || "Not set" },
                      { icon: <Mail className="h-3.5 w-3.5" />, label: "Email", value: guest.email || "Not set" },
                    ].map((field, index) => (
                      <div key={field.label} className="rounded-lg border px-3 py-3 vh-field-enter" style={{ borderColor: theme.border, backgroundColor: theme.chip, animationDelay: `${index * 70}ms` }}>
                        <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                          <span style={{ color: theme.accent }}>{field.icon}</span>
                          {field.label}
                        </p>
                        <p className="font-semibold text-white">{field.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button onClick={startEdit} className="rounded-lg text-white hover:opacity-90" style={{ backgroundColor: theme.accentMuted }}>
                      <Sparkles className="h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={signOut}
                      variant="outline"
                      className="rounded-lg hover:bg-white/5"
                      style={{ borderColor: theme.border, color: theme.accent }}
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <section className="vh-panel-soft rounded-lg border border-white/10 p-4 vh-field-enter" style={{ animationDelay: "120ms" }}>
                  <p className="mb-4 font-['Caveat'] text-2xl leading-none" style={{ color: theme.accent }}>
                    Fine tune your daily passport details
                  </p>

                  <div className="space-y-3">
                    <label className="block vh-field-enter" style={{ animationDelay: "70ms" }}>
                    <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Full Name
                    </span>
                    <input
                      className="w-full rounded-md border bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:-translate-y-0.5"
                      style={{ borderColor: theme.border }}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      value={name}
                      placeholder="Your name"
                    />
                  </label>

                  <label className="block vh-field-enter" style={{ animationDelay: "110ms" }}>
                    <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Email
                    </span>
                    <input
                      className="w-full rounded-md border bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:-translate-y-0.5"
                      style={{ borderColor: theme.border }}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      value={email}
                      placeholder="your@email.com"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block vh-field-enter" style={{ animationDelay: "150ms" }}>
                      <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                        Gender
                      </span>
                      <select
                        className="w-full rounded-md border bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:-translate-y-0.5"
                        style={{ borderColor: theme.border }}
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

                    <label className="block vh-field-enter" style={{ animationDelay: "190ms" }}>
                      <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                        Date Of Birth
                      </span>
                      <input
                        className="w-full rounded-md border bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:-translate-y-0.5"
                        style={{ borderColor: theme.border }}
                        onChange={(e) => setBirthDate(e.target.value)}
                        type="date"
                        value={birthDate}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block vh-field-enter" style={{ animationDelay: "230ms" }}>
                      <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                        Nationality
                      </span>
                      <input
                        className="w-full rounded-md border bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:-translate-y-0.5"
                        style={{ borderColor: theme.border }}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="Your nationality"
                        type="text"
                        value={nationality}
                      />
                    </label>
                  </div>

                  <label className="block vh-field-enter" style={{ animationDelay: "310ms" }}>
                    <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Phone
                    </span>
                    <input
                      className="w-full rounded-md border bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:-translate-y-0.5"
                      style={{ borderColor: theme.border }}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Optional"
                      type="tel"
                      value={phone}
                    />
                  </label>

                  <label className="block vh-field-enter" style={{ animationDelay: "390ms" }}>
                    <span className="mb-1 block font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                      Location
                    </span>
                    <input
                      className="w-full rounded-md border bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:-translate-y-0.5"
                      style={{ borderColor: theme.border }}
                      onChange={(e) => setFromLocation(e.target.value)}
                      placeholder="City, Country"
                      type="text"
                      value={fromLocation}
                    />
                  </label>
                </div>

                {error ? (
                  <div className="mt-3 rounded-md border border-[var(--vh-pink)]/40 bg-[var(--vh-pink)]/10 px-3 py-2 text-xs text-[#FDECEC]">
                    {error}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button onClick={saveEdit} className="rounded-lg text-black hover:opacity-90" style={{ backgroundColor: theme.accent }}>
                    Save Profile
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" className="rounded-lg">
                    Cancel
                  </Button>
                </div>
              </section>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
