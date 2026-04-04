"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileSearch,
  IdCard,
  LoaderCircle,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Button } from "@/components/ui/button";
import {
  addBookingKycSlot,
  deleteBookingKycSlot,
  getBookingKycDetail,
  getBookingKycSlots,
  getBookingKycUploadUrl,
  getStoreCatalog,
  linkGuestBooking,
  runBookingKycOcr,
  submitBookingKyc,
  uploadFileToPresignedUrl,
  type BookingKycDetailResponse,
  type BookingSlotSummary,
  type KycSubmitPayload,
  type StoreCatalogItem,
} from "@/lib/booking-api";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { cn } from "@/lib/utils";

import { BookingEmptyState, BookingPageShell } from "./booking-shell";

type KycEditorState = KycSubmitPayload & {
  front_image_key?: string;
  back_image_key?: string;
};

const KYC_ID_TYPES = ["AADHAAR", "VOTER_ID", "DRIVING_LICENCE", "PASSPORT"];
const KYC_PURPOSES = ["LEISURE", "BUSINESS", "MEDICAL", "TRANSIT", "OTHER"];

function emptyKycState(): KycEditorState {
  return {
    nationality_type: "INDIAN",
    id_type: "AADHAAR",
    full_name: "",
    date_of_birth: "",
    id_number: "",
    permanent_address: "",
    contact_number: "",
    coming_from: "",
    going_to: "",
    purpose: "LEISURE",
    consent_given: false,
  };
}

function createEditorState(
  kyc: BookingKycDetailResponse["kyc"],
  slotGuestName?: string | null,
  guestPhone?: string | null,
): KycEditorState {
  if (!kyc) {
    return {
      ...emptyKycState(),
      full_name: slotGuestName || "",
      contact_number: guestPhone || "",
    };
  }

  return {
    nationality_type: kyc.nationality_type || "INDIAN",
    id_type: kyc.id_type || "AADHAAR",
    full_name: kyc.full_name || slotGuestName || "",
    date_of_birth: kyc.date_of_birth || "",
    id_number: kyc.id_number || "",
    permanent_address: kyc.permanent_address || "",
    contact_number: kyc.contact_number || guestPhone || "",
    coming_from: kyc.coming_from || "",
    going_to: kyc.going_to || "",
    purpose: kyc.purpose || "LEISURE",
    front_image_url: kyc.front_image_url || undefined,
    back_image_url: kyc.back_image_url || undefined,
    consent_given: Boolean(kyc.consent_given),
  };
}

function validateKycPayload(payload: KycSubmitPayload): string[] {
  const errors: string[] = [];
  const trimmedFullName = payload.full_name.trim();
  const trimmedIdNumber = payload.id_number.trim();
  const trimmedAddress = payload.permanent_address.trim();
  const trimmedContact = payload.contact_number.trim();
  const trimmedComingFrom = payload.coming_from.trim();
  const trimmedGoingTo = payload.going_to.trim();

  if (payload.nationality_type !== "INDIAN") {
    errors.push("Nationality must be INDIAN for this KYC flow.");
  }

  if (!KYC_ID_TYPES.includes(payload.id_type)) {
    errors.push("Select a valid ID type before submitting.");
  }

  if (trimmedFullName.length === 0) {
    errors.push("Full name is required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date_of_birth)) {
    errors.push("Date of birth must be in YYYY-MM-DD format.");
  } else {
    const birthDate = new Date(`${payload.date_of_birth}T00:00:00`);
    const minimumAdultDate = new Date();
    minimumAdultDate.setFullYear(minimumAdultDate.getFullYear() - 18);
    if (birthDate > minimumAdultDate) {
      errors.push("Guest must be 18 years or older.");
    }
  }

  if (trimmedIdNumber.length === 0) {
    errors.push("ID number is required.");
  }

  if (trimmedAddress.length === 0) {
    errors.push("Permanent address is required.");
  }

  if (!/^\+\d{10,15}$/.test(trimmedContact)) {
    errors.push("Contact number must include country code, for example +919876543210.");
  }

  if (trimmedComingFrom.length === 0) {
    errors.push("Coming from is required.");
  }

  if (trimmedGoingTo.length === 0) {
    errors.push("Going to is required.");
  }

  if (!KYC_PURPOSES.includes(payload.purpose)) {
    errors.push("Select a valid purpose before submitting.");
  }

  if (!payload.consent_given) {
    errors.push("Consent is required before you can submit KYC.");
  }

  return errors;
}

function normaliseOcrDate(input?: string | null): string {
  if (!input) {
    return "";
  }

  const match = input.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function publicFileUrlFromUploadUrl(uploadUrl: string): string {
  return uploadUrl.split("?")[0] || uploadUrl;
}

function slotStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function slotStatusTone(status: string): string {
  if (status === "PRE_VERIFIED" || status === "VERIFIED") {
    return "border-[rgba(57,247,44,0.2)] bg-[rgba(57,247,44,0.08)] text-[var(--vh-lime)]";
  }

  if (status === "PENDING") {
    return "border-[rgba(255,204,102,0.2)] bg-[rgba(255,204,102,0.08)] text-[var(--vh-amber)]";
  }

  if (status === "REJECTED") {
    return "border-[rgba(255,76,48,0.2)] bg-[rgba(255,76,48,0.08)] text-[var(--vh-hot)]";
  }

  return "border-white/10 bg-white/5 text-white/70";
}

function missionStepCount(editorState: KycEditorState): number {
  const hasDocument = Boolean(editorState.front_image_key || editorState.front_image_url);
  const identityComplete = Boolean(
    editorState.full_name.trim() &&
      editorState.date_of_birth &&
      editorState.id_number.trim(),
  );
  const travelComplete = Boolean(
    editorState.permanent_address.trim() &&
      editorState.contact_number.trim() &&
      editorState.coming_from.trim() &&
      editorState.going_to.trim() &&
      editorState.purpose,
  );
  const consentComplete = editorState.consent_given;

  return [hasDocument, identityComplete, travelComplete, consentComplete].filter(Boolean).length;
}

export function PreArrivalPage({ ezeeReservationId }: { ezeeReservationId: string }) {
  const { guest, isAuthenticated, isRestoringSession, openAuthModal } = useGuestAuth();
  const [bookingTitle, setBookingTitle] = useState<string>("Pre-arrival setup");
  const [activeTab, setActiveTab] = useState<"kyc" | "addons">("kyc");
  const [catalogItems, setCatalogItems] = useState<StoreCatalogItem[]>([]);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [slots, setSlots] = useState<BookingSlotSummary[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<KycEditorState>(emptyKycState);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    toast.success("Pre-arrival update", {
      description: successMessage,
    });
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    toast.error("Pre-arrival action failed", {
      description: errorMessage,
    });
  }, [errorMessage]);

  const activeSlot = useMemo(
    () => slots.find((slot) => slot.slot_id === activeSlotId) ?? null,
    [activeSlotId, slots],
  );
  const completedSlotCount = useMemo(
    () => slots.filter((slot) => slot.kyc_status === "PRE_VERIFIED" || slot.kyc_status === "VERIFIED").length,
    [slots],
  );
  const activeMissionSteps = useMemo(() => missionStepCount(editorState), [editorState]);

  const canEditActiveSlot =
    Boolean(activeSlot?.can_edit ?? true) &&
    activeSlot?.kyc_status !== "PRE_VERIFIED" &&
    activeSlot?.kyc_status !== "VERIFIED";

  const loadSlots = useCallback(async (selectedSlotId?: string) => {
    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0) {
      setIsLoading(false);
      return;
    }
    const token = storedToken;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [detail, slotResponse] = await Promise.all([
        linkGuestBooking(token, ezeeReservationId),
        getBookingKycSlots(token, ezeeReservationId),
      ]);

      const catalog = await getStoreCatalog(detail.booking.property_id).catch(() => []);
      setCatalogItems(catalog);

      setBookingTitle(detail.booking.room_type_name || "Pre-arrival setup");
      setSlots(slotResponse.slots);

      const nextActiveFromState = activeSlotId && slotResponse.slots.some((slot) => slot.slot_id === activeSlotId)
        ? activeSlotId
        : null;
      const preferredSlotId = selectedSlotId
        || nextActiveFromState
        || slotResponse.slots.find((slot) => slot.guest_id)?.slot_id
        || slotResponse.slots[0]?.slot_id
        || null;

      setActiveSlotId(preferredSlotId);

      if (preferredSlotId) {
        const slotDetail = await getBookingKycDetail(token, ezeeReservationId, preferredSlotId);
        const selectedSlot = slotResponse.slots.find((slot) => slot.slot_id === preferredSlotId) ?? null;
        setEditorState(createEditorState(slotDetail.kyc, selectedSlot?.guest_name, guest?.phone));
      } else {
        setEditorState(createEditorState(null, null, guest?.phone));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load pre-arrival setup.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSlotId, ezeeReservationId, guest?.phone]);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    void loadSlots();
  }, [isAuthenticated, isRestoringSession, loadSlots]);

  async function selectSlot(nextSlotId: string) {
    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0) {
      return;
    }
    const token = storedToken;

    setActiveSlotId(nextSlotId);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const slotDetail = await getBookingKycDetail(token, ezeeReservationId, nextSlotId);
      const nextSlot = slots.find((slot) => slot.slot_id === nextSlotId) ?? null;
      setEditorState(createEditorState(slotDetail.kyc, nextSlot?.guest_name, guest?.phone));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to open this slot.");
    }
  }

  async function handleAddSlot() {
    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0) {
      return;
    }
    const token = storedToken;

    setIsMutating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const newSlot = await addBookingKycSlot(token, ezeeReservationId);
      await loadSlots(newSlot.slot_id);
      setSuccessMessage(`Added ${newSlot.label}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add another guest slot.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteSlot(slotId: string) {
    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0) {
      return;
    }
    const token = storedToken;

    setIsMutating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (slotId === activeSlotId) {
        setActiveSlotId(null);
      }
      const response = await deleteBookingKycSlot(token, ezeeReservationId, slotId);
      await loadSlots();
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete this slot.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleUpload(side: "front" | "back", file: File) {
    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0) {
      return;
    }
    const token = storedToken;

    if (side === "front") {
      setIsUploadingFront(true);
    } else {
      setIsUploadingBack(true);
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const upload = await getBookingKycUploadUrl(token, ezeeReservationId, {
        file_name: file.name,
        content_type: file.type || "application/octet-stream",
      });

      await uploadFileToPresignedUrl(upload.uploadUrl, file);

      setEditorState((current) => ({
        ...current,
        ...(side === "front"
          ? {
              front_image_key: upload.fileKey,
              front_image_url: publicFileUrlFromUploadUrl(upload.uploadUrl),
            }
          : {
              back_image_key: upload.fileKey,
              back_image_url: publicFileUrlFromUploadUrl(upload.uploadUrl),
            }),
      }));

      setSuccessMessage(`${side === "front" ? "Front" : "Back"} document uploaded.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      if (side === "front") {
        setIsUploadingFront(false);
      } else {
        setIsUploadingBack(false);
      }
    }
  }

  async function handleRunOcr() {
    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0 || !activeSlotId || !editorState.front_image_key) {
      return;
    }
    const token = storedToken;

    setIsRunningOcr(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const ocr = await runBookingKycOcr(token, ezeeReservationId, activeSlotId, {
        front_image_key: editorState.front_image_key,
        ...(editorState.back_image_key ? { back_image_key: editorState.back_image_key } : {}),
      });

      setEditorState((current) => ({
        ...current,
        id_type: ocr.id_type_detected || current.id_type,
        full_name: ocr.ocr_name || current.full_name,
        date_of_birth: normaliseOcrDate(ocr.ocr_dob) || current.date_of_birth,
        id_number: ocr.ocr_id_number || current.id_number,
        permanent_address: ocr.ocr_address || current.permanent_address,
      }));

      setSuccessMessage("OCR completed. Review the extracted fields before you submit.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "OCR could not be completed.");
    } finally {
      setIsRunningOcr(false);
    }
  }

  async function handleSubmit() {
    const storedToken = getStoredGuestToken();
    if (typeof storedToken !== "string" || storedToken.length === 0 || !activeSlotId) {
      return;
    }
    const token = storedToken;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: KycSubmitPayload = {
        nationality_type: editorState.nationality_type,
        id_type: editorState.id_type,
        full_name: editorState.full_name.trim(),
        date_of_birth: editorState.date_of_birth,
        id_number: editorState.id_number.trim(),
        permanent_address: editorState.permanent_address.trim(),
        contact_number: editorState.contact_number.trim(),
        coming_from: editorState.coming_from.trim(),
        going_to: editorState.going_to.trim(),
        purpose: editorState.purpose,
        front_image_url: editorState.front_image_url,
        back_image_url: editorState.back_image_url,
        consent_given: editorState.consent_given,
      };
      const validationErrors = validateKycPayload(payload);
      if (validationErrors.length > 0) {
        setErrorMessage(validationErrors.join(" "));
        return;
      }

      const response = await submitBookingKyc(token, ezeeReservationId, activeSlotId, payload);

      setSuccessMessage(response.message);
      await loadSlots(activeSlotId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit KYC.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        badge="Pre-arrival Setup"
        title="Preparing your guest slots"
        description="Loading the booking slots, existing KYC state, and pre-arrival actions for this reservation."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center text-white/72">
          Loading pre-arrival setup...
        </div>
      </BookingPageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <BookingPageShell
        badge="Pre-arrival Setup"
        title="Sign in to complete pre-arrival setup"
        description="KYC upload and slot management require the linked guest session for this booking."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center shadow-[var(--vh-shadow-lg)]">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/70">
            Sign in with the guest account linked to this reservation, then continue the KYC flow for each guest slot.
          </p>
          <Button className="mt-6 rounded-full px-6" onClick={() => openAuthModal("signin")} type="button">
            Sign in to continue
          </Button>
        </div>
      </BookingPageShell>
    );
  }

  if (slots.length === 0) {
    return (
      <BookingPageShell
        badge="Pre-arrival Setup"
        title="No guest slots found"
        description="This reservation does not have any active guest slots yet, so there is nothing to complete on the KYC side."
      >
        <BookingEmptyState
          title="Guest slots are missing"
          description={errorMessage || "Try reopening the booking detail page so the link flow can initialise the guest slots, then return here."}
          ctaHref={`/bookings/${encodeURIComponent(ezeeReservationId)}`}
          ctaLabel="Back to booking"
        />
      </BookingPageShell>
    );
  }
  return (
    <section className="vh-section min-h-screen bg-[var(--vh-section-b)] pt-24 md:pt-28 animate-vh-fade-in">
      <div className="vh-container">
        <div className="mx-auto max-w-6xl">
          <div className="animate-vh-slide-up overflow-hidden rounded-[28px] border border-[rgba(253,16,94,0.14)] bg-[var(--vh-section-a)] shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
            <div className="flex items-center justify-between border-b border-[rgba(253,16,94,0.1)] bg-[rgba(253,16,94,0.03)] px-4 py-5 backdrop-blur-md md:px-6">
              <Button asChild className="h-10 w-10 rounded-[12px] border border-white/10 bg-transparent p-0 text-[var(--vh-pink)] shadow-none hover:bg-white/10 transition-all duration-300" variant="ghost">
                <Link href={`/bookings/${encodeURIComponent(ezeeReservationId)}`} aria-label="Back to booking">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <p className="font-['Space_Grotesk'] text-2xl font-bold uppercase tracking-[-0.04em] text-slate-100 [text-shadow:2px_2px_0px_var(--vh-pink)]">
                Pre-Arrival
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[rgba(253,16,94,0.3)] bg-[rgba(253,16,94,0.1)] text-[var(--vh-pink)] shadow-[0_0_10px_rgba(253,16,94,0.1)]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div className="px-4 py-6 md:px-6">
              {errorMessage ? (
                <div className="rounded-[22px] border border-[rgba(255,107,107,0.24)] bg-[rgba(255,107,107,0.1)] px-5 py-4 text-sm text-[var(--vh-hot)]">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mt-4 rounded-[22px] border border-[rgba(57,247,44,0.2)] bg-[rgba(57,247,44,0.08)] px-5 py-4 text-sm text-[var(--vh-lime)]">
                  {successMessage}
                </div>
              ) : null}

              <div className="mt-6 flex gap-2 w-full max-w-[400px] rounded-[16px] bg-[rgba(253,16,94,0.05)] p-1.5 border border-[rgba(253,16,94,0.2)] mx-auto">
                <button
                  onClick={() => setActiveTab('kyc')}
                  className={`flex-1 rounded-[12px] py-2.5 text-sm font-bold uppercase tracking-[0.1em] transition-all ${activeTab === 'kyc' ? 'bg-[var(--vh-pink)] text-white shadow-[0_4px_15px_rgba(253,16,94,0.3)]' : 'text-[var(--vh-pink)] hover:bg-[rgba(253,16,94,0.1)]'}`}
                >
                  KYC & Docs
                </button>
                <button
                  onClick={() => setActiveTab('addons')}
                  className={`flex-1 rounded-[12px] py-2.5 text-sm font-bold uppercase tracking-[0.1em] transition-all ${activeTab === 'addons' ? 'bg-[var(--vh-cyan)] text-[var(--vh-surface-2)] shadow-[0_4px_15px_rgba(234,239,254,0.3)]' : 'text-[var(--vh-cyan)] hover:bg-[rgba(234,239,254,0.1)]'}`}
                >
                  Pre-book Add-ons
                </button>
              </div>

              {activeTab === "kyc" && (
                <>
                  <div className="mt-6 rounded-[20px] border border-[rgba(253,16,94,0.24)] bg-[rgba(253,16,94,0.08)] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)]">Mission Progress</p>
                  <p className="font-['Space_Grotesk'] text-xs font-bold text-slate-100">{activeMissionSteps} / 4</p>
                </div>
                <div className="mt-3 h-6 rounded-full border-2 border-[rgba(253,16,94,0.3)] bg-[rgba(253,16,94,0.08)] p-[2px]">
                  <div className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-[var(--vh-pink)] to-[#ff3a7a] px-2 transition-all duration-500 shadow-[0_0_10px_rgba(253,16,94,0.4)]" style={{ width: `${Math.max(25, (activeMissionSteps / 4) * 100)}%` }}>
                    <div className="h-2 flex-1 rounded-full bg-white/40" />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-['Space_Grotesk'] text-[20px] font-bold uppercase text-white">1. ID Verification</h2>
                      <IdCard className="h-4 w-4 text-[var(--vh-pink)]" />
                    </div>
                    <div className="-rotate-1 rounded-[16px] border border-[rgba(253,16,94,0.3)] bg-[var(--vh-ice)] p-5 text-[var(--vh-surface-2)] shadow-[8px_8px_0_0_var(--vh-pink)] transition-transform duration-300 hover:-translate-y-1 hover:-rotate-2 hover:shadow-[12px_12px_0_0_var(--vh-pink)]">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="rounded-[12px] bg-white border border-[rgba(253,16,94,0.2)] p-4 text-[var(--vh-surface-2)] shadow-sm hover:border-[var(--vh-pink)] transition-colors cursor-pointer group">
                          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 border-b border-[var(--vh-surface-2)]/10 pb-4 text-center">
                            <div className="h-12 w-12 bg-center bg-no-repeat opacity-80 group-hover:scale-110 transition-transform duration-300" style={{ backgroundImage: "url('/design-guidelines/pre-arrival/Image.png')", backgroundSize: "contain" }} />
                            <div>
                              <p className="font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.12em] text-[var(--vh-pink)] group-hover:text-[var(--vh-cyan)] transition-colors">Click to snap</p>
                              <p className="mt-2 text-sm font-medium text-[var(--vh-surface-2)]/70">&quot;Gotta make sure it&apos;s really you, boss!&quot;</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-['Space_Grotesk'] text-sm font-bold uppercase text-[var(--vh-surface-2)]">Front document</p>
                              <p className="mt-1 text-xs font-medium text-[var(--vh-surface-2)]/60">{editorState.front_image_url ? "Uploaded and ready for OCR." : "Upload JPG, PNG, or HEIC."}</p>
                            </div>
                            {isUploadingFront ? <LoaderCircle className="h-4 w-4 animate-spin text-[var(--vh-pink)]" /> : <Upload className="h-4 w-4 text-[var(--vh-pink)] group-hover:-translate-y-1 transition-transform" />}
                          </div>
                          <input accept="image/*" className="mt-4 block w-full text-sm text-slate-700" disabled={!canEditActiveSlot || isUploadingFront} onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleUpload("front", file);
                            }
                          }} type="file" />
                        </label>

                        <label className="rotate-[1deg] rounded-[12px] border-4 border-[var(--vh-pink)] bg-[var(--vh-surface-2)] p-4 text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.22)] cursor-pointer group hover:rotate-0 hover:border-[var(--vh-cyan)] transition-all duration-300">
                          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                            <ShieldCheck className="h-10 w-10 text-[var(--vh-pink)] group-hover:text-[var(--vh-cyan)] transition-colors group-hover:scale-110" />
                            <div>
                              <p className="font-['Space_Grotesk'] text-sm font-black uppercase">Back document</p>
                              <p className="mt-2 text-xs font-medium text-white/70">{editorState.back_image_url ? "Uploaded and ready for OCR." : "Optional for IDs that need two sides."}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="font-['Space_Grotesk'] text-[10px] uppercase tracking-[0.12em] text-[var(--vh-pink)] group-hover:text-[var(--vh-cyan)] transition-colors">Optional support file</p>
                            {isUploadingBack ? <LoaderCircle className="h-4 w-4 animate-spin text-white" /> : <Upload className="h-4 w-4 text-white group-hover:-translate-y-1 transition-transform" />}
                          </div>
                          <input accept="image/*" className="mt-4 block w-full text-sm text-white" disabled={!canEditActiveSlot || isUploadingBack} onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleUpload("back", file);
                            }
                          }} type="file" />
                        </label>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Button className="rounded-[8px] bg-[var(--vh-pink)] px-5 py-5 text-sm font-black uppercase tracking-[0.12em] shadow-[0_4px_0_0_var(--vh-border)] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_var(--vh-border)] transition-all duration-200 text-white" disabled={!canEditActiveSlot || !editorState.front_image_key || isRunningOcr} onClick={() => void handleRunOcr()} type="button">
                          {isRunningOcr ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                          Run OCR
                        </Button>
                        <p className="text-sm font-medium text-[var(--vh-surface-2)]/70">OCR prefills the form but does not submit KYC.</p>
                      </div>
                    </div>
                  </section>
                  <section className="space-y-4">
                    <h2 className="font-['Space_Grotesk'] text-[20px] font-bold uppercase text-white">2. Traveler Details</h2>
                    <div className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)] backdrop-blur-md">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Nationality</span>
                          <select className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, nationality_type: event.target.value }))} value={editorState.nationality_type}>
                            <option value="INDIAN" className="text-slate-900">INDIAN</option>
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">ID Type</span>
                          <select className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, id_type: event.target.value }))} value={editorState.id_type}>
                            {KYC_ID_TYPES.map((idType) => (
                              <option key={idType} value={idType} className="text-slate-900">{idType}</option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Full Name</span>
                          <input className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, full_name: event.target.value }))} value={editorState.full_name} placeholder="As per ID" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Date of Birth</span>
                          <input className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, date_of_birth: event.target.value }))} type="date" value={editorState.date_of_birth} />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">ID Number</span>
                          <input className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, id_number: event.target.value }))} value={editorState.id_number} placeholder="e.g. 1234 5678 9012" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Contact Number</span>
                          <input className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, contact_number: event.target.value }))} value={editorState.contact_number} placeholder="+91..." />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Coming From</span>
                          <input className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, coming_from: event.target.value }))} value={editorState.coming_from} placeholder="City, State" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Going To</span>
                          <input className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, going_to: event.target.value }))} value={editorState.going_to} placeholder="City, State" />
                        </label>
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Permanent Address</span>
                          <textarea className="vh-input min-h-[120px] resize-y bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all text-white/90" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, permanent_address: event.target.value }))} value={editorState.permanent_address} placeholder="Full address as shown on ID" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Purpose</span>
                          <select className="vh-input bg-white/5 border-white/10 hover:border-white/20 focus:border-[var(--vh-pink)] focus:shadow-[0_0_15px_rgba(253,16,94,0.3)] transition-all" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, purpose: event.target.value }))} value={editorState.purpose}>
                            {KYC_PURPOSES.map((purpose) => (
                              <option key={purpose} value={purpose} className="text-slate-900">{purpose}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="font-['Space_Grotesk'] text-[20px] font-bold uppercase text-white">3. House Rules</h2>
                    <div className="rounded-[24px] border border-[rgba(253,16,94,0.3)] bg-[linear-gradient(145deg,rgba(253,16,94,0.1)_0%,var(--vh-section-a)_100%)] p-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 border-b border-[rgba(253,16,94,0.15)] pb-3">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vh-pink)]" />
                          <p className="text-sm font-medium uppercase tracking-[0.04em] text-white">Bring the same government ID to the property for final verification.</p>
                        </div>
                        <div className="flex items-start gap-3 border-b border-[rgba(253,16,94,0.15)] pb-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vh-pink)]" />
                          <p className="text-sm font-medium uppercase tracking-[0.04em] text-white">Your documents are securely vaulted in AWS S3 and are only accessible by certified property mangers.</p>
                        </div>
                        <div className="flex items-start gap-3 border-b border-[rgba(253,16,94,0.15)] pb-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vh-pink)]" />
                          <p className="text-sm font-medium uppercase tracking-[0.04em] text-white">Only Indian nationals above 18 years are supported in this KYC flow.</p>
                        </div>
                        <div className="flex items-start gap-3 border-b border-[rgba(253,16,94,0.15)] pb-3">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vh-pink)]" />
                          <p className="text-sm font-medium uppercase tracking-[0.04em] text-white">Accepted IDs: Aadhaar, Voter ID, Driving Licence, Passport.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vh-pink)]" />
                          <p className="text-sm font-medium uppercase tracking-[0.04em] text-white">Add another guest slot before submission if more guests are joining this stay.</p>
                        </div>
                      </div>

                      <label className="mt-6 flex items-start gap-3 rounded-[12px] border border-[rgba(253,16,94,0.3)] bg-[rgba(253,16,94,0.05)] p-4 cursor-pointer hover:bg-[rgba(253,16,94,0.1)] transition-colors">
                        <input checked={editorState.consent_given} className="mt-1 accent-[var(--vh-pink)]" disabled={!canEditActiveSlot} onChange={(event) => setEditorState((current) => ({ ...current, consent_given: event.target.checked }))} type="checkbox" />
                        <span className="text-sm leading-7 text-white/80">I confirm that the submitted information is accurate, matches the uploaded ID, and can be used for pre-check-in verification.</span>
                      </label>
                    </div>
                  </section>

                  <div className="pt-2">
                    <Button className="w-full rounded-[12px] bg-[var(--vh-pink)] py-6 text-xl font-black uppercase tracking-[0.16em] shadow-[0_4px_0_0_var(--vh-border)] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_var(--vh-border)] transition-all duration-200 text-white" disabled={!canEditActiveSlot || isSubmitting} onClick={() => void handleSubmit()} type="button">
                      {isSubmitting ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                      Finish Setup
                    </Button>
                    <p className="mt-4 text-center font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.1em] text-white/60">You&apos;re almost home, traveler.</p>
                    {!canEditActiveSlot ? <p className="mt-3 text-center text-sm text-white/58">This slot is locked because it has already been submitted or verified.</p> : null}
                  </div>
                </div>
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h2 className="font-['Space_Grotesk'] text-[20px] font-bold uppercase text-white">4. Who&apos;s Staying?</h2>
                    <div className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)] backdrop-blur-md">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/50">Guest Slots</p>
                          <p className="mt-2 text-sm font-medium text-white/80">{completedSlotCount}/{slots.length} verified</p>
                        </div>
                        <Button className="rounded-[12px] bg-white/10 hover:bg-white/20 text-white transition-colors" disabled={isMutating} onClick={() => void handleAddSlot()} type="button" variant="ghost">
                          <Plus className="mr-2 h-4 w-4" />
                          Add slot
                        </Button>
                      </div>
                      <div className="mt-6 space-y-3">
                        {slots.map((slot) => (
                          <div
                            key={slot.slot_id}
                            className={cn(
                              "w-full rounded-[20px] border p-4 text-left transition-all duration-300",
                              activeSlotId === slot.slot_id
                                ? "border-[var(--vh-pink)] bg-[rgba(253,16,94,0.12)] shadow-[0_0_15px_rgba(253,16,94,0.15)] scale-[1.02]"
                                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 cursor-pointer",
                            )}
                            onClick={() => void selectSlot(slot.slot_id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                void selectSlot(slot.slot_id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.16em] text-white/45">{slot.label}</p>
                                <p className="mt-2 text-lg font-semibold text-white">{slot.guest_name || "Guest details pending"}</p>
                              </div>
                              <div className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${slotStatusTone(slot.kyc_status)}`}>
                                {slotStatusLabel(slot.kyc_status)}
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-white/60">{slot.can_edit === false ? "Read only" : "Editable by this guest"}</p>
                              {slots.length > 1 ? (
                                <button
                                  aria-label={`Delete ${slot.label}`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 text-white/78 hover:bg-[var(--vh-hot)] hover:text-white hover:border-[var(--vh-hot)] transition-colors"
                                  disabled={isMutating}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDeleteSlot(slot.slot_id);
                                  }}
                                  type="button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <div className="rounded-[24px] border border-[rgba(253,16,94,0.3)] bg-[var(--vh-panel-strong)] p-6 shadow-[0_0_20px_rgba(253,16,94,0.1)] backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--vh-pink)]">Active Slot</p>
                    <h3 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold uppercase tracking-[-0.04em] text-white">{activeSlot?.label || "Select a slot"}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/70">{activeSlot?.guest_name || "Fill the guest details, upload the documents if you have them, and submit the reviewed KYC form."}</p>
                    <div className="mt-5 rounded-[20px] border border-[rgba(253,16,94,0.2)] bg-[rgba(253,16,94,0.05)] p-4 shadow-inner">
                      <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${slotStatusTone(activeSlot?.kyc_status || "NOT_STARTED")}`}>
                        {slotStatusLabel(activeSlot?.kyc_status || "NOT_STARTED")}
                      </div>
                      <p className="mt-4 text-sm font-medium text-white/80">Booking: <span className="text-white">{bookingTitle}</span></p>
                      <p className="mt-2 text-sm font-medium text-white/80">Reservation: <span className="text-white">{ezeeReservationId}</span></p>
                    </div>
                    <Button asChild className="mt-5 w-full rounded-[12px] border border-white/15 bg-transparent text-white hover:bg-white/10 hover:border-white/30 transition-all" variant="outline">
                      <Link href={`/bookings/${encodeURIComponent(ezeeReservationId)}`}>
                        Back to booking
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
                </>
              )}

              {activeTab === "addons" && (
                <div className="mt-8 rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 md:p-10 shadow-[var(--vh-shadow-lg)] backdrop-blur-md animate-vh-fade-in">
                   <h2 className="font-['Space_Grotesk'] text-[24px] font-bold uppercase text-white">Pre-Book Your Extras</h2>
                   <p className="mt-2 text-white/60 max-w-2xl">Select items now to have them ready. They will be added to your final bill to pay at the property.</p>
                   
                   <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                     {catalogItems.length === 0 ? (
                        <p className="text-white/50 italic col-span-full">No add-ons available at this time.</p>
                     ) : catalogItems.map(item => (
                       <div key={item.id} className="rounded-[16px] border border-white/10 p-5 bg-white/5 flex flex-col justify-between hover:border-[var(--vh-cyan)] hover:bg-[rgba(234,239,254,0.05)] transition-all duration-300">
                         <div>
                           <h3 className="font-bold text-white text-lg">{item.name}</h3>
                           <p className="text-sm font-semibold text-[var(--vh-cyan)] mt-1">₹ {item.base_price}</p>
                         </div>
                         <div className="mt-6 flex items-center justify-between">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[8px] bg-transparent text-white border-white/20 hover:bg-white/10" onClick={() => setAddonQuantities(curr => ({...curr, [item.id]: Math.max(0, (curr[item.id] || 0) - 1)}))}>-</Button>
                            <span className="font-bold text-white">{addonQuantities[item.id] || 0}</span>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[8px] bg-transparent text-white border-white/20 hover:bg-[var(--vh-cyan)] hover:border-[var(--vh-cyan)] transition-colors hover:text-[var(--vh-surface)]" onClick={() => setAddonQuantities(curr => ({...curr, [item.id]: (curr[item.id] || 0) + 1}))}>+</Button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
