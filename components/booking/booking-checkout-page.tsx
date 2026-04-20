"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Gift,
  GlassWater,
  Info,
  LoaderCircle,
  Lock,
  Minus,
  Package,
  Plus,
  PlusCircle,
  Shirt,
  ShoppingBag,
  Sparkles,
  TimerReset,
  User,
  X,
} from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { StickerTag } from "@/components/shared/sticker-tag";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createBookingPaymentOrder,
  createGuestBookingOrder,
  failBookingPayment,
  getStoreCatalog,
  type StoreCatalogItem,
  verifyBookingPayment,
} from "@/lib/booking-api";
import {
  clearBookingDraft,
  clearPendingBookingOrder,
  type BookingDraft,
  getStoredBookingState,
  saveBookingDraft,
  saveBookingReviewGuest,
  saveConfirmedBookingSnapshot,
  savePendingBookingOrder,
  type BookingReviewGuest,
} from "@/lib/booking-session";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from "@/lib/guest-form-validation";
import { weeklyLineup } from "@/content/events";
import { propertyGuidelines } from "@/content/rooms";
import { toast } from "sonner";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

type DiagnosticStatus = "request" | "success" | "error" | "info";
type ReviewTab = "guest" | "addons" | "confirmation";

type BookingDiagnosticEvent = {
  id: string;
  timestamp: number;
  step: string;
  status: DiagnosticStatus;
  request?: unknown;
  response?: unknown;
  error?: string;
};

type GuestFormErrors = Partial<Record<"firstName" | "lastName" | "email" | "phone" | "acceptedTerms", string>>;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const PROMO_CODES = [
  { code: "WORKATION", description: "Flat 15% off on workation plans" },
  { code: "GROUP10", description: "Flat 10% off on group bookings (7+ adults)" },
  { code: "NEWSIGNUP", description: "New user signup 5% OFF" },
];

const POLICY_SECTIONS = [
  {
    id: "general-policy",
    label: "General policy",
    content: propertyGuidelines.summary,
  },
  {
    id: "cancellation-policy",
    label: "Cancellation policy",
    content: [
      "Cancel up to 7 days before check-in for a full refund.",
      "Cancellations 4 to 7 days before arrival may be partially refundable.",
      "Bookings cancelled within 4 days of arrival are non-refundable.",
    ],
  },
  {
    id: "commune-policy",
    label: "Commune policy",
    content: [
      "Please respect quiet hours, dorm etiquette, and shared common areas.",
      "Outside visitors are subject to front-desk approval and property timing rules.",
      "Management may refuse service for behavior that affects guest safety or comfort.",
    ],
  },
  {
    id: "loyalty-policy",
    label: "Loyalty coins policy",
    content: [
      "Coins shown in the review summary are indicative until payment is captured.",
      "Any loyalty settlement or issuance follows the final backend-confirmed booking value.",
    ],
  },
  {
    id: "privacy-policy",
    label: "Privacy policy",
    content: [
      "Guest contact details are used for booking communication and operational support.",
      "ID and KYC details are completed later in the pre-arrival flow, before check-in.",
    ],
  },
  {
    id: "terms-policy",
    label: "Terms",
    content: [
      "Booking remains subject to property policy, availability revalidation, and payment success.",
      "By continuing, you confirm that all guests meet the stay requirements for this property.",
    ],
  },
];

const ROOM_GST_RATE = 0.05;
const STANDARD_ADDON_GST_RATE = 0.18;

function getAddonTaxRate(addonName: string): number {
  const normalized = addonName.trim().toLowerCase();
  if (normalized.includes("late checkout")) {
    return ROOM_GST_RATE;
  }
  return STANDARD_ADDON_GST_RATE;
}

function calculatePricingBreakdown(params: {
  roomSubtotal: number;
  activeAddons: Array<{ name: string; unitPrice: number; quantity: number }>;
}) {
  const addonSubtotal = params.activeAddons.reduce((sum, addon) => sum + addon.unitPrice * addon.quantity, 0);
  const roomTaxExact = params.roomSubtotal * ROOM_GST_RATE;
  const addonTaxExact = params.activeAddons.reduce(
    (sum, addon) => sum + (addon.unitPrice * addon.quantity * getAddonTaxRate(addon.name)),
    0,
  );
  const taxesExact = roomTaxExact + addonTaxExact;
  const taxes = Math.round(taxesExact);
  const grandTotal = Math.round(params.roomSubtotal + addonSubtotal + taxesExact);

  return {
    addonSubtotal,
    roomTaxExact,
    addonTaxExact,
    taxesExact,
    taxes,
    grandTotal,
  };
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
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function toDiagnosticPreview(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateLabel(value?: string | null): string {
  if (!value) {
    return "TBA";
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "TBA";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getNightCount(checkIn?: string | null, checkOut?: string | null): number {
  if (!checkIn || !checkOut) {
    return 1;
  }

  const start = new Date(`${checkIn.slice(0, 10)}T12:00:00`).getTime();
  const end = new Date(`${checkOut.slice(0, 10)}T12:00:00`).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 1;
  }

  return Math.max(1, Math.round((end - start) / 86400000));
}

function splitGuestName(name?: string | null): Pick<BookingReviewGuest, "firstName" | "lastName"> {
  const clean = (name || "").trim();
  if (!clean) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...rest] = clean.split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function isSingleQuantityService(item: Pick<StoreCatalogItem, "id" | "name" | "category">): boolean {
  if (item.category !== "SERVICE") {
    return false;
  }

  const normalizedId = item.id.trim().toLowerCase();
  const normalizedName = item.name.trim().toLowerCase();

  return normalizedId.includes("early-checkin")
    || normalizedId.includes("late-checkout")
    || normalizedName === "early check-in"
    || normalizedName === "late checkout";
}

function getTotalGuestCount(draft: BookingDraft | null): number {
  if (!draft) {
    return 1;
  }

  const total = draft.rooms.reduce((sum, room) => {
    const match = room.guestText.match(/(\d+)/);
    const guestsPerRoom = match ? Number(match[1]) : 1;
    return sum + guestsPerRoom * room.quantity;
  }, 0);

  return Math.max(1, total);
}

function createInitialGuestForm(draft: BookingDraft | null, stored?: BookingReviewGuest | null, guest?: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}): BookingReviewGuest {
  if (stored && draft) {
    const additionalGuestCount = Math.max(0, getTotalGuestCount(draft) - 1);
    return {
      ...stored,
      additionalGuests: Array.from({ length: additionalGuestCount }, (_, index) => stored.additionalGuests[index] ?? { name: "", phone: "" }),
    };
  }

  const names = splitGuestName(guest?.name);

  return {
    firstName: names.firstName,
    lastName: names.lastName,
    email: guest?.email || "",
    phone: guest?.phone || "",
    coupon: "",
    acceptedTerms: true,
    additionalGuests: Array.from({ length: Math.max(0, getTotalGuestCount(draft) - 1) }, () => ({ name: "", phone: "" })),
  };
}

function mergeGuestIdentityIntoForm(
  current: BookingReviewGuest,
  guest?: { name?: string | null; email?: string | null; phone?: string | null } | null,
): BookingReviewGuest {
  if (!guest) {
    return current;
  }

  const names = splitGuestName(guest.name);
  const normalizedGuestEmail = normalizeEmail(guest.email ?? "");
  const normalizedGuestPhone = normalizePhone(guest.phone ?? "");

  return {
    ...current,
    firstName: current.firstName.trim() || names.firstName,
    lastName: current.lastName.trim() || names.lastName,
    email: current.email.trim() || normalizedGuestEmail,
    phone: current.phone.trim() || normalizedGuestPhone,
  };
}

function validateGuestForm(form: BookingReviewGuest): GuestFormErrors {
  const errors: GuestFormErrors = {};

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  const normalizedEmail = normalizeEmail(form.email);
  if (!normalizedEmail) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  const normalizedPhone = normalizePhone(form.phone);
  if (!normalizedPhone) {
    errors.phone = "Phone number is required.";
  } else if (!isValidPhone(normalizedPhone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!form.acceptedTerms) {
    errors.acceptedTerms = "Please confirm all guests are above 18 and accept the policies.";
  }

  return errors;
}

function addonIcon(name: string) {
  const value = name.toLowerCase();

  if (value.includes("water")) return GlassWater;
  if (value.includes("towel") || value.includes("laundry")) return Shirt;
  if (value.includes("toilet")) return Sparkles;
  if (value.includes("lock")) return Lock;
  if (value.includes("check")) return TimerReset;
  if (value.includes("blanket") || value.includes("mattress") || value.includes("bunk") || value.includes("upgrade")) return Package;
  if (value.includes("storage") || value.includes("stay")) return ShoppingBag;
  return Gift;
}

function isStockTrackedCategory(category: StoreCatalogItem["category"]): boolean {
  return category === "COMMODITY" || category === "RETURNABLE";
}

function hasKnownStockLimit(item: StoreCatalogItem): boolean {
  return isStockTrackedCategory(item.category) && item.available_stock !== null;
}

function isItemDisabled(item: StoreCatalogItem): boolean {
  if (!isStockTrackedCategory(item.category)) {
    return false;
  }

  if (!item.in_stock) {
    return true;
  }

  return hasKnownStockLimit(item) ? (item.available_stock ?? 0) <= 0 : false;
}

function tabButtonClasses(isActive: boolean, isComplete: boolean) {
  if (isActive || isComplete) {
    return "bg-[#c62828] text-white shadow-[4px_4px_0px_rgba(0,0,0,0.45)] outline outline-1 outline-black";
  }

  return "bg-white/5 text-white/45 outline outline-1 outline-white/20";
}

export function BookingCheckoutPage() {
  const router = useRouter();
  const { guest, isAuthenticated, openAuthModal, updateGuestProfile } = useGuestAuth();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewTab>("guest");
  const [guestForm, setGuestForm] = useState<BookingReviewGuest | null>(null);
  const [guestErrors, setGuestErrors] = useState<GuestFormErrors>({});
  const [catalog, setCatalog] = useState<StoreCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [inventoryMessageById, setInventoryMessageById] = useState<Record<string, string>>({});
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifyErrorMessage, setVerifyErrorMessage] = useState<string | null>(null);
  const [failErrorMessage, setFailErrorMessage] = useState<string | null>(null);
  const [flowStage, setFlowStage] = useState<
    "idle" | "creating-order" | "creating-payment-order" | "opening-razorpay" | "verifying-payment" | "confirmed" | "failed"
  >("idle");
  const [diagnostics, setDiagnostics] = useState<BookingDiagnosticEvent[]>([]);
  const [resumeAfterAuth, setResumeAfterAuth] = useState(false);
  const [triggerPaymentOpen, setTriggerPaymentOpen] = useState(false);
  const paymentHandledRef = useRef(false);
  const hydratedGuestRef = useRef(false);

  const appendDiagnostic = useCallback(
    (
      step: string,
      status: DiagnosticStatus,
      payload?: {
        request?: unknown;
        response?: unknown;
        error?: string;
      },
    ) => {
      const event: BookingDiagnosticEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        step,
        status,
        request: payload?.request,
        response: payload?.response,
        error: payload?.error,
      };

      setDiagnostics((current) => [...current, event].slice(-40));
    },
    [],
  );

  useEffect(() => {
    const stored = getStoredBookingState();
    if (!stored?.draft) {
      return;
    }

    setDraft(stored.draft);
    setGuestForm(createInitialGuestForm(stored.draft, stored.review?.guest ?? null));
    hydratedGuestRef.current = true;
  }, []);

  useEffect(() => {
    if (!draft || !guest || hydratedGuestRef.current === false) {
      return;
    }

    setGuestForm((current) => {
      if (current) {
        return mergeGuestIdentityIntoForm(current, guest);
      }

      return createInitialGuestForm(draft, null, guest);
    });
  }, [draft, guest]);

  useEffect(() => {
    if (!draft || !guestForm) {
      return;
    }

    saveBookingReviewGuest(draft.signature, guestForm);
  }, [draft, guestForm]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);

    void getStoreCatalog(draft?.propertyId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const nextCatalog = response.filter((item) => item.category !== "BORROWABLE");
        setCatalog(nextCatalog);

        setDraft((current) => {
          if (!current) {
            return current;
          }

          const mappedAddons = nextCatalog
            .map((item) => {
              const existing = current.addons.find((addon) => addon.productId === item.id);
              const maxQuantity = hasKnownStockLimit(item)
                ? Math.max(0, item.available_stock ?? 0)
                : Number.MAX_SAFE_INTEGER;
              return {
                productId: item.id,
                name: item.name,
                category: item.category === "SERVICE" ? "SERVICE" as const : item.category === "RETURNABLE" ? "RETURNABLE" as const : "COMMODITY" as const,
                quantity: existing ? Math.min(existing.quantity, maxQuantity) : 0,
                unitPrice: item.base_price,
                inStock: item.in_stock,
              };
            })
            .filter((addon) => addon.quantity > 0);

          const nextDraft: BookingDraft = {
            ...current,
            addons: mappedAddons,
          };

          saveBookingDraft(nextDraft);
          return nextDraft;
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load add-ons right now.";
        setCatalogError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draft?.propertyId]);

  useEffect(() => {
    if (!resumeAfterAuth || !isAuthenticated) {
      return;
    }

    setResumeAfterAuth(false);
    setTriggerPaymentOpen(true);
  }, [isAuthenticated, resumeAfterAuth]);

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

  const nights = useMemo(() => getNightCount(draft?.checkinDate, draft?.checkoutDate), [draft?.checkinDate, draft?.checkoutDate]);
  const totalGuests = useMemo(() => getTotalGuestCount(draft), [draft]);
  const roomSubtotal = useMemo(
    () => (draft?.rooms ?? []).reduce((sum, room) => sum + room.basePrice * room.quantity * nights, 0),
    [draft?.rooms, nights],
  );
  const activeAddons = useMemo(() => (draft?.addons ?? []).filter((addon) => addon.quantity > 0), [draft?.addons]);
  const pricingBreakdown = useMemo(
    () => calculatePricingBreakdown({ roomSubtotal, activeAddons }),
    [activeAddons, roomSubtotal],
  );
  const addonSubtotal = pricingBreakdown.addonSubtotal;
  const roomTaxExact = pricingBreakdown.roomTaxExact;
  const addonTaxExact = pricingBreakdown.addonTaxExact;
  const taxes = pricingBreakdown.taxes;
  const estimatedGrandTotal = pricingBreakdown.grandTotal;
  const coinsEarned = Math.round(roomSubtotal + addonSubtotal);
  const commodityItems = useMemo(
    () => catalog.filter((item) => item.category === "COMMODITY" || item.category === "RETURNABLE"),
    [catalog],
  );
  const serviceItems = useMemo(() => catalog.filter((item) => item.category === "SERVICE"), [catalog]);

  const updateGuestField = useCallback(<K extends keyof BookingReviewGuest>(field: K, value: BookingReviewGuest[K]) => {
    setGuestForm((current) => (current ? { ...current, [field]: value } : current));
    setGuestErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const updateAdditionalGuest = useCallback((index: number, field: "name" | "phone", value: string) => {
    setGuestForm((current) => {
      if (!current) {
        return current;
      }

      const nextGuests = [...current.additionalGuests];
      nextGuests[index] = {
        ...nextGuests[index],
        [field]: value,
      };

      return {
        ...current,
        additionalGuests: nextGuests,
      };
    });
  }, []);

  const setAddonQuantity = useCallback((productId: string, quantity: number) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const item = catalog.find((catalogItem) => catalogItem.id === productId);
      if (!item) {
        return current;
      }

      const maxQuantity = isSingleQuantityService(item) ? 1 : Number.POSITIVE_INFINITY;
      const clampedQuantity = Math.max(0, Math.min(quantity, maxQuantity));
      const nextAddons = [...current.addons];
      const existingIndex = nextAddons.findIndex((addon) => addon.productId === productId);

      if (clampedQuantity === 0) {
        if (existingIndex >= 0) {
          nextAddons.splice(existingIndex, 1);
        }
      } else {
        const nextAddon = {
          productId: item.id,
          name: item.name,
          category: item.category === "SERVICE" ? "SERVICE" as const : item.category === "RETURNABLE" ? "RETURNABLE" as const : "COMMODITY" as const,
          quantity: clampedQuantity,
          unitPrice: item.base_price,
          inStock: item.in_stock,
        };

        if (existingIndex >= 0) {
          nextAddons[existingIndex] = nextAddon;
        } else {
          nextAddons.push(nextAddon);
        }
      }

      const nextDraft: BookingDraft = {
        ...current,
        addons: nextAddons,
      };

      saveBookingDraft(nextDraft);
      return nextDraft;
    });
  }, [catalog]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    draft.addons.forEach((addon) => {
      const item = catalog.find((catalogItem) => catalogItem.id === addon.productId);
      if (item && isSingleQuantityService(item) && addon.quantity > 1) {
        setAddonQuantity(item.id, 1);
      }
    });
  }, [catalog, draft, setAddonQuantity]);

  const incrementAddon = useCallback((item: StoreCatalogItem) => {
    const currentQuantity = draft?.addons.find((addon) => addon.productId === item.id)?.quantity ?? 0;

    if (isSingleQuantityService(item) && currentQuantity >= 1) {
      setInventoryMessageById((current) => ({
        ...current,
        [item.id]: "Only 1 per booking",
      }));
      return;
    }

    if (hasKnownStockLimit(item)) {
      const available = Math.max(0, item.available_stock ?? 0);

      if (!item.in_stock || available <= 0) {
        setInventoryMessageById((current) => ({
          ...current,
          [item.id]: "Avail at property",
        }));
        return;
      }

      if (currentQuantity >= available) {
        setInventoryMessageById((current) => ({
          ...current,
          [item.id]: `Only ${available} available`,
        }));
        return;
      }
    }

    setInventoryMessageById((current) => ({
      ...current,
      [item.id]: "",
    }));
    setAddonQuantity(item.id, currentQuantity + 1);
  }, [draft?.addons, setAddonQuantity]);

  const decrementAddon = useCallback((item: StoreCatalogItem) => {
    const currentQuantity = draft?.addons.find((addon) => addon.productId === item.id)?.quantity ?? 0;
    setInventoryMessageById((current) => ({
      ...current,
      [item.id]: "",
    }));
    setAddonQuantity(item.id, Math.max(0, currentQuantity - 1));
  }, [draft?.addons, setAddonQuantity]);

  const validateAndStoreGuestDetails = useCallback(() => {
    if (!guestForm) {
      return false;
    }

    const errors = validateGuestForm(guestForm);
    setGuestErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Complete the guest details before continuing.");
      return false;
    }

    updateGuestProfile({
      name: `${guestForm.firstName} ${guestForm.lastName}`.trim(),
      email: normalizeEmail(guestForm.email),
      phone: normalizePhone(guestForm.phone) || null,
    });

    return true;
  }, [guestForm, updateGuestProfile]);

  const openAddonsTab = useCallback(() => {
    if (!validateAndStoreGuestDetails()) {
      return;
    }

    setActiveTab("addons");
  }, [validateAndStoreGuestDetails]);

  const openPaymentFlow = useCallback(() => {
    if (!validateAndStoreGuestDetails()) {
      return;
    }

    setActiveTab("addons");
    setTriggerPaymentOpen(true);
  }, [validateAndStoreGuestDetails]);

  const handleTabClick = useCallback((tab: ReviewTab) => {
    if (tab === "guest") {
      setActiveTab("guest");
      return;
    }

    if (tab === "addons") {
      openAddonsTab();
      return;
    }
  }, [openAddonsTab]);

  const handlePayment = useCallback(async () => {
    if (!draft || !guestForm) {
      return;
    }

    const token = getStoredGuestToken();
    if (!token || !isAuthenticated) {
      appendDiagnostic("auth-check", "info", {
        response: { isAuthenticated, hasToken: Boolean(token) },
      });
      setResumeAfterAuth(true);
      openAuthModal("signin");
      return;
    }

    setIsPaying(true);
    setFlowStage("creating-order");
    setErrorMessage(null);
    setVerifyErrorMessage(null);
    setFailErrorMessage(null);
    setDiagnostics([]);
    appendDiagnostic("flow-start", "info", {
      response: {
        property_id: draft.propertyId,
        checkin_date: draft.checkinDate,
        checkout_date: draft.checkoutDate,
      },
    });

    try {
      const activeRooms = draft.rooms.filter((room) => room.quantity > 0);
      const selectedAddons = draft.addons.filter((addon) => addon.quantity > 0);
      const storedState = getStoredBookingState();
      const pendingSnapshot = storedState?.pendingOrder?.signature === draft.signature ? storedState.pendingOrder : null;

      const orderSummary = pendingSnapshot
        ? {
            ezee_reservation_id: pendingSnapshot.order.ezeeReservationId,
            property_id: pendingSnapshot.order.propertyId,
            property_name: pendingSnapshot.order.propertyName,
            checkin_date: pendingSnapshot.order.checkinDate,
            checkout_date: pendingSnapshot.order.checkoutDate,
            total_guests: pendingSnapshot.order.totalGuests,
            no_of_nights: pendingSnapshot.order.noOfNights,
            rooms: [],
            addons: [],
            subtotal_rooms: pendingSnapshot.order.subtotalRooms,
            subtotal_addons: pendingSnapshot.order.subtotalAddons,
            grand_total: pendingSnapshot.order.grandTotal,
            addon_order_id: pendingSnapshot.order.addonOrderId,
            status: pendingSnapshot.order.status,
          }
        : await createGuestBookingOrder(token, {
            property_id: draft.propertyId,
            checkin_date: draft.checkinDate,
            checkout_date: draft.checkoutDate,
            rooms: activeRooms.map((room) => ({
              room_type_id: room.roomTypeId,
              quantity: room.quantity,
            })),
            addons: selectedAddons.map((addon) => ({
              product_id: addon.productId,
              quantity: addon.quantity,
            })),
          });

      if (pendingSnapshot) {
        appendDiagnostic("create-booking-order", "info", {
          response: { source: "pending-snapshot", ezee_reservation_id: orderSummary.ezee_reservation_id },
        });
      } else {
        appendDiagnostic("create-booking-order", "success", {
          response: orderSummary,
          request: {
            guest: {
              first_name: guestForm.firstName,
              last_name: guestForm.lastName,
              email: normalizeEmail(guestForm.email),
              phone: normalizePhone(guestForm.phone),
            },
          },
        });
      }

      savePendingBookingOrder({
        signature: draft.signature,
        order: {
          ezeeReservationId: orderSummary.ezee_reservation_id,
          propertyId: orderSummary.property_id,
          propertyName: orderSummary.property_name,
          checkinDate: orderSummary.checkin_date,
          checkoutDate: orderSummary.checkout_date,
          totalGuests: orderSummary.total_guests,
          noOfNights: orderSummary.no_of_nights,
          subtotalRooms: orderSummary.subtotal_rooms,
          subtotalAddons: orderSummary.subtotal_addons,
          grandTotal: orderSummary.grand_total,
          addonOrderId: orderSummary.addon_order_id ?? null,
          status: orderSummary.status,
        },
      });

      setFlowStage("creating-payment-order");
      const payableGrandTotal = Math.max(0, Math.round(estimatedGrandTotal));
      appendDiagnostic("create-payment-order", "request", {
        request: {
          ezee_reservation_id: orderSummary.ezee_reservation_id,
          grand_total: payableGrandTotal,
          addon_order_id: orderSummary.addon_order_id ?? undefined,
          backend_subtotal: orderSummary.grand_total,
        },
      });

      const paymentOrder = await createBookingPaymentOrder(token, {
        ezee_reservation_id: orderSummary.ezee_reservation_id,
        grand_total: payableGrandTotal,
        ...(orderSummary.addon_order_id ? { addon_order_id: orderSummary.addon_order_id } : {}),
      });

      appendDiagnostic("create-payment-order", "success", {
        response: paymentOrder,
      });

      setFlowStage("opening-razorpay");
      appendDiagnostic("load-razorpay-script", "request");
      await loadRazorpayCheckout();
      appendDiagnostic("load-razorpay-script", "success");

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout did not initialise correctly.");
      }

      const Razorpay = window.Razorpay;
      paymentHandledRef.current = false;

      await new Promise<void>((resolve, reject) => {
        const markFailed = async (message: string) => {
          if (paymentHandledRef.current) {
            return;
          }

          paymentHandledRef.current = true;
          setFlowStage("failed");
          appendDiagnostic("razorpay-failed", "error", {
            error: message,
          });

          try {
            appendDiagnostic("payment-fail", "request", {
              request: { razorpay_order_id: paymentOrder.razorpay_order_id },
            });
            await failBookingPayment(token, paymentOrder.razorpay_order_id);
            appendDiagnostic("payment-fail", "success", {
              response: { razorpay_order_id: paymentOrder.razorpay_order_id },
            });
          } catch {
            setFailErrorMessage("Rollback API call failed after payment failure or cancellation.");
            appendDiagnostic("payment-fail", "error", {
              error: "Rollback API call failed",
            });
          }

          clearPendingBookingOrder();
          reject(new Error(message));
        };

        const razorpay = new Razorpay({
          key: paymentOrder.razorpay_key,
          amount: paymentOrder.amount_paise,
          currency: paymentOrder.currency,
          order_id: paymentOrder.razorpay_order_id,
          name: "The Daily Social",
          description: `${orderSummary.property_name} booking`,
          prefill: {
            name: `${guestForm.firstName} ${guestForm.lastName}`.trim(),
            email: guestForm.email,
            contact: guestForm.phone,
          },
          theme: {
            color: "#c62828",
          },
          notes: {
            ezee_reservation_id: orderSummary.ezee_reservation_id,
            property_id: orderSummary.property_id,
            guests: String(totalGuests),
          },
          modal: {
            ondismiss: () => {
              void markFailed("Payment was cancelled before confirmation.");
            },
          },
          handler: async (response: RazorpaySuccessResponse) => {
            if (paymentHandledRef.current) {
              return;
            }

            paymentHandledRef.current = true;
            setFlowStage("verifying-payment");
            appendDiagnostic("verify-payment", "request", {
              request: response,
            });

            try {
              const verification = await verifyBookingPayment(token, response);
              appendDiagnostic("verify-payment", "success", {
                response: verification,
              });
              clearPendingBookingOrder();
              clearBookingDraft();
              saveConfirmedBookingSnapshot({
                ezeeReservationId: orderSummary.ezee_reservation_id,
                propertyId: orderSummary.property_id,
                propertyName: orderSummary.property_name,
                roomTypeName: draft.rooms.map((room) => room.title).join(", "),
                roomSummary: draft.rooms
                  .filter((room) => room.quantity > 0)
                  .map((room) => `${room.title} x${room.quantity}`)
                  .join(", "),
                checkinDate: orderSummary.checkin_date,
                checkoutDate: orderSummary.checkout_date,
                amountPaid: verification.total,
                paymentId: verification.payment_id,
                noOfNights: orderSummary.no_of_nights,
                totalGuests: orderSummary.total_guests,
                status: "CONFIRMED",
                addonOrderId: orderSummary.addon_order_id ?? null,
                primaryGuest: {
                  firstName: guestForm.firstName,
                  lastName: guestForm.lastName,
                  email: normalizeEmail(guestForm.email),
                  phone: normalizePhone(guestForm.phone),
                },
                additionalGuests: guestForm.additionalGuests,
                rooms: orderSummary.rooms.map((room) => ({
                  roomTypeId: room.room_type_id,
                  roomTypeName: room.room_type_name,
                  type: room.type,
                  quantity: room.quantity,
                  pricePerNight: room.price_per_night,
                  lineTotal: room.line_total,
                })),
                addons: orderSummary.addons.map((addon) => ({
                  productId: addon.product_id,
                  productName: addon.product_name,
                  category: draft.addons.find((draftAddon) => draftAddon.productId === addon.product_id)?.category ?? "SERVICE",
                  quantity: addon.quantity,
                  unitPrice: addon.unit_price,
                  lineTotal: addon.line_total,
                })),
                pricing: {
                  subtotalRooms: orderSummary.subtotal_rooms,
                  subtotalAddons: orderSummary.subtotal_addons,
                  taxes,
                  grandTotal: verification.total,
                },
                createdAt: Date.now(),
              });
              setFlowStage("confirmed");
              toast.success("Payment successful! Redirecting to My Bookings...");
              router.push(`/bookings?fresh=${encodeURIComponent(orderSummary.ezee_reservation_id)}`);
              resolve();
            } catch (error) {
              clearPendingBookingOrder();
              const message = error instanceof Error ? error.message : "Payment verification failed.";
              setVerifyErrorMessage(message);
              setFlowStage("failed");
              toast.error(message);
              appendDiagnostic("verify-payment", "error", {
                error: message,
              });
              reject(error instanceof Error ? error : new Error("Payment verification failed."));
            }
          },
        });

        razorpay.on("payment.failed", () => {
          toast.error("Razorpay reported a payment failure. Please try again.");
          void markFailed("Razorpay reported a payment failure. Please try again.");
        });

        razorpay.open();
      });
    } catch (error) {
      setFlowStage("failed");
      const message = error instanceof Error ? error.message : "Unable to start the payment flow.";
      setErrorMessage(message);
      toast.error(message);
      appendDiagnostic("checkout-flow", "error", {
        error: message,
      });
    } finally {
      setIsPaying(false);
    }
  }, [appendDiagnostic, draft, estimatedGrandTotal, guestForm, isAuthenticated, openAuthModal, router, taxes, totalGuests]);

  useEffect(() => {
    if (!triggerPaymentOpen) {
      return;
    }

    setTriggerPaymentOpen(false);
    void handlePayment();
  }, [handlePayment, triggerPaymentOpen]);

  if (!draft || !guestForm) {
    return (
      <section className="vh-section min-h-screen pt-28 md:pt-32">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-10">
          <div className="rounded-[28px] border border-white/12 bg-[rgba(15,16,26,0.92)] p-8 text-center shadow-[var(--vh-shadow-lg)]">
            <h1 className="font-['Space_Grotesk'] text-3xl font-bold uppercase tracking-[-0.04em] text-white">No active booking draft</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">
              Pick your dates and room selection on the property page first, then come back here to review the booking.
            </p>
            <Button asChild className="mt-6 rounded-full px-6">
              <Link href="/property">
                Return to property
                <ArrowLeft className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const bookingSummaryDesktop = (
    <div className="hidden lg:block lg:col-span-1">
      <div className="sticky top-28 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(52,18,26,0.98),rgba(26,10,14,0.98))] shadow-[10px_10px_0px_rgba(0,0,0,0.28)]">
        <div className="h-1.5 bg-[#c62828]" />
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <StickerTag bg="#fef08a" className="px-3 py-1 font-bold not-italic uppercase tracking-[0.12em]" label="Locked rates" rotate="rotate-[-2deg]" text="#111827" />
            <StickerTag bg="#39ff14" className="px-3 py-1 font-bold not-italic uppercase tracking-[0.12em]" label="Fast check-in" rotate="rotate-[2deg]" text="#111827" />
          </div>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase text-white">Booking details</h2>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Check-in</p>
              <p className="mt-1 text-base font-bold text-white">{formatDateLabel(draft.checkinDate)}</p>
              <p className="text-[10px] text-white/40">from {propertyGuidelines.checkIn}</p>
            </div>
            <div className="rounded bg-[#ffdf00] px-2 py-1 text-[10px] font-bold uppercase text-black">
              {nights} {nights === 1 ? "Night" : "Nights"}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Check-out</p>
              <p className="mt-1 text-base font-bold text-white">{formatDateLabel(draft.checkoutDate)}</p>
              <p className="text-[10px] text-white/40">by {propertyGuidelines.checkOut}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
            <p className="text-lg font-bold text-white">The Daily Social Bangalore, Koramangala</p>
            {draft.rooms.map((room) => (
              <div key={room.roomTypeId} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white/92">{room.title}</p>
                  <p className="text-xs text-white/45">
                    {formatCurrency(room.basePrice)} /night x {room.quantity} ({room.guestText.replace(/^x\s*/, "")})
                  </p>
                </div>
                <p className="text-sm font-bold text-white">{formatCurrency(room.basePrice * room.quantity * nights)}</p>
              </div>
            ))}

            {activeAddons.map((addon) => (
              <div key={addon.productId} className="flex items-start justify-between gap-3 border-t border-white/10 pt-3">
                <div>
                  <p className="text-sm font-bold text-white/92">{addon.name}</p>
                  <p className="text-xs text-white/45">
                    {formatCurrency(addon.unitPrice)} x {addon.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-white">{formatCurrency(addon.unitPrice * addon.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-white/82">
            <div className="flex items-center justify-between">
              <p>Total room charges</p>
              <p className="font-bold text-white">{formatCurrency(roomSubtotal)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p>Total extra charges</p>
              <p className="font-bold text-white">{formatCurrency(addonSubtotal)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1">
                Total taxes
                <span className="group relative inline-flex">
                  <Info className="h-3.5 w-3.5 text-white/45" />
                  <span className="pointer-events-none absolute left-0 top-[calc(100%+8px)] hidden min-w-[180px] rounded-md border border-white/15 bg-[#10111a] px-3 py-2 text-[11px] leading-4 text-white/85 shadow-[0_10px_28px_rgba(0,0,0,0.35)] group-hover:block">
                    <span className="block">Room tax - {formatCurrency(roomTaxExact)}</span>
                    <span className="mt-1 block">Add-on tax - {formatCurrency(addonTaxExact)}</span>
                  </span>
                </span>
              </p>
              <p className="font-bold text-white">{formatCurrency(taxes)}</p>
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-4">
              <p className="text-lg font-bold uppercase text-white">Total price</p>
              <p className="text-[28px] font-bold text-[#00f0ff]">{formatCurrency(estimatedGrandTotal)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.03] px-6 py-4 text-sm text-white/88">
          You will earn <span className="font-bold text-[#ffdf00]">{coinsEarned} coins</span> on this booking
        </div>

        <div className="p-6 pt-4">
          {activeTab === "guest" ? (
            <button
              className="w-full rounded-[12px] bg-[#c62828] px-4 py-3 text-sm font-bold leading-none whitespace-nowrap uppercase tracking-[0.04em] text-white shadow-[4px_4px_0px_rgba(0,0,0,0.45)] sm:px-5 sm:py-4 sm:text-base lg:text-lg"
              onClick={openAddonsTab}
              type="button"
            >
              Continue to add-ons
            </button>
          ) : (
            <button
              className="w-full rounded-[12px] bg-[#c62828] px-4 py-3 text-sm font-bold leading-none whitespace-nowrap uppercase tracking-[0.04em] text-white shadow-[4px_4px_0px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-4 sm:text-base lg:text-lg"
              disabled={isPaying}
              onClick={openPaymentFlow}
              type="button"
            >
              {isPaying ? "Opening Razorpay..." : "Continue to payment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const reviewTabs = [
    { key: "guest" as const, label: "Guest details", icon: User, sticker: "Names first" },
    { key: "addons" as const, label: "Add to your stay", icon: PlusCircle, sticker: "Pay secure" },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#07070a] pb-28 text-white lg:pb-12">
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-8 pt-20 md:px-6 md:pb-12 md:pt-24">
        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(58,95,132,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(198,40,40,0.12),transparent_24%),linear-gradient(135deg,rgba(26,26,26,0.96),rgba(17,17,17,0.96))] px-4 py-5 shadow-[10px_10px_0px_rgba(0,0,0,0.24)] sm:rounded-[30px] sm:px-5 sm:py-6 md:px-8 md:py-8">
          <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:gap-6">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pb-0">
                <StickerTag bg="#fef08a" className="shrink-0 px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.1em] sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.12em]" label="Review booking" rotate="rotate-[-2deg]" text="#111827" />
                <StickerTag bg="#00d1ff" className="shrink-0 px-3 py-1.5 text-[10px] font-bold not-italic uppercase tracking-[0.1em] sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.12em]" label="Rates locked" rotate="rotate-[1deg]" text="#111827" />
                <StickerTag bg="#39ff14" className="hidden shrink-0 px-4 py-2 text-[11px] font-bold not-italic uppercase tracking-[0.12em] sm:inline-flex" label="Add-ons synced live" rotate="rotate-[-1deg]" text="#111827" />
              </div>

              <div>
                <p className="vh-chip inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/72 sm:text-[11px] sm:tracking-[0.16em]">
                  Stay tuned. Check fast. Pay once.
                </p>
                <h1 className="mt-3 max-w-4xl leading-none sm:mt-4">
                  <span className="vh-retro-sign-flat block text-[1.22rem] leading-[1.06] sm:text-[2rem] md:text-[3.8rem] lg:text-[4.6rem]">
                    Lock the bunk.
                  </span>
                  <span className="vh-retro-sign-flat mt-0.5 block text-[1.08rem] leading-[1.06] sm:mt-1 sm:text-[1.75rem] md:text-[3.2rem] lg:text-[4rem] text-[var(--vh-ice)]">
                    Add the fun.
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/76 md:mt-4 md:max-w-2xl md:leading-7 md:text-base">
                  Guest details, stay upgrades, and payment now sit in one booking lane. This page keeps the energy of the property page, but the flow stays strict: details first, extras next, payment last.
                </p>
              </div>

              <Carousel className="w-full pr-1">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {weeklyLineup.map((item) => (
                    <CarouselItem key={item.day} className="basis-full pl-2 sm:basis-1/2 md:pl-4 lg:basis-1/3">
                      <div className="p-1">
                        <Card className="rounded-[18px] border border-white/10 bg-black/20">
                          <CardContent className="px-4 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: item.color }}>
                              {item.day}
                            </p>
                            <p className="mt-2 text-lg font-bold leading-tight text-white sm:text-xl">{item.event}</p>
                            <p className="mt-2 inline-flex rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#ffdf00]">
                              {item.hook}
                            </p>
                            <p className="mt-2 text-sm text-white/78">{item.description}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-3 hidden h-8 w-8 border-white/20 bg-black/55 text-white hover:bg-black/70 sm:flex" />
                <CarouselNext className="-right-3 hidden h-8 w-8 border-white/20 bg-black/55 text-white hover:bg-black/70 sm:flex" />
              </Carousel>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-[rgba(0,0,0,0.28)] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.22)] sm:rounded-[24px] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffdf00]">Tonight&apos;s scene</p>
                  <p className="mt-2 text-lg font-bold uppercase leading-tight text-white sm:text-2xl">Pre-book the stay. Plan the night.</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-5 text-white/72 sm:leading-6">
                Heading out after check-in? Browse the latest community nights, open mics, and rooftop scenes before you pay.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                <Button asChild className="w-full rounded-full bg-[#ffdf00] px-5 text-black whitespace-nowrap hover:bg-[#ffe864] sm:w-auto">
                  <Link href="/events">See event calendar</Link>
                </Button>
                <Button asChild className="w-full rounded-full border border-white/15 bg-white/5 px-5 text-white whitespace-nowrap hover:bg-white/10 sm:w-auto">
                  <Link href="/events?tab=rsvp">Open RSVP board</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mb-10 mt-8 flex max-w-[760px] items-center justify-center">
          <div className="grid w-full items-start gap-3" style={{ gridTemplateColumns: `repeat(${reviewTabs.length}, minmax(0, 1fr))` }}>
            {reviewTabs.map((tab, index) => {
              const isActive = activeTab === tab.key;
              const isComplete = tab.key === "guest" && activeTab !== "guest";
              const Icon = tab.icon;

              return (
                <div key={tab.key} className="relative flex flex-col items-center gap-3">
                  {index < reviewTabs.length - 1 ? (
                    <div className={`absolute left-[calc(50%+28px)] top-6 hidden h-[2px] w-[calc(100%-56px)] md:block ${activeTab !== "guest" && index === 0 ? "bg-[#c62828]" : "bg-white/10"}`} />
                  ) : null}
                  <button
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-[14px] ${tabButtonClasses(isActive, isComplete)}`}
                    onClick={() => handleTabClick(tab.key)}
                    type="button"
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                  <div className="flex flex-col items-center gap-2">
                    <p className={`text-center text-[11px] font-bold uppercase tracking-[0.08em] ${isActive || isComplete ? "text-white" : "text-white/45"}`}>
                      {tab.label}
                    </p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isActive || isComplete ? "bg-white/10 text-white/75" : "bg-white/5 text-white/35"}`}>
                      {tab.sticker}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_360px] lg:items-start">
          <div className="space-y-6">
            {activeTab === "guest" ? (
              <>
                <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#1A1A1A] shadow-[8px_8px_0px_rgba(0,0,0,0.28)]">
                  <div className="border-l-[8px] border-l-[#c62828] p-6 md:p-8">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase text-white">Guest details</h2>
                        <p className="mt-2 text-sm leading-6 text-white/65">
                          Primary guest details are required now. Additional guest details are optional and can be updated later.
                        </p>
                      </div>
                      {!isAuthenticated ? (
                        <button
                          className="rounded-full border border-[rgba(0,240,255,0.3)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#00f0ff]"
                          onClick={() => openAuthModal("signin")}
                          type="button"
                        >
                          Sign in
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/60">First name *</span>
                        <input
                          autoComplete="given-name"
                          className={`w-full rounded-[14px] border bg-black/30 px-4 py-4 text-base text-white outline-none ${guestErrors.firstName ? "border-[#ff2e62]" : "border-white/10 focus:border-[#c62828]"}`}
                          onChange={(event) => updateGuestField("firstName", event.target.value)}
                          value={guestForm.firstName}
                        />
                        {guestErrors.firstName ? <span className="mt-2 block text-xs text-[#ff2e62]">{guestErrors.firstName}</span> : null}
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/60">Last name *</span>
                        <input
                          autoComplete="family-name"
                          className={`w-full rounded-[14px] border bg-black/30 px-4 py-4 text-base text-white outline-none ${guestErrors.lastName ? "border-[#ff2e62]" : "border-white/10 focus:border-[#c62828]"}`}
                          onChange={(event) => updateGuestField("lastName", event.target.value)}
                          value={guestForm.lastName}
                        />
                        {guestErrors.lastName ? <span className="mt-2 block text-xs text-[#ff2e62]">{guestErrors.lastName}</span> : null}
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/60">Email *</span>
                        <input
                          autoComplete="email"
                          className={`w-full rounded-[14px] border bg-black/30 px-4 py-4 text-base text-white outline-none ${guestErrors.email ? "border-[#ff2e62]" : "border-white/10 focus:border-[#c62828]"}`}
                          onChange={(event) => updateGuestField("email", normalizeEmail(event.target.value))}
                          type="email"
                          value={guestForm.email}
                        />
                        <span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-white/40">
                          {guestErrors.email || "Confirmation email will be sent here"}
                        </span>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/60">Phone number *</span>
                        <input
                          autoComplete="tel"
                          className={`w-full rounded-[14px] border bg-black/30 px-4 py-4 text-base text-white outline-none ${guestErrors.phone ? "border-[#ff2e62]" : "border-white/10 focus:border-[#c62828]"}`}
                          inputMode="tel"
                          onChange={(event) => updateGuestField("phone", normalizePhone(event.target.value))}
                          placeholder="Enter phone number"
                          type="tel"
                          value={guestForm.phone}
                        />
                        <span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-white/40">
                          {guestErrors.phone || "Helps us reach you if needed"}
                        </span>
                      </label>
                    </div>

                    {guestForm.additionalGuests.length > 0 ? (
                      <div className="mt-6 rounded-[14px] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">Other guest details</p>
                            <p className="text-xs uppercase tracking-[0.12em] text-white/45">
                              Optional for {guestForm.additionalGuests.length} {guestForm.additionalGuests.length === 1 ? "guest" : "guests"}
                            </p>
                          </div>
                          <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white/55">
                            Optional
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          {guestForm.additionalGuests.map((additionalGuest, index) => (
                            <div key={`additional-guest-${index}`} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
                              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white/72">Guest {index + 2}</p>
                              <div className="mt-3 grid gap-4 md:grid-cols-2">
                                <label className="block">
                                  <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/50">Full name</span>
                                  <input
                                    className="w-full rounded-[12px] border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#00f0ff]"
                                    onChange={(event) => updateAdditionalGuest(index, "name", event.target.value)}
                                    value={additionalGuest.name}
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/50">Phone number</span>
                                  <input
                                    className="w-full rounded-[12px] border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#00f0ff]"
                                    inputMode="tel"
                                    onChange={(event) => updateAdditionalGuest(index, "phone", normalizePhone(event.target.value))}
                                    type="tel"
                                    value={additionalGuest.phone}
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className={`mt-6 rounded-[14px] border bg-[rgba(198,40,40,0.1)] p-4 ${guestErrors.acceptedTerms ? "border-[#ff2e62]" : "border-[rgba(198,40,40,0.2)]"}`}>
                      <label className="flex items-start gap-3">
                        <input
                          checked={guestForm.acceptedTerms}
                          className="mt-1 h-4 w-4 accent-[#c62828]"
                          onChange={(event) => updateGuestField("acceptedTerms", event.target.checked)}
                          type="checkbox"
                        />
                        <span className="text-sm leading-6 text-white/80">
                          Yes, I confirm <span className="font-bold text-white">all the guests are above 18 year old</span> and I acknowledge and accept the{" "}
                          <Link className="text-[#00f0ff] hover:underline" href="/policies/guest">
                            Terms of Booking Conditions, Cancellation Policy &amp; Property Policy.
                          </Link>
                        </span>
                      </label>
                      {guestErrors.acceptedTerms ? <span className="mt-2 block text-xs text-[#ff2e62]">{guestErrors.acceptedTerms}</span> : null}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#1A1A1A] shadow-[8px_8px_0px_rgba(0,0,0,0.28)]">
                  <div className="border-l-[8px] border-l-[#ffdf00] p-6 md:p-8">
                    <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase text-white">Coupon codes</h2>
                    <div className="mt-5 flex gap-3">
                      <input
                        className="flex-1 rounded-[14px] border border-white/10 bg-black/30 px-4 py-4 text-base text-white outline-none focus:border-[#ffdf00]"
                        onChange={(event) => updateGuestField("coupon", event.target.value.toUpperCase())}
                        placeholder="Have a coupon code?"
                        value={guestForm.coupon}
                      />
                      <button className="rounded-[12px] border border-[#ffdf00] px-5 text-sm font-bold uppercase tracking-[0.08em] text-[#ffdf00]" type="button">
                        Apply
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-white/40">
                      Coupon selection is captured for review. Discount computation is not applied in this screen yet.
                    </p>

                    <div className="mt-5 space-y-3">
                      {PROMO_CODES.map((coupon) => (
                        <button
                          key={coupon.code}
                          className={`block w-full rounded-[14px] border p-4 text-left ${guestForm.coupon === coupon.code ? "border-[#ffdf00] bg-[rgba(255,223,0,0.06)]" : "border-white/10 bg-black/20"}`}
                          onClick={() => updateGuestField("coupon", coupon.code)}
                          type="button"
                        >
                          <p className="text-base font-bold uppercase tracking-[0.08em] text-white">{coupon.code}</p>
                          <p className="mt-1 text-sm font-bold text-[#39ff14]">{coupon.description}</p>
                          <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-white/40">Terms &amp; Conditions</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#1A1A1A] shadow-[8px_8px_0px_rgba(0,0,0,0.28)]">
                  <div className="border-l-[8px] border-l-[#00f0ff] p-6 md:p-8">
                    <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase text-white">Booking policies</h2>
                    <div className="mt-4">
                      <Accordion defaultValue={["general-policy"]} type="multiple">
                        {POLICY_SECTIONS.map((policy) => (
                          <AccordionItem key={policy.id} className="border-b border-white/5" value={policy.id}>
                            <AccordionTrigger className="text-base font-medium text-white/80">{policy.label}</AccordionTrigger>
                            <AccordionContent className="space-y-2 text-sm leading-6">
                              {policy.content.map((line) => (
                                <p key={line}>- {line}</p>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === "addons" ? (
              <>
                <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#1A1A1A] shadow-[8px_8px_0px_rgba(0,0,0,0.28)]">
                  <div className="border-l-[8px] border-l-[#ffdf00] p-6 md:p-8">
                    <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase text-white">Add essentials</h2>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      Live inventory is pulled from the guest store API. Chargeable essentials and returnable stay items both render from the database-backed catalog.
                    </p>

                    {catalogLoading ? (
                      <div aria-busy="true" aria-live="polite" className="mt-5 space-y-3" role="status">
                        <span className="sr-only">Loading add-ons from the property store.</span>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={`catalog-loading-${index}`} className="flex items-center justify-between rounded-[14px] border border-white/10 bg-black/20 px-4 py-4">
                            <div className="flex min-w-0 items-center gap-4">
                              <Skeleton className="h-12 w-12 rounded-[14px] bg-white/10" />
                              <div className="min-w-0 space-y-2">
                                <Skeleton className="h-4 w-44 bg-white/10" />
                                <Skeleton className="h-3 w-28 bg-white/10" />
                              </div>
                            </div>
                            <Skeleton className="h-9 w-20 rounded-[10px] bg-white/10" />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {catalogError ? (
                      <div className="mt-5 rounded-[14px] border border-[rgba(255,76,48,0.24)] bg-[rgba(255,76,48,0.1)] px-4 py-4 text-sm text-white/88">
                        {catalogError}
                      </div>
                    ) : null}

                    {!catalogLoading && commodityItems.length === 0 && !catalogError ? (
                      <div className="mt-5 rounded-[14px] border border-dashed border-white/12 bg-black/20 px-4 py-5 text-sm text-white/70">
                        No essentials are available right now for this property.
                      </div>
                    ) : null}

                    <div className="mt-5 divide-y divide-white/5">
                      {commodityItems.map((item) => {
                        const Icon = addonIcon(item.name);
                        const quantity = draft.addons.find((addon) => addon.productId === item.id)?.quantity ?? 0;
                        const disabled = isItemDisabled(item);
                        const helperMessage = inventoryMessageById[item.id];

                        return (
                          <div key={item.id} className={`flex items-center justify-between gap-4 py-4 ${disabled ? "opacity-55" : ""}`}>
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[rgba(255,223,0,0.3)] bg-[rgba(255,223,0,0.1)] text-[#f1f5f9]">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-bold text-white">{item.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-white/40 line-through">{formatCurrency(item.base_price * 1.1)}</span>
                                  <span className="font-bold text-white">{formatCurrency(item.base_price)}</span>
                                </div>
                                {item.category === "RETURNABLE" ? (
                                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#00f0ff]">Issued for stay, collected later</p>
                                ) : null}
                                {disabled ? (
                                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#ffdf00]">Avail at property</p>
                                ) : helperMessage ? (
                                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#ffdf00]">{helperMessage}</p>
                                ) : null}
                              </div>
                            </div>

                            {quantity > 0 ? (
                              <div className="flex items-center gap-3 rounded-[10px] border border-white/10 bg-black/40 px-2 py-1">
                                <button className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#ffdf00] hover:bg-white/5" onClick={() => decrementAddon(item)} type="button">
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-4 text-center text-base font-bold text-white">{quantity}</span>
                                <button className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#ffdf00] hover:bg-white/5" onClick={() => incrementAddon(item)} type="button">
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="rounded-[10px] bg-[#ffdf00] px-5 py-2 text-sm font-bold uppercase tracking-[0.08em] text-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                                disabled={disabled}
                                onClick={() => incrementAddon(item)}
                                type="button"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#1A1A1A] shadow-[8px_8px_0px_rgba(0,0,0,0.28)]">
                  <div className="border-l-[8px] border-l-[#00f0ff] p-6 md:p-8">
                    <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase text-white">Add to your stay</h2>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      Service upgrades do not expose stock counts. Quantities stay dynamic and follow the catalog returned by the API.
                    </p>

                    {!catalogLoading && serviceItems.length === 0 ? (
                      <div className="mt-5 rounded-[14px] border border-dashed border-white/12 bg-black/20 px-4 py-5 text-sm text-white/70">
                        No service add-ons are configured for this property yet.
                      </div>
                    ) : null}

                    <div className="mt-5 divide-y divide-white/5">
                      {serviceItems.map((item) => {
                        const Icon = addonIcon(item.name);
                        const quantity = draft.addons.find((addon) => addon.productId === item.id)?.quantity ?? 0;
                        const singleQuantity = isSingleQuantityService(item);
                        const helperMessage = inventoryMessageById[item.id] || (singleQuantity ? "Only 1 per booking" : "");

                        return (
                          <div key={item.id} className="flex items-center justify-between gap-4 py-4">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.1)] text-[#f1f5f9]">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-bold text-white">{item.name}</p>
                                <p className="text-sm text-white/50">
                                  {item.base_price > 0 ? `Starts at ${formatCurrency(item.base_price)}` : "Included on request"}
                                </p>
                                {helperMessage ? (
                                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#00f0ff]">{helperMessage}</p>
                                ) : null}
                              </div>
                            </div>

                            {quantity > 0 ? (
                              <div className="flex items-center gap-3 rounded-[10px] border border-white/10 bg-black/40 px-2 py-1">
                                <button className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#00f0ff] hover:bg-white/5" onClick={() => decrementAddon(item)} type="button">
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-4 text-center text-base font-bold text-white">{quantity}</span>
                                <button
                                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#00f0ff] hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/25 disabled:hover:bg-transparent"
                                  disabled={singleQuantity && quantity >= 1}
                                  onClick={() => incrementAddon(item)}
                                  type="button"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="rounded-[10px] border border-[#00f0ff] px-5 py-2 text-sm font-bold uppercase tracking-[0.08em] text-[#00f0ff]"
                                onClick={() => incrementAddon(item)}
                                type="button"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === "confirmation" ? (
              <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#1A1A1A] shadow-[8px_8px_0px_rgba(0,0,0,0.28)]">
                <div className="border-l-[8px] border-l-[#c62828] p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase text-white">Booking confirmation</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                        This step validates live availability again, creates the pending booking in the backend, and opens Razorpay only after the cart passes server-side checks.
                      </p>
                    </div>
                    <div className="rounded-full border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.08)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#00f0ff]">
                      Status: {flowStage.replaceAll("-", " ")}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
                      <p className="font-semibold text-white">Inventory is revalidated before payment</p>
                      <p className="mt-2 text-sm leading-6 text-white/66">
                        The backend re-checks room and add-on availability before the Razorpay order is created.
                      </p>
                    </div>
                    <div className="rounded-[14px] border border-white/10 bg-white/5 p-4">
                      <p className="font-semibold text-white">Razorpay test mode</p>
                      <p className="mt-2 text-sm leading-6 text-white/66">
                        Use sandbox credentials in the widget. Payment confirmation is verified through the backend before redirect.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[16px] border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Ready to pay</p>
                        <p className="mt-2 text-2xl font-bold text-[#00f0ff]">{formatCurrency(estimatedGrandTotal)}</p>
                      </div>
                      <button
                        className="rounded-[12px] bg-[#c62828] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[4px_4px_0px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isPaying}
                        onClick={() => setTriggerPaymentOpen(true)}
                        type="button"
                      >
                        {isPaying ? (
                          <span className="inline-flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Opening Razorpay
                          </span>
                        ) : (
                          "Open Razorpay"
                        )}
                      </button>
                    </div>
                  </div>

                  {errorMessage ? (
                    <div className="mt-5 rounded-[14px] border border-[rgba(255,76,48,0.24)] bg-[rgba(255,76,48,0.1)] px-4 py-4 text-sm text-white/88">
                      {errorMessage}
                    </div>
                  ) : null}

                  {verifyErrorMessage ? (
                    <div className="mt-5 rounded-[14px] border border-[rgba(255,204,102,0.24)] bg-[rgba(255,204,102,0.1)] px-4 py-4 text-sm text-white/90">
                      Verification failed after checkout success: {verifyErrorMessage}
                    </div>
                  ) : null}

                  {failErrorMessage ? (
                    <div className="mt-5 rounded-[14px] border border-[rgba(255,76,48,0.24)] bg-[rgba(255,76,48,0.1)] px-4 py-4 text-sm text-white/90">
                      {failErrorMessage}
                    </div>
                  ) : null}

                  <details className="mt-6 rounded-[14px] border border-white/10 bg-white/5 p-4 text-xs text-white/80">
                    <summary className="cursor-pointer select-none font-semibold text-white">
                      Temporary booking diagnostics ({flowStage})
                    </summary>
                    <div className="mt-3 space-y-3">
                      {diagnostics.length === 0 ? (
                        <p className="text-white/55">No events yet. Opening Razorpay will start diagnostics capture.</p>
                      ) : (
                        diagnostics.map((event) => (
                          <div key={event.id} className="rounded-[12px] border border-white/10 bg-[#0b1020] p-3">
                            <p className="font-semibold text-white">
                              {event.step} - {event.status}
                            </p>
                            <p className="mt-1 text-[11px] text-white/50">{new Date(event.timestamp).toLocaleString()}</p>
                            {event.error ? (
                              <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-[10px] bg-[rgba(255,76,48,0.12)] p-2 text-[11px] text-white">
                                {event.error}
                              </pre>
                            ) : null}
                            {typeof event.request !== "undefined" ? (
                              <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-[10px] bg-black/30 p-2 text-[11px] text-white/90">
                                req: {toDiagnosticPreview(event.request)}
                              </pre>
                            ) : null}
                            {typeof event.response !== "undefined" ? (
                              <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-[10px] bg-black/30 p-2 text-[11px] text-white/90">
                                res: {toDiagnosticPreview(event.response)}
                              </pre>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                </div>
              </div>
            ) : null}
          </div>

          {bookingSummaryDesktop}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(17,17,17,0.96)] backdrop-blur-md lg:hidden">
        <div className="h-1 bg-[#c62828]" />
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xl font-bold text-white">{formatCurrency(estimatedGrandTotal)}</p>
            <button className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#00f0ff]" onClick={() => setShowMobileSummary(true)} type="button">
              Price breakup
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>

          {activeTab === "guest" ? (
            <button className="rounded-[10px] bg-[#ffdf00] px-5 py-3 text-sm font-bold uppercase text-black shadow-[4px_4px_0px_rgba(0,0,0,0.45)]" onClick={openAddonsTab} type="button">
              Continue
            </button>
          ) : (
            <button
              className="rounded-[10px] bg-[#ffdf00] px-5 py-3 text-sm font-bold uppercase text-black shadow-[4px_4px_0px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPaying}
              onClick={openPaymentFlow}
              type="button"
            >
              {isPaying ? "Opening..." : "Pay now"}
            </button>
          )}
        </div>
      </div>

      <div className={`fixed inset-0 z-[60] transition ${showMobileSummary ? "pointer-events-auto bg-black/80" : "pointer-events-none bg-transparent"}`}>
        <div className={`absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[28px] border-t border-white/10 bg-[#1A1A1A] transition-transform duration-300 ${showMobileSummary ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-lg font-bold uppercase text-white">Booking details</p>
              <p className="text-xs uppercase tracking-[0.12em] text-white/45">Review the current price breakup</p>
            </div>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white" onClick={() => setShowMobileSummary(false)} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Check-in</p>
                <p className="mt-1 text-base font-bold text-white">{formatDateLabel(draft.checkinDate)}</p>
                <p className="text-[10px] text-white/40">from {propertyGuidelines.checkIn}</p>
              </div>
              <div className="rounded bg-[#ffdf00] px-2 py-1 text-[10px] font-bold uppercase text-black">
                {nights} {nights === 1 ? "Night" : "Nights"}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Check-out</p>
                <p className="mt-1 text-base font-bold text-white">{formatDateLabel(draft.checkoutDate)}</p>
                <p className="text-[10px] text-white/40">by {propertyGuidelines.checkOut}</p>
              </div>
            </div>

            <div className="space-y-3">
              {draft.rooms.map((room) => (
                <div key={room.roomTypeId} className="flex items-start justify-between gap-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-4">
                  <div>
                    <p className="font-semibold text-white">{room.title}</p>
                    <p className="text-xs text-white/55">
                      {formatCurrency(room.basePrice)} x {room.quantity} x {nights} night{nights === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="font-semibold text-white">{formatCurrency(room.basePrice * room.quantity * nights)}</p>
                </div>
              ))}
              {activeAddons.map((addon) => (
                <div key={addon.productId} className="flex items-start justify-between gap-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-4">
                  <div>
                    <p className="font-semibold text-white">{addon.name}</p>
                    <p className="text-xs text-white/55">
                      {formatCurrency(addon.unitPrice)} x {addon.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-white">{formatCurrency(addon.unitPrice * addon.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-[14px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/82">
              <div className="flex items-center justify-between">
                <p>Total room charges</p>
                <p className="font-bold text-white">{formatCurrency(roomSubtotal)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p>Total extra charges</p>
                <p className="font-bold text-white">{formatCurrency(addonSubtotal)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p>Total taxes</p>
                <p className="font-bold text-white">{formatCurrency(taxes)}</p>
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-4">
                <p className="text-lg font-bold uppercase text-white">Total price</p>
                <p className="text-[28px] font-bold text-[#00f0ff]">{formatCurrency(estimatedGrandTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
