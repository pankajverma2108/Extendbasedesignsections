"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarDays,
  Check,
  Coffee,
  CreditCard,
  Gift,
  House,
  MapPin,
  Minus,
  Phone,
  Plus,
  PlusCircle,
  Shield,
  Sparkles,
  Star,
  User,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
} from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { StickerTag } from "@/components/shared/sticker-tag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createColiveDraftBooking,
  createColivePaymentOrder,
  createColiveQuote,
  failBookingPayment,
  verifyColivePayment,
} from "@/lib/booking-api";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from "@/lib/guest-form-validation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FlowStage = "landing" | "inventory" | "property" | "checkout" | "confirmation";
type CheckoutStep = 1 | 2 | 3;
type LocationKey = "bangalore";
type StayType = "solo" | "couple" | "remote";
type AddonKey = "meals" | "laundry" | "workspace";

type ColivePlan = {
  id: string;
  title: string;
  description: string;
  eyebrow: string;
  accent: string;
  icon: typeof Wifi;
  stayType: StayType;
};

type ColiveRoom = {
  id: string;
  title: string;
  description: string;
  strikePrice: number;
  monthlyPrice: number;
  features: string[];
};

type ColiveProperty = {
  id: string;
  location: LocationKey;
  cityLabel: string;
  title: string;
  subtitle: string;
  description: string;
  heroImage: string;
  sideImage: string;
  gallery: string[];
  priceFrom: number;
  strikeFrom: number;
  rating: number;
  ratingLabel: string;
  quietLabel: string;
  mainLabel: string;
  vibeLine: string;
  longStayLine: string;
  amenities: string[];
  benefits: Array<{ title: string; description: string; accent: string }>;
  roomOptions: ColiveRoom[];
  stories: Array<{ quote: string; guest: string; stayed: string; accent: string; text: string }>;
};

type AddonOption = {
  key: AddonKey;
  title: string;
  description: string;
  monthlyPrice: number;
  accent: string;
  icon: typeof Coffee;
};

type GuestDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type GuestErrors = Partial<Record<keyof GuestDetails, string>>;

type ColivePropertyBackendMap = {
  propertyId: string;
  rooms: Record<string, string>;
};

type ColiveFlowSnapshot = {
  stage: FlowStage;
  checkoutStep: CheckoutStep;
  moveIn: string;
  duration: number;
  stayType: StayType;
  selectedPropertyId: string | null;
  selectedRoomId: string | null;
  guest: GuestDetails;
  addonQuantities: Record<AddonKey, number>;
  activeGalleryIndex: number;
  savedAt: number;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const COLIVE_FLOW_SNAPSHOT_KEY = "vh_colive_flow_snapshot";
const CANONICAL_PROPERTY_ID_REGEX = /^\d+$/;

const coliveBackendMap: Record<string, ColivePropertyBackendMap> = {
  "koramangala-a": {
    propertyId: process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_A_PROPERTY_ID?.trim() || "",
    rooms: {
      dorm: process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_A_DORM_ROOM_TYPE_ID?.trim() || "rt-ka-4dorm",
      private: process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_A_PRIVATE_ROOM_TYPE_ID?.trim() || "rt-ka-queen",
    },
  },
  "koramangala-b": {
    propertyId: process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_B_PROPERTY_ID?.trim() || "",
    rooms: {
      dorm: process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_B_DORM_ROOM_TYPE_ID?.trim() || "rt-kb-4dorm",
      private: process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_B_PRIVATE_ROOM_TYPE_ID?.trim() || "rt-kb-queen",
    },
  },
};

const coliveAddonProductMap: Record<AddonKey, string> = {
  meals: process.env.NEXT_PUBLIC_COLIVE_MEALS_PRODUCT_ID?.trim() || "",
  laundry: process.env.NEXT_PUBLIC_COLIVE_LAUNDRY_PRODUCT_ID?.trim() || "",
  workspace: process.env.NEXT_PUBLIC_COLIVE_WORKSPACE_PRODUCT_ID?.trim() || "",
};

const coliveAddonMapByProperty: Record<string, Record<AddonKey, string>> = {
  "koramangala-a": {
    meals:
      process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_A_MEALS_ADDON_ID?.trim() ||
      coliveAddonProductMap.meals ||
      "cadd-tds-ka-meals3xday",
    laundry:
      process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_A_LAUNDRY_ADDON_ID?.trim() ||
      coliveAddonProductMap.laundry ||
      "cadd-tds-ka-laundryplan",
    workspace:
      process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_A_WORKSPACE_ADDON_ID?.trim() ||
      coliveAddonProductMap.workspace ||
      "cadd-tds-ka-coworking",
  },
  "koramangala-b": {
    meals:
      process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_B_MEALS_ADDON_ID?.trim() ||
      coliveAddonProductMap.meals ||
      "cadd-tds-kb-meals3xday",
    laundry:
      process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_B_LAUNDRY_ADDON_ID?.trim() ||
      coliveAddonProductMap.laundry ||
      "cadd-tds-kb-laundryplan",
    workspace:
      process.env.NEXT_PUBLIC_COLIVE_KORAMANGALA_B_WORKSPACE_ADDON_ID?.trim() ||
      coliveAddonProductMap.workspace ||
      "cadd-tds-kb-coworking",
  },
};

function getColiveAddonId(propertyId: string, addonKey: AddonKey): string {
  const propertyAddonId = coliveAddonMapByProperty[propertyId]?.[addonKey];
  if (propertyAddonId && propertyAddonId.trim()) {
    return propertyAddonId.trim();
  }

  return coliveAddonProductMap[addonKey]?.trim() || "";
}

function readColiveFlowSnapshot(): ColiveFlowSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(COLIVE_FLOW_SNAPSHOT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ColiveFlowSnapshot>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      stage: (parsed.stage as FlowStage) || "landing",
      checkoutStep: (parsed.checkoutStep as CheckoutStep) || 1,
      moveIn: typeof parsed.moveIn === "string" ? parsed.moveIn : nextMonthDate(),
      duration: typeof parsed.duration === "number" ? Math.min(12, Math.max(1, parsed.duration)) : 3,
      stayType: (parsed.stayType as StayType) || "remote",
      selectedPropertyId: typeof parsed.selectedPropertyId === "string" ? parsed.selectedPropertyId : null,
      selectedRoomId: typeof parsed.selectedRoomId === "string" ? parsed.selectedRoomId : null,
      guest: {
        firstName: typeof parsed.guest?.firstName === "string" ? parsed.guest.firstName : "",
        lastName: typeof parsed.guest?.lastName === "string" ? parsed.guest.lastName : "",
        email: typeof parsed.guest?.email === "string" ? parsed.guest.email : "",
        phone: typeof parsed.guest?.phone === "string" ? parsed.guest.phone : "",
      },
      addonQuantities: {
        meals: typeof parsed.addonQuantities?.meals === "number" ? Math.max(0, parsed.addonQuantities.meals) : 0,
        laundry: typeof parsed.addonQuantities?.laundry === "number" ? Math.max(0, parsed.addonQuantities.laundry) : 0,
        workspace: typeof parsed.addonQuantities?.workspace === "number" ? Math.max(0, parsed.addonQuantities.workspace) : 0,
      },
      activeGalleryIndex: typeof parsed.activeGalleryIndex === "number" ? Math.max(0, parsed.activeGalleryIndex) : 0,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function clearColiveFlowSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(COLIVE_FLOW_SNAPSHOT_KEY);
}

const plans: ColivePlan[] = [
  {
    id: "workation",
    title: "Workation Pro",
    description: "Dedicated desk zones, focus corners, and a setup that respects your calendar and your coffee dependency.",
    eyebrow: "Best for Remote Workers",
    accent: "#34d5ff",
    icon: Wifi,
    stayType: "remote",
  },
  {
    id: "budget",
    title: "Social Saver",
    description: "Smart monthly pricing, community energy, and enough structure to keep the stay efficient without killing the fun.",
    eyebrow: "Best for Solo Travelers",
    accent: "#f9cb37",
    icon: House,
    stayType: "solo",
  },
  {
    id: "private",
    title: "Private Comfort",
    description: "A calmer monthly rhythm with room privacy, easy routines, and fewer reasons to negotiate with your towel.",
    eyebrow: "Best for Couples / Quiet Comfort",
    accent: "#ff7b6b",
    icon: Shield,
    stayType: "couple",
  },
];

const properties: ColiveProperty[] = [
  {
    id: "koramangala-a",
    location: "bangalore",
    cityLabel: "Koramangala, Bengaluru",
    title: "TDS - Koramangala A",
    subtitle:
      "The livelier Koramangala house for people who want work hours, dinner plans, and a social layer built into the month.",
    description:
      "A polished long-stay setup with community dinners, lounge corners, work-friendly spaces, and the kind of billing transparency that does not require emotional recovery later.",
    heroImage: "/colive/room-main.png",
    sideImage: "/colive/room-sub.png",
    gallery: ["/colive/room-main.png", "/colive/room-sub.png", "/colive/property-koramangala.png"],
    priceFrom: 18000,
    strikeFrom: 25000,
    rating: 4.8,
    ratingLabel: "120+ monthly guests",
    quietLabel: "Remote Ready",
    mainLabel: "Social Vibe",
    vibeLine: "For builders, creators, and people who somehow need both focus and banter.",
    longStayLine: "No deposit. No utility drama. Just move in, settle fast, and keep your energy for actual life decisions.",
    amenities: [
      "Superfast Speed",
      "Daily Housekeeping",
      "Community Lounge",
      "Cafe Access",
      "Laundry Support",
      "Shared Kitchen",
      "Events Calendar",
      "Power Backup",
    ],
    benefits: [
      {
        title: "Zero Deposit",
        description: "Monthly stays without locking up capital before you even meet the mattress.",
        accent: "#34d5ff",
      },
      {
        title: "All Utilities Included",
        description: "WiFi, electricity, water, and the boring essentials all sit inside one clean monthly number.",
        accent: "#f9cb37",
      },
      {
        title: "Daily Housekeeping",
        description: "Rooms and shared spaces stay maintained so the house never starts feeling like a group project.",
        accent: "#ff7b6b",
      },
      {
        title: "Built-in Community",
        description: "Mixers, outings, and low-pressure hangouts for when your laptop finally closes for the day.",
        accent: "#9bff6a",
      },
    ],
    roomOptions: [
      {
        id: "dorm",
        title: "8-Bed Mixed Dorm",
        description: "Budget-first, social, and still practical. Reading lights, lockers, curtains, and enough privacy to avoid eye contact before coffee.",
        strikePrice: 25000,
        monthlyPrice: 18000,
        features: ["Dedicated locker", "Privacy curtain", "En-suite bathroom", "Reading light"],
      },
      {
        id: "private",
        title: "Private Comfort Room",
        description: "A full private room with proper desk space, calmer energy, and enough floor to live like a human instead of a suitcase.",
        strikePrice: 45000,
        monthlyPrice: 35000,
        features: ["Private workspace", "Premium bedding", "Mini fridge", "Quiet floor"],
      },
    ],
    stories: [
      {
        quote: "I came for one month and ended up extending to four. It feels like someone finally designed a stay for people with deadlines and personalities.",
        guest: "AJ",
        stayed: "Stayed 4 months",
        accent: "#ff7b6b",
        text: "#fff7f4",
      },
      {
        quote: "Transparent pricing, useful common spaces, and no random utility shocks. That alone deserves applause.",
        guest: "SM",
        stayed: "Stayed 2 months",
        accent: "#34d5ff",
        text: "#0f172a",
      },
    ],
  },
  {
    id: "koramangala-b",
    location: "bangalore",
    cityLabel: "Koramangala, Bengaluru",
    title: "TDS - Koramangala B",
    subtitle:
      "The calmer Koramangala house with a softer day-to-day rhythm, larger work surfaces, and easy monthly routines.",
    description:
      "Built for guests who want the same Colive fundamentals in a slightly quieter setup: cleaner lines, steadier energy, and a stay that feels structured without becoming sterile.",
    heroImage: "/colive/property-koramangala.png",
    sideImage: "/colive/room-sub.png",
    gallery: ["/colive/property-koramangala.png", "/colive/room-sub.png", "/colive/room-main.png"],
    priceFrom: 20000,
    strikeFrom: 27000,
    rating: 4.7,
    ratingLabel: "80+ monthly guests",
    quietLabel: "Focus Friendly",
    mainLabel: "Quiet Routine",
    vibeLine: "For guests who want Koramangala access without a full-time front-row seat to the chaos.",
    longStayLine: "Same neighborhood, different tempo. Great for longer stays that need consistency, comfort, and zero nonsense fees.",
    amenities: [
      "Superfast Speed",
      "Housekeeping",
      "Laundry Support",
      "Shared Kitchen",
      "Work Nooks",
      "Community Lounge",
      "Filtered Water",
      "Secure Access",
    ],
    benefits: [
      {
        title: "Zero Deposit",
        description: "Keep your cash flexible instead of parking it in a security deposit black hole.",
        accent: "#34d5ff",
      },
      {
        title: "Utilities Included",
        description: "Stable monthly pricing with WiFi, utilities, and routine services already folded in.",
        accent: "#f9cb37",
      },
      {
        title: "Daily Upkeep",
        description: "The shared spaces stay tidy, the rooms stay fresh, and the house keeps its standards.",
        accent: "#ff7b6b",
      },
      {
        title: "Koramangala Access",
        description: "Close to cafes, work hubs, daily essentials, and the sort of food options that ruin discipline.",
        accent: "#9bff6a",
      },
    ],
    roomOptions: [
      {
        id: "dorm",
        title: "6-Bed Social Dorm",
        description: "A calmer shared setup with tighter occupancy, study-friendly corners, and enough breathing room for a longer routine.",
        strikePrice: 29000,
        monthlyPrice: 20000,
        features: ["Dedicated locker", "Study bay", "Fresh linen", "Calmer layout"],
      },
      {
        id: "private",
        title: "Private Comfort Room",
        description: "A bright private room with larger desk space, strong utility coverage, and a workflow-friendly layout.",
        strikePrice: 47000,
        monthlyPrice: 36000,
        features: ["Work desk", "Quiet floor", "En-suite bath", "Housekeeping"],
      },
    ],
    stories: [
      {
        quote: "This one feels quieter without losing the community angle. Great if you want your month to be smooth and not performative.",
        guest: "RK",
        stayed: "Stayed 3 months",
        accent: "#9bff6a",
        text: "#12210c",
      },
      {
        quote: "A monthly stay that manages to look good, run cleanly, and avoid surprise charges. Rare combination.",
        guest: "DV",
        stayed: "Stayed 2 months",
        accent: "#f9cb37",
        text: "#201a08",
      },
    ],
  },
];

const addons: AddonOption[] = [
  {
    key: "meals",
    title: "Meal Plan",
    description: "Weekday breakfast and dinner for people who would rather not negotiate with food apps every night.",
    monthlyPrice: 4500,
    accent: "#f9cb37",
    icon: UtensilsCrossed,
  },
  {
    key: "laundry",
    title: "Laundry Pack",
    description: "Washed and folded loads every month so your backpack does not become the closet.",
    monthlyPrice: 1200,
    accent: "#34d5ff",
    icon: WashingMachine,
  },
  {
    key: "workspace",
    title: "Dedicated Desk",
    description: "Reserved monitor-ready workstation inside a quieter focus zone.",
    monthlyPrice: 3000,
    accent: "#9bff6a",
    icon: Briefcase,
  },
];

const locationLabels: Record<LocationKey, string> = {
  bangalore: "Bengaluru",
};

const stayTypeLabels: Record<StayType, string> = {
  solo: "Solo traveler",
  couple: "Couple stay",
  remote: "Remote worker",
};

const durationOptions = [
  { value: 1, label: "1 Month" },
  { value: 2, label: "2 Months" },
  { value: 3, label: "3 Months" },
  { value: 6, label: "6 Months" },
];

const amenityShowcase = [
  { label: "Superfast Speed", icon: Wifi, accent: "#34d5ff" },
  { label: "Daily Housekeeping", icon: Sparkles, accent: "#ff7b6b" },
  { label: "Shared Kitchen", icon: Coffee, accent: "#f9cb37" },
  { label: "Laundry Support", icon: WashingMachine, accent: "#9bff6a" },
  { label: "Community Events", icon: CalendarDays, accent: "#34d5ff" },
  { label: "Secure Access", icon: Shield, accent: "#ff7b6b" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMoveInDate(value: string) {
  if (!value) {
    return "TBA";
  }

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "TBA";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function nextMonthDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_URL}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load payment checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load payment checkout."));
    document.body.appendChild(script);
  });
}

function validateGuest(details: GuestDetails): GuestErrors {
  const errors: GuestErrors = {};

  if (!details.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!details.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!details.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(normalizeEmail(details.email))) {
    errors.email = "Enter a valid email address.";
  }
  if (!details.phone.trim()) {
    errors.phone = "Phone is required.";
  } else if (!isValidPhone(normalizePhone(details.phone))) {
    errors.phone = "Enter a valid phone number.";
  }

  return errors;
}

function checkoutTabButtonClasses(isActive: boolean, isComplete: boolean) {
  if (isActive) {
    return "bg-[#c62828] text-white shadow-[0_8px_20px_rgba(198,40,40,0.35)] border border-[#c62828]";
  }

  if (isComplete) {
    return "bg-white/12 text-white border border-white/20";
  }

  return "bg-white/6 text-white/55 border border-white/12";
}

function InputField({
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/58">{label}</span>
      <input
        className={cn(
          "w-full rounded-[18px] border bg-[#120b13] px-4 py-4 text-white outline-none transition placeholder:text-white/28",
          error ? "border-[#ff7b6b]/70" : "border-white/10 focus:border-[#34d5ff]/70",
        )}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {error ? <span className="mt-2 block text-sm text-[#ffb6ad]">{error}</span> : null}
    </label>
  );
}

function FeatureBadge({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm"
      style={{ borderColor: `${accent}cc`, backgroundColor: "rgba(9,10,15,0.72)", color: "#f8fbff" }}
    >
      {label}
    </span>
  );
}

export function ColiveFlow({ initialLocation = "bangalore" }: { initialLocation?: string }) {
  const { guest: authGuest, isAuthenticated, isRestoringSession, openAuthModal } = useGuestAuth();
  const signinPromptedRef = useRef(false);
  const safeLocation: LocationKey = initialLocation === "bangalore" ? "bangalore" : "bangalore";
  const [stage, setStage] = useState<FlowStage>("landing");
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(1);
  const [location] = useState<LocationKey>(safeLocation);
  const [moveIn, setMoveIn] = useState(nextMonthDate);
  const [duration, setDuration] = useState(3);
  const [stayType, setStayType] = useState<StayType>("remote");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [guest, setGuest] = useState<GuestDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [guestErrors, setGuestErrors] = useState<GuestErrors>({});
  const [addonQuantities, setAddonQuantities] = useState<Record<AddonKey, number>>({
    meals: 0,
    laundry: 0,
    workspace: 0,
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedReservationId, setConfirmedReservationId] = useState<string | null>(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  useEffect(() => {
    const snapshot = readColiveFlowSnapshot();
    if (!snapshot) {
      return;
    }

    if (Date.now() - snapshot.savedAt > 1000 * 60 * 60 * 12) {
      clearColiveFlowSnapshot();
      return;
    }

    setStage(snapshot.stage);
    setCheckoutStep(snapshot.checkoutStep);
    setMoveIn(snapshot.moveIn);
    setDuration(snapshot.duration);
    setStayType(snapshot.stayType);
    setSelectedPropertyId(snapshot.selectedPropertyId);
    setSelectedRoomId(snapshot.selectedRoomId);
    setGuest(snapshot.guest);
    setAddonQuantities(snapshot.addonQuantities);
    setActiveGalleryIndex(snapshot.activeGalleryIndex);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshot: ColiveFlowSnapshot = {
      stage,
      checkoutStep,
      moveIn,
      duration,
      stayType,
      selectedPropertyId,
      selectedRoomId,
      guest,
      addonQuantities,
      activeGalleryIndex,
      savedAt: Date.now(),
    };

    window.sessionStorage.setItem(COLIVE_FLOW_SNAPSHOT_KEY, JSON.stringify(snapshot));
  }, [activeGalleryIndex, addonQuantities, checkoutStep, duration, guest, moveIn, selectedPropertyId, selectedRoomId, stage, stayType]);

  useEffect(() => {
    if (!showMobileSummary) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobileSummary]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage, checkoutStep]);

  useEffect(() => {
    if (!authGuest) {
      return;
    }

    const [firstName = "", ...rest] = (authGuest.name || "").trim().split(/\s+/);
    setGuest((current) => ({
      firstName: current.firstName.trim() || firstName,
      lastName: current.lastName.trim() || rest.join(" "),
      email: current.email.trim() || (authGuest.email || ""),
      phone: current.phone.trim() || (authGuest.phone || ""),
    }));
  }, [authGuest]);

  useEffect(() => {
    if (stage !== "checkout" || checkoutStep !== 1) {
      signinPromptedRef.current = false;
      return;
    }

    if (isRestoringSession || isAuthenticated || signinPromptedRef.current) {
      return;
    }

    signinPromptedRef.current = true;
    openAuthModal("signin");
    toast.info("Sign in required", {
      description: "Please sign in to continue checkout.",
    });
  }, [checkoutStep, isAuthenticated, isRestoringSession, openAuthModal, stage]);

  const filteredProperties = useMemo(
    () => properties.filter((property) => property.location === location),
    [location],
  );

  const selectedProperty = useMemo(
    () => filteredProperties.find((property) => property.id === selectedPropertyId) ?? filteredProperties[0] ?? properties[0],
    [filteredProperties, selectedPropertyId],
  );

  const selectedRoom = useMemo(
    () => selectedProperty.roomOptions.find((room) => room.id === selectedRoomId) ?? null,
    [selectedProperty, selectedRoomId],
  );

  const galleryImages = selectedProperty.gallery.length > 0 ? selectedProperty.gallery : [selectedProperty.heroImage];
  const activeImage = galleryImages[activeGalleryIndex] ?? galleryImages[0];
  const months = duration;
  const roomCharges = (selectedRoom?.monthlyPrice ?? 0) * months;
  const addonLineItems = addons.map((addon) => ({
    ...addon,
    quantity: addonQuantities[addon.key],
    total: addon.monthlyPrice * addonQuantities[addon.key] * months,
  }));
  const grandTotal = roomCharges + addonLineItems.reduce((sum, item) => sum + item.total, 0);

  function updateGuestField(field: keyof GuestDetails, rawValue: string) {
    const value = field === "email" ? normalizeEmail(rawValue) : field === "phone" ? normalizePhone(rawValue) : rawValue;

    setGuest((current) => {
      const next = { ...current, [field]: value };
      const nextErrors = validateGuest(next);

      setGuestErrors((previous) => {
        if (!previous[field]) {
          return previous;
        }

        const updated = { ...previous };
        const nextError = nextErrors[field];

        if (!nextError) {
          delete updated[field];
        } else {
          updated[field] = nextError;
        }

        return updated;
      });

      return next;
    });
  }

  function handleSearch() {
    setStage("inventory");
  }

  function handleOpenProperty(propertyId: string) {
    setSelectedPropertyId(propertyId);
    setSelectedRoomId(null);
    setActiveGalleryIndex(0);
    setStage("property");
  }

  function updateAddon(addonKey: AddonKey, delta: number) {
    setAddonQuantities((current) => ({
      ...current,
      [addonKey]: Math.max(0, current[addonKey] + delta),
    }));
  }

  function continueFromGuestDetails() {
    const errors = validateGuest(guest);
    setGuestErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setCheckoutError(null);
    setCheckoutStep(2);
  }

  async function handleConfirmAndPay() {
    if (!selectedRoom) {
      setCheckoutError("Please select a room before continuing to payment.");
      return;
    }

    const validationErrors = validateGuest(guest);
    setGuestErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setCheckoutError("Please fix guest details before payment.");
      setCheckoutStep(1);
      return;
    }

    const token = getStoredGuestToken();
    if (!token) {
      setCheckoutError("Please sign in to complete your booking payment.");
      toast.info("Sign in required", { description: "Please sign in to proceed with payment." });
      openAuthModal("signin");
      return;
    }

    const propertyConfig = coliveBackendMap[selectedProperty.id];
    const backendPropertyId = propertyConfig?.propertyId || "";
    const backendRoomTypeId = propertyConfig?.rooms[selectedRoom.id] || "";

    if (!backendPropertyId || !backendRoomTypeId) {
      setCheckoutError("Could not resolve room mapping for this property. Please reselect your property and room once.");
      return;
    }

    if (!CANONICAL_PROPERTY_ID_REGEX.test(backendPropertyId)) {
      setCheckoutError("Property mapping is not configured for live booking. Please contact support.");
      return;
    }

    const selectedAddons = addons
      .map((addon) => ({
        addon,
        quantity: addonQuantities[addon.key],
        addonId: getColiveAddonId(selectedProperty.id, addon.key),
      }))
      .filter((item) => item.quantity > 0 && item.addonId)
      .map((item) => ({ addon_id: item.addonId, quantity: item.quantity }));

    setIsSubmittingPayment(true);
    setCheckoutError(null);

    try {
      const quote = await createColiveQuote(token, {
        property_id: backendPropertyId,
        room_type_id: backendRoomTypeId,
        move_in_date: moveIn,
        duration_months: duration,
        stay_type: stayType,
        addons: selectedAddons,
        coupon_code: null,
      });

      const draftBooking = await createColiveDraftBooking(token, {
        quote_id: quote.quote_id,
        property_id: backendPropertyId,
        room_type_id: backendRoomTypeId,
        move_in_date: moveIn,
        duration_months: duration,
        stay_type: stayType,
        guest_details: {
          first_name: guest.firstName.trim(),
          last_name: guest.lastName.trim(),
          email: normalizeEmail(guest.email),
          phone: normalizePhone(guest.phone),
        },
        addons: selectedAddons,
        source: "web_colive_flow",
        notes: null,
      });

      const paymentOrder = await createColivePaymentOrder(token, {
        draft_booking_id: draftBooking.draft_booking_id,
        grand_total: quote.charges.grand_total,
        currency: quote.currency || "INR",
      });

      await loadRazorpayCheckout();

      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        throw new Error("Payment checkout failed to initialize.");
      }

      await new Promise<void>((resolve, reject) => {
        const razorpay = new Razorpay({
          key: paymentOrder.razorpay_key,
          amount: paymentOrder.amount_paise,
          currency: paymentOrder.currency,
          name: "Vibe House",
          description: `${selectedProperty.title} - ${selectedRoom.title}`,
          order_id: paymentOrder.razorpay_order_id,
          prefill: {
            name: `${guest.firstName} ${guest.lastName}`.trim(),
            email: guest.email,
            contact: guest.phone,
          },
          theme: {
            color: "#ff7b6b",
          },
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              const verification = await verifyColivePayment(token, {
                draft_booking_id: draftBooking.draft_booking_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              setConfirmedReservationId(verification.booking_reference || verification.booking_id);
              setStage("confirmation");
              setShowMobileSummary(false);
              clearColiveFlowSnapshot();
              toast.success("Payment successful", {
                description: "Your Colive booking is confirmed.",
              });
              resolve();
            } catch (error) {
              reject(error instanceof Error ? error : new Error("Payment verification failed."));
            }
          },
          modal: {
            ondismiss: async () => {
              try {
                await failBookingPayment(token, paymentOrder.razorpay_order_id);
              } catch {
                // noop: payment may not have been initiated.
              }
              reject(new Error("Payment cancelled before completion."));
            },
          },
        });

        razorpay.on("payment.failed", async () => {
          try {
            await failBookingPayment(token, paymentOrder.razorpay_order_id);
          } catch {
            // noop
          }
          reject(new Error("Payment failed. Please try again."));
        });

        razorpay.open();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete booking payment right now.";
      setCheckoutError(message);
      toast.error("Payment not completed", { description: message });
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  function resetFlow() {
    clearColiveFlowSnapshot();
    setStage("landing");
    setCheckoutStep(1);
    setSelectedPropertyId(null);
    setSelectedRoomId(null);
    setGuestErrors({});
    setAddonQuantities({ meals: 0, laundry: 0, workspace: 0 });
    setCheckoutError(null);
    setConfirmedReservationId(null);
    setShowMobileSummary(false);
    setActiveGalleryIndex(0);
  }

  if (stage === "checkout" && isRestoringSession) {
    return (
      <div className="relative overflow-x-hidden bg-[#09070d] text-[#f7f2eb]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,123,107,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(52,213,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(155,255,106,0.12),transparent_26%),linear-gradient(180deg,#110c15_0%,#09070d_45%,#060509_100%)]" />
        </div>

        <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6 pt-28 sm:px-6 sm:pb-8 sm:pt-28 lg:px-8">
          <section aria-busy="true" aria-live="polite" className="space-y-5" role="status">
            <span className="sr-only">Loading checkout details.</span>

            <div className="mx-auto flex max-w-[760px] items-center justify-center">
              <div className="grid w-full items-start gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="flex flex-col items-center gap-3" key={index}>
                    <Skeleton className="h-12 w-12 rounded-[14px] bg-white/12" />
                    <Skeleton className="h-3 w-24 bg-white/10" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-5 rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,rgba(23,16,30,0.95),rgba(13,10,18,0.95))] p-6 sm:p-8">
                <Skeleton className="h-4 w-24 bg-white/12" />
                <Skeleton className="h-9 w-72 bg-white/12" />
                <div className="space-y-4">
                  <Skeleton className="h-14 w-full rounded-[18px] bg-white/10" />
                  <Skeleton className="h-14 w-full rounded-[18px] bg-white/10" />
                  <Skeleton className="h-14 w-full rounded-[18px] bg-white/10" />
                  <Skeleton className="h-14 w-full rounded-[18px] bg-white/10" />
                </div>
                <Skeleton className="h-12 w-52 rounded-full bg-white/12" />
              </div>

              <div className="hidden lg:block">
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,15,26,0.95),rgba(14,9,19,0.95))]">
                  <div className="border-b border-white/10 px-6 py-6">
                    <Skeleton className="h-4 w-32 bg-white/12" />
                    <Skeleton className="mt-3 h-8 w-44 bg-white/12" />
                    <div className="mt-5 space-y-3">
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-4 w-full bg-white/10" />
                    </div>
                  </div>
                  <div className="px-6 py-6">
                    <Skeleton className="h-3 w-24 bg-white/10" />
                    <Skeleton className="mt-3 h-9 w-36 bg-white/12" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const summaryCard = (
    <aside className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,15,26,0.95),rgba(14,9,19,0.95))] shadow-[0_30px_70px_rgba(0,0,0,0.38)]">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#34d5ff]">Booking snapshot</p>
            <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold uppercase text-white">Your Stay</h3>
          </div>
          <StickerTag bg="#f9cb37" label={`${months} month${months > 1 ? "s" : ""}`} rotate="-rotate-[8deg]" text="#1c1402" />
        </div>
        <div className="mt-6 space-y-4 text-sm text-white/76">
          <div className="flex items-start justify-between gap-4">
            <span>Property</span>
            <span className="max-w-[180px] text-right font-semibold text-white">{selectedProperty.title}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span>Room</span>
            <span className="max-w-[180px] text-right font-semibold text-white">{selectedRoom?.title ?? "Choose a room"}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span>Move-in</span>
            <span className="text-right font-semibold text-white">{formatMoveInDate(moveIn)}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span>Stay type</span>
            <span className="text-right font-semibold text-white">{stayTypeLabels[stayType]}</span>
          </div>
        </div>
      </div>
      <div className="px-6 py-6">
        <div className="space-y-3 text-sm text-white/76">
          <div className="flex items-center justify-between">
            <span>Room charges</span>
            <span className="font-semibold text-white">{formatCurrency(roomCharges)}</span>
          </div>
          {addonLineItems
            .filter((item) => item.quantity > 0)
            .map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span>
                  {item.title} x {item.quantity}
                </span>
                <span className="font-semibold text-white">{formatCurrency(item.total)}</span>
              </div>
            ))}
        </div>
        <div className="mt-5 rounded-[22px] border border-[#34d5ff]/15 bg-[#34d5ff]/8 px-4 py-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ee8ff]">Estimated total</p>
              <p className="mt-2 text-3xl font-black text-white">{formatCurrency(grandTotal)}</p>
            </div>
            <div className="max-w-[140px] text-right text-xs leading-5 text-white/58">Connected to booking order + secure payment checkout.</div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="relative overflow-x-hidden bg-[#09070d] text-[#f7f2eb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,123,107,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(52,213,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(155,255,106,0.12),transparent_26%),linear-gradient(180deg,#110c15_0%,#09070d_45%,#060509_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6 pt-28 sm:px-6 sm:pb-8 sm:pt-28 lg:px-8">
        {stage === "landing" ? (
          <section className="space-y-8 sm:space-y-10">
            <div className="grid gap-6 lg:grid-cols-[1.32fr_0.68fr] lg:items-stretch">
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(30,18,34,0.95),rgba(14,10,18,0.92))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.4)] sm:p-9">
                <div className="flex flex-wrap items-center gap-3">
                  <StickerTag bg="#34d5ff" label="Immersive Long Stay" rotate="-rotate-[4deg]" text="#03131a" />
                  <StickerTag bg="#f9cb37" label="All Utilities Included" rotate="rotate-[2deg]" text="#231702" />
                </div>
                <h2 className="mt-6 font-['Space_Grotesk'] text-[1.7rem] font-black uppercase leading-[1.12] text-white sm:text-5xl">
                  Live in Koramangala like it was always your neighborhood.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                  Flexible monthly living with Superfast Speed, cleaner routines, sharper interiors, and social spaces that feel intentional instead of improvised.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <label className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/58">Move-in date</span>
                    <input
                      className="w-full rounded-[12px] border border-white/10 bg-[#130f18] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#34d5ff]/70"
                      min={nextMonthDate()}
                      onChange={(event) => setMoveIn(event.target.value)}
                      type="date"
                      value={moveIn}
                    />
                  </label>
                  <label className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/58">Duration</span>
                    <select
                      className="w-full rounded-[12px] border border-white/10 bg-[#130f18] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#34d5ff]/70"
                      onChange={(event) => setDuration(Number(event.target.value))}
                      value={duration}
                    >
                      {durationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const active = stayType === plan.stayType;
                    return (
                      <button
                        className={cn(
                          "group rounded-[20px] border p-4 text-left transition",
                          active
                            ? "border-white/25 bg-white/[0.09] shadow-[0_20px_45px_rgba(0,0,0,0.32)]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]",
                        )}
                        key={plan.id}
                        onClick={() => setStayType(plan.stayType)}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: plan.accent }}>
                          <Icon className="h-4 w-4" />
                          {plan.eyebrow}
                        </span>
                        <p className="mt-3 font-['Space_Grotesk'] text-base font-bold uppercase text-white">{plan.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/68">{plan.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <Button className="h-12 w-full rounded-full px-5 text-sm sm:w-auto sm:px-7" onClick={handleSearch} size="lg">
                    Explore Colive Houses
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-white/72 sm:w-auto sm:justify-start">
                    <MapPin className="h-4 w-4 text-[#34d5ff]" />
                    {locationLabels[location]}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#110c16] p-3 shadow-[0_30px_75px_rgba(0,0,0,0.38)]">
                  <div className="relative h-[300px] overflow-hidden rounded-[22px] sm:h-[340px]">
                    <Image
                      alt="Colive community space"
                      className="object-cover"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      src={properties[0].heroImage}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(5,4,8,0.82)_100%)]" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8ee8ff]">Signature Spaces</p>
                      <p className="mt-2 font-['Space_Grotesk'] text-xl font-black uppercase text-white sm:text-2xl">Immersive, social, and work ready.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {amenityShowcase.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4" key={item.label}>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${item.accent}26` }}>
                          <Icon className="h-4 w-4" style={{ color: item.accent }} />
                        </span>
                        <p className="mt-3 text-sm font-semibold leading-5 text-white/85">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {stage === "inventory" ? (
          <section className="space-y-6 sm:space-y-8">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ee8ff]">Curated Inventory</p>
                  <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-black uppercase text-white">Pick your Koramangala base</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/72">
                  <Calendar className="h-4 w-4 text-[#f9cb37]" />
                  Move-in {formatMoveInDate(moveIn)}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {filteredProperties.map((property) => (
                <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(26,16,31,0.92),rgba(14,10,19,0.92))] shadow-[0_30px_70px_rgba(0,0,0,0.34)]" key={property.id}>
                  <div className="relative h-[260px] overflow-hidden">
                    <Image
                      alt={property.title}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
                      src={property.heroImage}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(7,6,11,0.88)_100%)]" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <FeatureBadge accent="#34d5ff" label={property.quietLabel} />
                      <FeatureBadge accent="#ff7b6b" label={property.mainLabel} />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ee8ff]">{property.cityLabel}</p>
                        <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-black uppercase text-white">{property.title}</h3>
                      </div>
                      <div className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-sm font-semibold text-white">
                        {property.rating} <Star className="ml-1 inline h-3.5 w-3.5 text-[#f9cb37]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <p className="text-sm leading-6 text-white/72">{property.subtitle}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-black text-white">{formatCurrency(property.priceFrom)}</p>
                      <p className="text-sm text-white/45 line-through">{formatCurrency(property.strikeFrom)}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9bff6a]">monthly</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => (
                        <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-white/75" key={amenity}>
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <Button className="h-11 w-full rounded-full" onClick={() => handleOpenProperty(property.id)}>
                      View property details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {stage === "property" ? (
          <section className="space-y-8">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="relative h-[340px] overflow-hidden rounded-[28px] border border-white/10 bg-[#100b16] sm:h-[430px]">
                  <Image
                    alt={selectedProperty.title}
                    className="object-cover"
                    fill
                    sizes="(max-width: 1280px) 100vw, 66vw"
                    src={activeImage}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(8,7,12,0.9)_100%)]" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ee8ff]">Photo gallery</p>
                      <p className="mt-2 font-['Space_Grotesk'] text-2xl font-black uppercase text-white">{selectedProperty.title}</p>
                    </div>
                    <div className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-sm font-semibold text-white">
                      {activeGalleryIndex + 1}/{galleryImages.length}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {galleryImages.map((image, index) => (
                    <button
                      className={cn(
                        "relative h-20 overflow-hidden rounded-[14px] border transition sm:h-24",
                        index === activeGalleryIndex ? "border-[#34d5ff]/70" : "border-white/10 hover:border-white/30",
                      )}
                      key={image}
                      onClick={() => setActiveGalleryIndex(index)}
                      type="button"
                    >
                      <Image
                        alt={`${selectedProperty.title} ${index + 1}`}
                        className="object-cover"
                        fill
                        sizes="(max-width: 640px) 31vw, 120px"
                        src={image}
                      />
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedProperty.benefits.map((benefit) => (
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4" key={benefit.title}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: benefit.accent }}>
                        Benefit
                      </p>
                      <p className="mt-2 font-['Space_Grotesk'] text-xl font-bold uppercase text-white">{benefit.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="space-y-4 rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,rgba(24,16,31,0.95),rgba(13,10,17,0.95))] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.38)] sm:p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ee8ff]">{selectedProperty.cityLabel}</p>
                <h3 className="font-['Space_Grotesk'] text-3xl font-black uppercase text-white">{selectedProperty.title}</h3>
                <p className="text-sm leading-6 text-white/72">{selectedProperty.description}</p>
                <p className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/72">{selectedProperty.longStayLine}</p>

                <div className="space-y-3">
                  {selectedProperty.roomOptions.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    return (
                      <button
                        className={cn(
                          "w-full rounded-[18px] border p-4 text-left transition",
                          isSelected
                            ? "border-[#34d5ff]/65 bg-[#34d5ff]/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
                        )}
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-['Space_Grotesk'] text-lg font-bold uppercase text-white">{room.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/55">{formatCurrency(room.monthlyPrice)} monthly</p>
                          </div>
                          {isSelected ? <Check className="h-5 w-5 text-[#34d5ff]" /> : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/72">{room.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {room.features.map((feature) => (
                            <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/72" key={feature}>
                              {feature}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[18px] border border-[#34d5ff]/30 bg-[linear-gradient(135deg,rgba(52,213,255,0.14),rgba(255,123,107,0.08))] p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ee8ff]">Colive Concierge</p>
                  <p className="mt-2 font-['Space_Grotesk'] text-xl font-black uppercase text-white">Need help choosing a room?</p>
                  <p className="mt-2 text-sm leading-6 text-white/78">
                    Compare Koramangala A and B in one click, then lock your pick with a smoother checkout.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button className="h-10 rounded-full px-5" onClick={() => setStage("inventory")} type="button" variant="outline">
                      Compare both houses
                    </Button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                      <Phone className="h-3.5 w-3.5 text-[#34d5ff]" />
                      Callback after booking
                    </div>
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-full"
                  disabled={!selectedRoomId}
                  onClick={() => {
                    if (!selectedRoomId) {
                      return;
                    }
                    setCheckoutStep(1);
                    setStage("checkout");
                  }}
                >
                  Continue to secure booking
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </aside>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {selectedProperty.stories.map((story) => (
                <article className="rounded-[24px] border border-white/10 p-5" key={story.quote} style={{ backgroundColor: `${story.accent}1f` }}>
                  <p className="text-sm leading-7" style={{ color: story.text }}>
                    “{story.quote}”
                  </p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: story.text }}>
                    {story.guest} • {story.stayed}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {stage === "checkout" ? (
          <section className="space-y-5">
            <div className="mx-auto flex max-w-[760px] items-center justify-center">
              <div className="grid w-full items-start gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                {[
                  { step: 1 as CheckoutStep, label: "Guest details", icon: User, sticker: "Names first" },
                  { step: 2 as CheckoutStep, label: "Add-ons", icon: PlusCircle, sticker: "Stay upgrades" },
                  { step: 3 as CheckoutStep, label: "Review", icon: CreditCard, sticker: "Pay secure" },
                ].map((tab, index) => {
                  const isActive = checkoutStep === tab.step;
                  const isComplete = checkoutStep > tab.step;
                  const Icon = tab.icon;

                  return (
                    <div className="relative flex flex-col items-center gap-3" key={tab.step}>
                      {index < 2 ? (
                        <div
                          className={cn(
                            "absolute left-[calc(50%+28px)] top-6 hidden h-[2px] w-[calc(100%-56px)] md:block",
                            checkoutStep > index + 1 ? "bg-[#c62828]" : "bg-white/10",
                          )}
                        />
                      ) : null}
                      <button
                        className={cn("inline-flex h-12 w-12 items-center justify-center rounded-[14px]", checkoutTabButtonClasses(isActive, isComplete))}
                        onClick={() => {
                          if (tab.step <= checkoutStep) {
                            setCheckoutStep(tab.step);
                            return;
                          }

                          if (tab.step === 2) {
                            continueFromGuestDetails();
                            return;
                          }

                          if (tab.step === 3 && checkoutStep >= 2) {
                            setCheckoutStep(3);
                          }
                        }}
                        type="button"
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                      <div className="flex flex-col items-center gap-2">
                        <p className={cn("text-center text-[11px] font-bold uppercase tracking-[0.08em]", isActive || isComplete ? "text-white" : "text-white/45")}>
                          {tab.label}
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                            isActive || isComplete ? "bg-white/10 text-white/75" : "bg-white/5 text-white/35",
                          )}
                        >
                          {tab.sticker}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-5 rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,rgba(23,16,30,0.95),rgba(13,10,18,0.95))] p-6 sm:p-8">
                {checkoutStep === 1 ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ee8ff]">Step 1</p>
                      <h3 className="mt-2 font-['Space_Grotesk'] text-3xl font-black uppercase text-white">Tell us who is moving in</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InputField
                        error={guestErrors.firstName}
                        label="First Name"
                        onChange={(value) => updateGuestField("firstName", value)}
                        value={guest.firstName}
                      />
                      <InputField
                        error={guestErrors.lastName}
                        label="Last Name"
                        onChange={(value) => updateGuestField("lastName", value)}
                        value={guest.lastName}
                      />
                    </div>
                    <InputField
                      error={guestErrors.email}
                      label="Email"
                      onChange={(value) => updateGuestField("email", value)}
                      type="email"
                      value={guest.email}
                    />
                    <InputField
                      error={guestErrors.phone}
                      label="Phone"
                      onChange={(value) => updateGuestField("phone", value)}
                      value={guest.phone}
                    />
                    <Button className="h-12 rounded-full px-5 text-sm leading-none whitespace-nowrap sm:px-7 sm:text-base" onClick={continueFromGuestDetails}>
                      Continue to add-ons
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}

                {checkoutStep === 2 ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ee8ff]">Step 2</p>
                      <h3 className="mt-2 font-['Space_Grotesk'] text-3xl font-black uppercase text-white">Customize your monthly setup</h3>
                    </div>
                    <div className="space-y-3">
                      {addons.map((addon) => {
                        const Icon = addon.icon;
                        const quantity = addonQuantities[addon.key];
                        return (
                          <div className="flex items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4" key={addon.key}>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${addon.accent}22` }}>
                                  <Icon className="h-5 w-5" style={{ color: addon.accent }} />
                                </span>
                                <div>
                                  <p className="font-['Space_Grotesk'] text-lg font-bold uppercase text-white">{addon.title}</p>
                                  <p className="text-xs uppercase tracking-[0.12em] text-white/58">{formatCurrency(addon.monthlyPrice)} / month</p>
                                </div>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-white/70">{addon.description}</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#120b16] px-2 py-1.5">
                              <button
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:text-white"
                                onClick={() => updateAddon(addon.key, -1)}
                                type="button"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="min-w-7 text-center text-sm font-bold text-white">{quantity}</span>
                              <button
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:text-white"
                                onClick={() => updateAddon(addon.key, 1)}
                                type="button"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button className="h-12 rounded-full px-7" onClick={() => setCheckoutStep(3)}>
                        Review booking
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button className="h-12 rounded-full px-7" onClick={() => setCheckoutStep(1)} variant="outline">
                        Edit guest details
                      </Button>
                    </div>
                  </div>
                ) : null}

                {checkoutStep === 3 ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ee8ff]">Step 3</p>
                      <h3 className="mt-2 font-['Space_Grotesk'] text-3xl font-black uppercase text-white">Final review</h3>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="space-y-3 text-sm text-white/74">
                        <div className="flex items-center justify-between">
                          <span>Guest</span>
                          <span className="font-semibold text-white">{guest.firstName} {guest.lastName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Email</span>
                          <span className="font-semibold text-white">{guest.email || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Phone</span>
                          <span className="font-semibold text-white">{guest.phone || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Room</span>
                          <span className="font-semibold text-white">{selectedRoom?.title ?? "-"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-white/12 bg-white/[0.03] p-4 text-sm text-white/75">
                      <p className="font-semibold text-white">Quick check before payment</p>
                      <p className="mt-1">Guest details, room, and add-ons are locked for this checkout session.</p>
                    </div>
                    {checkoutError ? (
                      <div className="rounded-[16px] border border-[#ff7b6b]/35 bg-[#ff7b6b]/12 px-4 py-3 text-sm text-[#ffd4ce]">
                        {checkoutError}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="h-12 rounded-full px-7"
                        disabled={isSubmittingPayment}
                        onClick={() => void handleConfirmAndPay()}
                      >
                        {isSubmittingPayment ? "Opening payment..." : "Pay and confirm booking"}
                        {isSubmittingPayment ? <CreditCard className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button className="h-12 rounded-full px-7" onClick={() => setCheckoutStep(2)} variant="outline">
                        Update add-ons
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">{summaryCard}</div>
            </div>

            <div className="lg:hidden">
              <Button className="h-12 w-full rounded-full" onClick={() => setShowMobileSummary(true)} variant="outline">
                Open booking summary
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        ) : null}

        {stage === "confirmation" ? (
          <section className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(150deg,rgba(24,18,30,0.96),rgba(12,9,17,0.96))] p-7 text-center shadow-[0_35px_90px_rgba(0,0,0,0.44)] sm:p-10">
              <div className="pointer-events-none absolute -left-8 top-5 h-32 w-32 rounded-full bg-[#34d5ff]/18 blur-2xl" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-36 w-36 rounded-full bg-[#ff7b6b]/16 blur-2xl" />
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#9bff6a]/45 bg-[#9bff6a]/18">
                <Gift className="h-8 w-8 text-[#9bff6a]" />
              </span>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ee8ff]">Booking request received</p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-4xl font-black uppercase text-white">You are in.</h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/72">
                We have locked your selected room request at {selectedProperty.title}. Expect a follow-up with confirmation, onboarding guidance, and move-in checklist shortly.
              </p>
              {confirmedReservationId ? (
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#9bff6a]">
                  Reservation ID: {confirmedReservationId}
                </p>
              ) : null}

              <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
                <div className="rounded-[16px] border border-white/12 bg-white/[0.03] p-4">
                  <CalendarDays className="h-4 w-4 text-[#34d5ff]" />
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-white/60">Move-in date</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatMoveInDate(moveIn)}</p>
                </div>
                <div className="rounded-[16px] border border-white/12 bg-white/[0.03] p-4">
                  <House className="h-4 w-4 text-[#f9cb37]" />
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-white/60">Property</p>
                  <p className="mt-1 text-sm font-semibold text-white">{selectedProperty.title}</p>
                </div>
                <div className="rounded-[16px] border border-white/12 bg-white/[0.03] p-4">
                  <Wifi className="h-4 w-4 text-[#9bff6a]" />
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-white/60">Included</p>
                  <p className="mt-1 text-sm font-semibold text-white">Superfast Speed + utilities</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button className="h-12 rounded-full px-7" onClick={resetFlow}>
                  Start another search
                </Button>
                <Button asChild className="h-12 rounded-full px-7" variant="outline">
                  <Link href="/bookings">View booking dashboard</Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {showMobileSummary ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:p-6 lg:hidden">
          <div className="w-full space-y-3">
            <div className="flex justify-end">
              <button
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                onClick={() => setShowMobileSummary(false)}
                type="button"
              >
                Close summary
              </button>
            </div>
            {summaryCard}
          </div>
        </div>
      ) : null}
    </div>
  );
}
