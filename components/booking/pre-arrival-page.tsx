"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  Info,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { StickerTag } from "@/components/shared/sticker-tag";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  addBookingKycSlot,
  deleteBookingKycSlot,
  getBookingKycDetail,
  getBookingKycSlots,
  getBookingKycUploadUrl,
  linkGuestBooking,
  runBookingKycOcr,
  submitBookingKyc,
  uploadFileToPresignedUrl,
  type BookingKycDetailResponse,
  type BookingSlotSummary,
  type KycSubmitPayload,
} from "@/lib/booking-api";
import { withBrandName } from "@/lib/branding";
import { getClientCache, setClientCache } from "@/lib/client-cache";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { toSafeErrorMessage } from "@/lib/ui-error";
import { cn } from "@/lib/utils";

import { BookingEmptyState, BookingPageShell } from "./booking-shell";

type Step = 1 | 2 | 3;
type UploadSide = "front" | "back";
type GenderValue = "MALE" | "FEMALE" | "OTHER";

type KycEditorState = {
  nationality_type: string;
  id_type: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: GenderValue;
  id_number: string;
  permanent_address: string;
  contact_number: string;
  coming_from: string;
  going_to: string;
  purpose: string;
  arrival_time: string;
  front_image_key?: string;
  back_image_key?: string;
  front_image_url?: string;
  back_image_url?: string;
  consent_terms: boolean;
  consent_age: boolean;
};

type UploadPreviewDraft = {
  side: UploadSide;
  file: File;
  objectUrl: string;
};

type SlotsCachePayload = {
  slots: BookingSlotSummary[];
  bookingTitle: string;
  propertyName: string;
  bookingStatus?: string | null;
};

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Gov. ID" },
  { id: 3, label: "Time" },
];

const ID_TYPES = [
  { value: "AADHAAR", label: "Aadhar" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENCE", label: "Driving License" },
  { value: "VOTER_ID", label: "Voter ID" },
];

const PURPOSES = ["LEISURE", "BUSINESS", "MEDICAL", "TRANSIT", "OTHER"];

const ARRIVAL_WINDOWS = [
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
];

const WEB_CHECKIN_CACHE_TTL_MS = 1000 * 60 * 3;

function slotsCacheKey(ezeeReservationId: string): string {
  return `vh:web-checkin:slots:${ezeeReservationId}`;
}

function slotDetailCacheKey(ezeeReservationId: string, slotId: string): string {
  return `vh:web-checkin:slot:${ezeeReservationId}:${slotId}`;
}

function emptyEditorState(params?: {
  fullName?: string;
  email?: string;
  phone?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  location?: string | null;
  gender?: string | null;
}): KycEditorState {
  const [first, ...rest] = (params?.fullName || "").trim().split(/\s+/).filter(Boolean);

  return {
    nationality_type: normalizeNationality(params?.nationality),
    id_type: "AADHAAR",
    first_name: first || "",
    last_name: rest.join(" "),
    email: (params?.email || "").trim(),
    date_of_birth: normalizeBirthDate(params?.birthDate),
    gender: normalizeGender(params?.gender),
    id_number: "",
    permanent_address: (params?.location || "").trim(),
    contact_number: normalizeContactNumber(params?.phone),
    coming_from: "",
    going_to: "",
    purpose: "LEISURE",
    arrival_time: ARRIVAL_WINDOWS[1],
    consent_terms: false,
    consent_age: false,
  };
}

function createEditorState(
  kyc: BookingKycDetailResponse["kyc"],
  params?: {
    slotGuestName?: string | null;
    guestName?: string;
    email?: string;
    phone?: string | null;
    birthDate?: string | null;
    nationality?: string | null;
    location?: string | null;
    gender?: string | null;
  },
): KycEditorState {
  if (!kyc) {
    return emptyEditorState({
      fullName: params?.slotGuestName || params?.guestName,
      email: params?.email,
      phone: params?.phone,
      birthDate: params?.birthDate,
      nationality: params?.nationality,
      location: params?.location,
      gender: params?.gender,
    });
  }

  const [firstName, ...rest] = (kyc.full_name || params?.slotGuestName || params?.guestName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    nationality_type: kyc.nationality_type || normalizeNationality(params?.nationality),
    id_type: kyc.id_type || "AADHAAR",
    first_name: firstName || "",
    last_name: rest.join(" "),
    email: (params?.email || "").trim(),
    date_of_birth: normalizeBirthDate(kyc.date_of_birth || params?.birthDate),
    gender: normalizeGender(params?.gender),
    id_number: kyc.id_number || "",
    permanent_address: kyc.permanent_address || (params?.location || ""),
    contact_number: kyc.contact_number || normalizeContactNumber(params?.phone),
    coming_from: kyc.coming_from || "",
    going_to: kyc.going_to || "",
    purpose: kyc.purpose || "LEISURE",
    arrival_time: ARRIVAL_WINDOWS[1],
    front_image_key: undefined,
    back_image_key: undefined,
    front_image_url: kyc.front_image_url || undefined,
    back_image_url: kyc.back_image_url || undefined,
    consent_terms: Boolean(kyc.consent_given),
    consent_age: Boolean(kyc.consent_given),
  };
}

function normalizeBirthDate(value?: string | null): string {
  if (!value) {
    return "";
  }

  const raw = value.trim();
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const alt = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!alt) {
    return "";
  }

  const [, day, month, year] = alt;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeGender(value?: string | null): GenderValue {
  const raw = (value || "").trim().toLowerCase();
  if (raw === "male") {
    return "MALE";
  }
  if (raw === "female") {
    return "FEMALE";
  }
  return "OTHER";
}

function normalizeNationality(value?: string | null): string {
  const raw = (value || "").trim().toUpperCase();
  if (!raw || raw.includes("IND")) {
    return "INDIAN";
  }
  return raw;
}

function normalizeContactNumber(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) {
    return "";
  }

  if (raw.startsWith("+")) {
    return raw;
  }

  const digits = raw.replace(/\D+/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length > 0) {
    return `+${digits}`;
  }
  return raw;
}

function isAdult(dateInput: string): boolean {
  const date = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 18);
  return date <= minDate;
}

function publicFileUrlFromUploadUrl(uploadUrl: string): string {
  return uploadUrl.split("?")[0] || uploadUrl;
}

function normalizeOcrDate(input?: string | null): string {
  if (!input) {
    return "";
  }

  return normalizeBirthDate(input);
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

function isPaymentPendingStatus(status?: string | null): boolean {
  const normalized = (status || "").trim().toUpperCase();
  return normalized === "PENDING_PAYMENT" || normalized === "PAYMENT_PENDING" || normalized === "UNPAID";
}

function validateStepOne(state: KycEditorState): string[] {
  const errors: string[] = [];

  if (!state.first_name.trim()) {
    errors.push("First name is required.");
  }
  if (!state.last_name.trim()) {
    errors.push("Last name is required.");
  }
  if (!state.date_of_birth || !/^\d{4}-\d{2}-\d{2}$/.test(state.date_of_birth)) {
    errors.push("Date of birth is required.");
  } else if (!isAdult(state.date_of_birth)) {
    errors.push("Guest must be at least 18 years old.");
  }
  if (!state.nationality_type.trim()) {
    errors.push("Nationality is required.");
  }
  if (!state.permanent_address.trim()) {
    errors.push("Address is required.");
  }

  return errors;
}

function validateStepTwo(state: KycEditorState): string[] {
  const errors: string[] = [];
  if (!state.id_type.trim()) {
    errors.push("Select one government ID type.");
  }
  if (!state.front_image_url || !state.front_image_key) {
    errors.push("Upload the front side of your ID.");
  }
  if (!state.id_number.trim()) {
    errors.push("ID number is required.");
  }
  if (!state.consent_terms) {
    errors.push("Please accept Terms and Conditions.");
  }
  if (!state.consent_age) {
    errors.push("Age confirmation is required.");
  }
  return errors;
}

function validateStepThree(state: KycEditorState): string[] {
  const errors: string[] = [];
  if (!state.arrival_time.trim()) {
    errors.push("Select your expected arrival window.");
  }
  if (!state.coming_from.trim()) {
    errors.push("Please enter where you are coming from.");
  }
  if (!state.going_to.trim()) {
    errors.push("Please enter your next destination.");
  }
  if (!/^\+\d{10,15}$/.test(state.contact_number.trim())) {
    errors.push("Contact number must include country code (for example +918765432109).");
  }
  if (!PURPOSES.includes(state.purpose)) {
    errors.push("Select a valid travel purpose.");
  }
  return errors;
}

function validateForSubmit(state: KycEditorState): string[] {
  return [...validateStepOne(state), ...validateStepTwo(state), ...validateStepThree(state)];
}

export function PreArrivalPage({ ezeeReservationId }: { ezeeReservationId: string }) {
  const router = useRouter();
  const { guest, isAuthenticated, isRestoringSession, openAuthModal } = useGuestAuth();

  const [bookingTitle, setBookingTitle] = useState("Web check-in");
  const [propertyName, setPropertyName] = useState("The Daily Social");
  const [bookingLifecycleStatus, setBookingLifecycleStatus] = useState<string | null>(null);
  const [slots, setSlots] = useState<BookingSlotSummary[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<Step>(1);
  const [editorState, setEditorState] = useState<KycEditorState>(() =>
    emptyEditorState({
      fullName: guest?.name,
      email: guest?.email,
      phone: guest?.phone,
      birthDate: guest?.birthDate,
      nationality: guest?.nationality,
      location: guest?.location,
      gender: guest?.gender,
    }),
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isMutatingSlots, setIsMutatingSlots] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadPreviewDraft, setUploadPreviewDraft] = useState<UploadPreviewDraft | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  const frontUploadInputRef = useRef<HTMLInputElement | null>(null);
  const backUploadInputRef = useRef<HTMLInputElement | null>(null);
  const frontCameraInputRef = useRef<HTMLInputElement | null>(null);
  const backCameraInputRef = useRef<HTMLInputElement | null>(null);
  const slotsRef = useRef<BookingSlotSummary[]>([]);
  const activeSlotIdRef = useRef<string | null>(null);

  const guestPrefill = useMemo(
    () => ({
      name: guest?.name,
      email: guest?.email,
      phone: guest?.phone,
      birthDate: guest?.birthDate,
      nationality: guest?.nationality,
      location: guest?.location,
      gender: guest?.gender,
    }),
    [guest?.birthDate, guest?.email, guest?.gender, guest?.location, guest?.name, guest?.nationality, guest?.phone],
  );

  const activeSlot = useMemo(
    () => slots.find((slot) => slot.slot_id === activeSlotId) ?? null,
    [activeSlotId, slots],
  );

  const completedSlotCount = useMemo(
    () => slots.filter((slot) => slot.kyc_status === "PRE_VERIFIED" || slot.kyc_status === "VERIFIED").length,
    [slots],
  );

  const canEditActiveSlot =
    Boolean(activeSlot?.can_edit ?? true) &&
    activeSlot?.kyc_status !== "PRE_VERIFIED" &&
    activeSlot?.kyc_status !== "VERIFIED";

  const progressPercent = useMemo(() => {
    if (activeStep === 1) {
      return 34;
    }
    if (activeStep === 2) {
      return 67;
    }
    return 100;
  }, [activeStep]);

  const frontPreview = editorState.front_image_url;
  const backPreview = editorState.back_image_url;

  const showUploadPreviewModal = Boolean(uploadPreviewDraft);

  const setField = <K extends keyof KycEditorState>(key: K, value: KycEditorState[K]) => {
    setEditorState((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    activeSlotIdRef.current = activeSlotId;
  }, [activeSlotId]);

  useEffect(() => {
    return () => {
      if (uploadPreviewDraft?.objectUrl) {
        URL.revokeObjectURL(uploadPreviewDraft.objectUrl);
      }
    };
  }, [uploadPreviewDraft?.objectUrl]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    toast.error("Web check-in issue", {
      description: errorMessage,
    });
  }, [errorMessage]);

  const loadSlotDetail = useCallback(
    async (token: string, slotId: string, nextSlots?: BookingSlotSummary[]) => {
      const detailKey = slotDetailCacheKey(ezeeReservationId, slotId);
      const cachedDetail = getClientCache<BookingKycDetailResponse>(detailKey, WEB_CHECKIN_CACHE_TTL_MS);
      const selectedSlot = (nextSlots ?? slotsRef.current).find((slot) => slot.slot_id === slotId) ?? null;

      if (cachedDetail) {
        setEditorState(
          createEditorState(cachedDetail.kyc, {
            slotGuestName: selectedSlot?.guest_name,
            guestName: guestPrefill.name,
            email: guestPrefill.email,
            phone: guestPrefill.phone,
            birthDate: guestPrefill.birthDate,
            nationality: guestPrefill.nationality,
            location: guestPrefill.location,
            gender: guestPrefill.gender,
          }),
        );
      }

      const detail = await getBookingKycDetail(token, ezeeReservationId, slotId);
      setClientCache(detailKey, detail);
      setEditorState(
        createEditorState(detail.kyc, {
          slotGuestName: selectedSlot?.guest_name,
          guestName: guestPrefill.name,
          email: guestPrefill.email,
          phone: guestPrefill.phone,
          birthDate: guestPrefill.birthDate,
          nationality: guestPrefill.nationality,
          location: guestPrefill.location,
          gender: guestPrefill.gender,
        }),
      );
    },
    [ezeeReservationId, guestPrefill],
  );

  const loadSlots = useCallback(
    async (preferredSlotId?: string) => {
      if (isRestoringSession) {
        return;
      }

      const token = getStoredGuestToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const cacheKey = slotsCacheKey(ezeeReservationId);
      const cachedSlots = getClientCache<SlotsCachePayload>(cacheKey, WEB_CHECKIN_CACHE_TTL_MS);

      if (cachedSlots) {
        setSlots(cachedSlots.slots);
        setBookingTitle(cachedSlots.bookingTitle);
        setPropertyName(cachedSlots.propertyName);
        setBookingLifecycleStatus(cachedSlots.bookingStatus ?? null);
        const currentActiveSlotId = activeSlotIdRef.current;
        const cachedActive = preferredSlotId
          || cachedSlots.slots.find((slot) => slot.slot_id === currentActiveSlotId)?.slot_id
          || cachedSlots.slots[0]?.slot_id
          || null;
        setActiveSlotId(cachedActive);
        setIsLoading(false);

        if (isPaymentPendingStatus(cachedSlots.bookingStatus)) {
          return;
        }
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [bookingLinkResponse, slotResponse] = await Promise.all([
          linkGuestBooking(token, ezeeReservationId),
          getBookingKycSlots(token, ezeeReservationId),
        ]);

        const nextPropertyName = withBrandName(bookingLinkResponse.booking.property_id);
        const nextTitle = bookingLinkResponse.booking.room_type_name || "Web check-in";
        const nextBookingStatus = (bookingLinkResponse.booking.status || "").toUpperCase();

        setBookingTitle(nextTitle);
        setPropertyName(nextPropertyName);
        setBookingLifecycleStatus(nextBookingStatus || null);

        if (isPaymentPendingStatus(nextBookingStatus)) {
          setSlots([]);
          setActiveSlotId(null);
          setClientCache(cacheKey, {
            slots: [],
            bookingTitle: nextTitle,
            propertyName: nextPropertyName,
            bookingStatus: nextBookingStatus,
          });
          return;
        }

        setSlots(slotResponse.slots);
        setClientCache(cacheKey, {
          slots: slotResponse.slots,
          bookingTitle: nextTitle,
          propertyName: nextPropertyName,
          bookingStatus: nextBookingStatus,
        });

        const currentActiveSlotId = activeSlotIdRef.current;
        const nextActiveSlotId = preferredSlotId
          || slotResponse.slots.find((slot) => slot.slot_id === currentActiveSlotId)?.slot_id
          || slotResponse.slots.find((slot) => slot.guest_id)?.slot_id
          || slotResponse.slots[0]?.slot_id
          || null;

        setActiveSlotId(nextActiveSlotId);

        if (nextActiveSlotId) {
          await loadSlotDetail(token, nextActiveSlotId, slotResponse.slots);
        } else {
          setEditorState(
            emptyEditorState({
              fullName: guestPrefill.name,
              email: guestPrefill.email,
              phone: guestPrefill.phone,
              birthDate: guestPrefill.birthDate,
              nationality: guestPrefill.nationality,
              location: guestPrefill.location,
              gender: guestPrefill.gender,
            }),
          );
        }
      } catch (error) {
        setErrorMessage(toSafeErrorMessage(error, "We could not load web check-in right now."));
      } finally {
        setIsLoading(false);
      }
    },
    [
      ezeeReservationId,
      guestPrefill,
      isRestoringSession,
      loadSlotDetail,
    ],
  );

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

  async function selectSlot(slotId: string) {
    const token = getStoredGuestToken();
    if (!token) {
      return;
    }

    setActiveSlotId(slotId);
    setActiveStep(1);
    setErrorMessage(null);

    try {
      await loadSlotDetail(token, slotId);
    } catch (error) {
      setErrorMessage(toSafeErrorMessage(error, "Unable to open this guest slot."));
    }
  }

  async function handleAddSlot() {
    const token = getStoredGuestToken();
    if (!token) {
      setErrorMessage("Your session ended. Please sign in again.");
      return;
    }

    setIsMutatingSlots(true);
    setErrorMessage(null);

    try {
      const nextSlot = await addBookingKycSlot(token, ezeeReservationId);
      toast.success("Guest slot added", {
        description: `${nextSlot.label} is ready for details.`,
      });
      await loadSlots(nextSlot.slot_id);
      setActiveStep(1);
    } catch (error) {
      setErrorMessage(toSafeErrorMessage(error, "Unable to add another guest slot."));
    } finally {
      setIsMutatingSlots(false);
    }
  }

  async function handleDeleteSlot(slotId: string) {
    const token = getStoredGuestToken();
    if (!token) {
      setErrorMessage("Your session ended. Please sign in again.");
      return;
    }

    setIsMutatingSlots(true);
    setErrorMessage(null);

    try {
      const response = await deleteBookingKycSlot(token, ezeeReservationId, slotId);
      toast.success("Guest slot removed", {
        description: response.message,
      });
      await loadSlots();
      setActiveStep(1);
    } catch (error) {
      setErrorMessage(toSafeErrorMessage(error, "Unable to delete this slot."));
    } finally {
      setIsMutatingSlots(false);
    }
  }

  function handleSelectedFile(side: UploadSide, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files are supported for ID upload.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (uploadPreviewDraft?.objectUrl) {
      URL.revokeObjectURL(uploadPreviewDraft.objectUrl);
    }
    setUploadPreviewDraft({ side, file, objectUrl });
    event.target.value = "";
  }

  async function handleUpload(side: UploadSide, file: File) {
    const token = getStoredGuestToken();
    if (!token) {
      setErrorMessage("Your session ended. Please sign in again.");
      return;
    }

    if (side === "front") {
      setIsUploadingFront(true);
    } else {
      setIsUploadingBack(true);
    }
    setErrorMessage(null);

    try {
      const upload = await getBookingKycUploadUrl(token, ezeeReservationId, {
        file_name: file.name,
        content_type: file.type || "application/octet-stream",
      });

      await uploadFileToPresignedUrl(upload.uploadUrl, file);
      const publicUrl = publicFileUrlFromUploadUrl(upload.uploadUrl);

      setEditorState((current) => ({
        ...current,
        ...(side === "front"
          ? { front_image_key: upload.fileKey, front_image_url: publicUrl }
          : { back_image_key: upload.fileKey, back_image_url: publicUrl }),
      }));

      toast.success("ID uploaded", {
        description: `${side === "front" ? "Front" : "Back"} image uploaded successfully.`,
      });
    } catch (error) {
      setErrorMessage(toSafeErrorMessage(error, "Document upload failed. Please try again."));
    } finally {
      if (side === "front") {
        setIsUploadingFront(false);
      } else {
        setIsUploadingBack(false);
      }
    }
  }

  async function applyUploadPreview() {
    if (!uploadPreviewDraft) {
      return;
    }

    const { side, file, objectUrl } = uploadPreviewDraft;
    setUploadPreviewDraft(null);
    URL.revokeObjectURL(objectUrl);
    await handleUpload(side, file);
  }

  function dismissUploadPreview() {
    if (uploadPreviewDraft?.objectUrl) {
      URL.revokeObjectURL(uploadPreviewDraft.objectUrl);
    }
    setUploadPreviewDraft(null);
  }

  async function handleRunOcr() {
    const token = getStoredGuestToken();
    if (!token || !activeSlotId || !editorState.front_image_key) {
      return;
    }

    setIsRunningOcr(true);
    setErrorMessage(null);

    try {
      const ocr = await runBookingKycOcr(token, ezeeReservationId, activeSlotId, {
        front_image_key: editorState.front_image_key,
        ...(editorState.back_image_key ? { back_image_key: editorState.back_image_key } : {}),
      });

      setEditorState((current) => {
        const normalizedName = (ocr.ocr_name || "").trim();
        const [firstName, ...lastNameParts] = normalizedName ? normalizedName.split(/\s+/) : [current.first_name, current.last_name];

        return {
          ...current,
          id_type: ocr.id_type_detected || current.id_type,
          first_name: firstName || current.first_name,
          last_name: lastNameParts.join(" ") || current.last_name,
          date_of_birth: normalizeOcrDate(ocr.ocr_dob) || current.date_of_birth,
          id_number: ocr.ocr_id_number || current.id_number,
          permanent_address: ocr.ocr_address || current.permanent_address,
        };
      });

      toast.success("ID scanned", {
        description: "Review the extracted fields before submitting.",
      });
    } catch (error) {
      setErrorMessage(toSafeErrorMessage(error, "We could not scan this ID. Please fill the fields manually."));
    } finally {
      setIsRunningOcr(false);
    }
  }

  function nextStep() {
    const stepErrors =
      activeStep === 1 ? validateStepOne(editorState) : activeStep === 2 ? validateStepTwo(editorState) : [];

    if (stepErrors.length > 0) {
      setErrorMessage(stepErrors[0]);
      return;
    }

    setErrorMessage(null);
    setActiveStep((current) => Math.min(3, current + 1) as Step);
  }

  function previousStep() {
    if (activeStep === 1) {
      router.push(`/bookings/${encodeURIComponent(ezeeReservationId)}`);
      return;
    }

    setErrorMessage(null);
    setActiveStep((current) => Math.max(1, current - 1) as Step);
  }

  async function handleSubmit() {
    const token = getStoredGuestToken();
    if (!token || !activeSlotId) {
      setErrorMessage("Your session ended. Please sign in again.");
      return;
    }

    const validationErrors = validateForSubmit(editorState);
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      return;
    }

    const payload: KycSubmitPayload = {
      nationality_type: editorState.nationality_type,
      id_type: editorState.id_type,
      full_name: `${editorState.first_name} ${editorState.last_name}`.replace(/\s+/g, " ").trim(),
      date_of_birth: editorState.date_of_birth,
      id_number: editorState.id_number.trim(),
      permanent_address: editorState.permanent_address.trim(),
      contact_number: editorState.contact_number.trim(),
      coming_from: editorState.coming_from.trim(),
      going_to: editorState.going_to.trim(),
      purpose: editorState.purpose,
      front_image_url: editorState.front_image_url,
      back_image_url: editorState.back_image_url,
      consent_given: editorState.consent_terms && editorState.consent_age,
    };

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitBookingKyc(token, ezeeReservationId, activeSlotId, payload);
      toast.success("Web check-in submitted", {
        description: `${activeSlot?.label || "Guest slot"} is submitted successfully.`,
      });
      await loadSlots(activeSlotId);
      setIsCompletionModalOpen(true);
    } catch (error) {
      setErrorMessage(toSafeErrorMessage(error, "Unable to submit web check-in right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isRestoringSession || isLoading) {
    return (
      <BookingPageShell
        badge="Web Check-In"
        title="Preparing your check-in"
        description="Loading your guest slots and any saved check-in details."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center text-white/72">
          Loading web check-in...
        </div>
      </BookingPageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <BookingPageShell
        badge="Web Check-In"
        title="Sign in to continue"
        description="Web check-in is tied to your guest session for this booking."
      >
        <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-8 text-center shadow-[var(--vh-shadow-lg)]">
          <p className="text-lg font-semibold text-white">Guest sign-in required</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/70">
            Sign in with the same account used for this booking, then continue web check-in.
          </p>
          <Button className="mt-6 rounded-full px-6" onClick={() => openAuthModal("signin")} type="button">
            Sign in to continue
          </Button>
        </div>
      </BookingPageShell>
    );
  }

  if (isPaymentPendingStatus(bookingLifecycleStatus)) {
    return (
      <BookingPageShell
        badge="Web Check-In"
        title="Payment pending"
        description="Web check-in opens only after booking payment is successful."
      >
        <BookingEmptyState
          title="Finish payment to unlock web check-in"
          description="Ask the primary guest to complete payment for this reservation, then reopen this link to continue check-in."
          ctaHref={`/bookings/${encodeURIComponent(ezeeReservationId)}/confirmed`}
          ctaLabel="View booking status"
        />
      </BookingPageShell>
    );
  }

  if (slots.length === 0) {
    return (
      <BookingPageShell
        badge="Web Check-In"
        title="No guest slots found"
        description="We could not find guest slots for this booking yet."
      >
        <BookingEmptyState
          title="Guest slots are unavailable"
          description={errorMessage || "Please reopen the booking details and try web check-in again."}
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
            <div className="flex items-center justify-between border-b border-[rgba(253,16,94,0.1)] bg-[rgba(253,16,94,0.03)] px-4 py-4 md:px-6 backdrop-blur-md">
              <Button asChild className="h-10 w-10 rounded-[12px] border border-white/10 bg-transparent p-0 text-white shadow-none hover:bg-white/10" variant="ghost">
                <Link href={`/bookings/${encodeURIComponent(ezeeReservationId)}`} aria-label="Back to booking detail">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="text-center">
                <p className="font-['Space_Grotesk'] text-lg font-bold uppercase tracking-[0.08em] text-slate-100">
                  Web Check-In
                </p>
                <p className="text-xs uppercase tracking-[0.14em] text-white/50">{withBrandName(propertyName)}</p>
              </div>
              <div className="h-10 w-10" />
            </div>

            <div className="px-4 py-6 md:px-6">
              {errorMessage ? (
                <div className="rounded-[20px] border border-[rgba(255,107,107,0.24)] bg-[rgba(255,107,107,0.1)] px-4 py-3 text-sm text-[var(--vh-hot)]">
                  {errorMessage}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StickerTag
                  label={`${completedSlotCount}/${slots.length} Slots Ready`}
                  bg="#39ff14"
                  text="#111827"
                  rotate="rotate-[-2deg]"
                  className="px-4 py-2 text-[11px] font-bold not-italic uppercase tracking-[0.1em]"
                />
                <StickerTag
                  label={bookingTitle}
                  bg="#fef08a"
                  text="#111827"
                  rotate="rotate-[2deg]"
                  className="px-4 py-2 text-[11px] font-bold not-italic uppercase tracking-[0.1em]"
                />
              </div>

              <div className="mt-6 rounded-[16px] border border-[rgba(253,16,94,0.2)] bg-[rgba(253,16,94,0.06)] p-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-white/70">
                  <span>Step progress</span>
                  <span>{activeStep}/3</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--vh-pink)] to-[#ff4c30] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {STEPS.map((step) => {
                    const isCurrent = step.id === activeStep;
                    const isDone = step.id < activeStep;

                    return (
                      <button
                        key={step.id}
                        className={cn(
                          "rounded-[12px] border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors",
                          isCurrent
                            ? "border-[var(--vh-pink)] bg-[rgba(253,16,94,0.2)] text-white"
                            : isDone
                              ? "border-[rgba(57,247,44,0.3)] bg-[rgba(57,247,44,0.12)] text-[var(--vh-lime)]"
                              : "border-white/10 bg-white/5 text-white/60",
                        )}
                        onClick={() => {
                          if (step.id <= activeStep) {
                            setActiveStep(step.id);
                          }
                        }}
                        type="button"
                      >
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-6">
                  {activeStep === 1 ? (
                    <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 md:p-6 shadow-[var(--vh-shadow-lg)]">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase tracking-[-0.03em] text-white">
                          Basic Info
                        </h2>
                        <User className="h-5 w-5 text-[var(--vh-cyan)]" />
                      </div>

                      <p className="mt-2 text-sm text-white/65">
                        Prefilled from your profile where available. Adjust anything before continuing.
                      </p>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">First Name</span>
                          <input
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("first_name", event.target.value)}
                            placeholder="First name"
                            value={editorState.first_name}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Last Name</span>
                          <input
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("last_name", event.target.value)}
                            placeholder="Last name"
                            value={editorState.last_name}
                          />
                        </label>

                        <label className="space-y-2 md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Email</span>
                          <input
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("email", event.target.value)}
                            placeholder="Email"
                            type="email"
                            value={editorState.email}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Date Of Birth</span>
                          <input
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("date_of_birth", event.target.value)}
                            type="date"
                            value={editorState.date_of_birth}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Gender</span>
                          <select
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("gender", event.target.value as GenderValue)}
                            value={editorState.gender}
                          >
                            <option className="text-slate-900" value="MALE">Male</option>
                            <option className="text-slate-900" value="FEMALE">Female</option>
                            <option className="text-slate-900" value="OTHER">Other</option>
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Nationality</span>
                          <select
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("nationality_type", event.target.value)}
                            value={editorState.nationality_type}
                          >
                            <option className="text-slate-900" value="INDIAN">Indian</option>
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Contact Number</span>
                          <input
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("contact_number", normalizeContactNumber(event.target.value))}
                            placeholder="+918765432109"
                            value={editorState.contact_number}
                          />
                        </label>

                        <label className="space-y-2 md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Address</span>
                          <textarea
                            className="vh-input min-h-[110px] resize-y bg-white/5 border-white/10"
                            onChange={(event) => setField("permanent_address", event.target.value)}
                            placeholder="Full address"
                            value={editorState.permanent_address}
                          />
                        </label>
                      </div>
                    </section>
                  ) : null}

                  {activeStep === 2 ? (
                    <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 md:p-6 shadow-[var(--vh-shadow-lg)]">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase tracking-[-0.03em] text-white">
                          Just one ID needed
                        </h2>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              aria-label="Upload guidance"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                              type="button"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 border-white/15 bg-[var(--vh-section-a)] p-4 text-sm text-white/80">
                            Upload one valid government ID. You can use camera capture for quick mobile upload, then run ID scan to prefill fields.
                          </PopoverContent>
                        </Popover>
                      </div>

                      <p className="mt-2 text-sm text-white/65">
                        Choose one document to upload.
                      </p>

                      <div className="mt-4 grid gap-3">
                        {ID_TYPES.map((idType) => (
                          <button
                            key={idType.value}
                            className={cn(
                              "rounded-[12px] border px-4 py-3 text-left transition-colors",
                              editorState.id_type === idType.value
                                ? "border-[var(--vh-pink)] bg-[rgba(253,16,94,0.12)] text-white"
                                : "border-white/10 bg-white/5 text-white/75 hover:border-white/20",
                            )}
                            onClick={() => setField("id_type", idType.value)}
                            type="button"
                          >
                            <p className="text-sm font-bold uppercase tracking-[0.08em]">{idType.label}</p>
                          </button>
                        ))}
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[16px] border border-dashed border-white/20 bg-white/5 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Front side</p>
                          <div className="relative mt-3 flex h-40 items-center justify-center overflow-hidden rounded-[12px] border border-white/10 bg-black/20">
                            {frontPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img alt="Front ID preview" className="h-full w-full object-cover" src={frontPreview} />
                            ) : (
                              <p className="text-xs uppercase tracking-[0.12em] text-white/40">No file selected</p>
                            )}
                            {isRunningOcr ? (
                              <div className="pointer-events-none absolute inset-0 bg-black/35">
                                <div className="vh-scan-line absolute left-0 right-0 h-[2px] bg-[var(--vh-cyan)] shadow-[0_0_12px_rgba(58,95,132,0.85)]" />
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                              className="rounded-[10px] border border-white/20 bg-transparent text-white hover:bg-white/8"
                              disabled={!canEditActiveSlot || isUploadingFront}
                              onClick={() => frontCameraInputRef.current?.click()}
                              type="button"
                              variant="outline"
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              Camera
                            </Button>
                            <Button
                              className="rounded-[10px] border border-white/20 bg-transparent text-white hover:bg-white/8"
                              disabled={!canEditActiveSlot || isUploadingFront}
                              onClick={() => frontUploadInputRef.current?.click()}
                              type="button"
                              variant="outline"
                            >
                              {isUploadingFront ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                              Upload
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-[16px] border border-dashed border-white/20 bg-white/5 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Back side</p>
                          <div className="relative mt-3 flex h-40 items-center justify-center overflow-hidden rounded-[12px] border border-white/10 bg-black/20">
                            {backPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img alt="Back ID preview" className="h-full w-full object-cover" src={backPreview} />
                            ) : (
                              <p className="text-xs uppercase tracking-[0.12em] text-white/40">Optional</p>
                            )}
                            {isRunningOcr ? (
                              <div className="pointer-events-none absolute inset-0 bg-black/35">
                                <div className="vh-scan-line absolute left-0 right-0 h-[2px] bg-[var(--vh-cyan)] shadow-[0_0_12px_rgba(58,95,132,0.85)]" />
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                              className="rounded-[10px] border border-white/20 bg-transparent text-white hover:bg-white/8"
                              disabled={!canEditActiveSlot || isUploadingBack}
                              onClick={() => backCameraInputRef.current?.click()}
                              type="button"
                              variant="outline"
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              Camera
                            </Button>
                            <Button
                              className="rounded-[10px] border border-white/20 bg-transparent text-white hover:bg-white/8"
                              disabled={!canEditActiveSlot || isUploadingBack}
                              onClick={() => backUploadInputRef.current?.click()}
                              type="button"
                              variant="outline"
                            >
                              {isUploadingBack ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                              Upload
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Button
                          className="rounded-[10px] bg-[var(--vh-pink)] text-white"
                          disabled={!canEditActiveSlot || !editorState.front_image_key || isRunningOcr}
                          onClick={() => void handleRunOcr()}
                          type="button"
                        >
                          {isRunningOcr ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                          {isRunningOcr ? "Scanning ID" : "Scan ID"}
                        </Button>
                        <p className="text-sm text-white/65">Run scan to auto-fill name, DOB, ID number, and address.</p>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">ID Number</span>
                          <input
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("id_number", event.target.value)}
                            placeholder="As printed on ID"
                            value={editorState.id_number}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Purpose</span>
                          <select
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("purpose", event.target.value)}
                            value={editorState.purpose}
                          >
                            {PURPOSES.map((purpose) => (
                              <option key={purpose} className="text-slate-900" value={purpose}>
                                {purpose}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="mt-5 space-y-3 rounded-[14px] border border-white/12 bg-white/5 p-4">
                        <label className="flex items-start gap-3 text-sm text-white/80">
                          <input
                            checked={editorState.consent_terms}
                            className="mt-1 accent-[var(--vh-pink)]"
                            onChange={(event) => setField("consent_terms", event.target.checked)}
                            type="checkbox"
                          />
                          I acknowledge and accept the Terms and Conditions.
                        </label>
                        <label className="flex items-start gap-3 text-sm text-white/80">
                          <input
                            checked={editorState.consent_age}
                            className="mt-1 accent-[var(--vh-pink)]"
                            onChange={(event) => setField("consent_age", event.target.checked)}
                            type="checkbox"
                          />
                          I confirm that I am above the age of 18.
                        </label>
                      </div>
                    </section>
                  ) : null}

                  {activeStep === 3 ? (
                    <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 md:p-6 shadow-[var(--vh-shadow-lg)]">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase tracking-[-0.03em] text-white">
                          Final Details
                        </h2>
                        <Clock3 className="h-5 w-5 text-[var(--vh-cyan)]" />
                      </div>

                      <div className="mt-5 grid gap-4">
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Time of Arrival</span>
                          <select
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("arrival_time", event.target.value)}
                            value={editorState.arrival_time}
                          >
                            {ARRIVAL_WINDOWS.map((windowLabel) => (
                              <option key={windowLabel} className="text-slate-900" value={windowLabel}>
                                {windowLabel}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Coming From</span>
                          <input
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("coming_from", event.target.value)}
                            placeholder="e.g. Delhi"
                            value={editorState.coming_from}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Next Destination</span>
                          <input
                            className="vh-input bg-white/5 border-white/10"
                            onChange={(event) => setField("going_to", event.target.value)}
                            placeholder="e.g. Goa"
                            value={editorState.going_to}
                          />
                        </label>
                      </div>

                      <div className="mt-6 rounded-[14px] border border-[rgba(57,247,44,0.24)] bg-[rgba(57,247,44,0.08)] p-4 text-sm text-white/80">
                        Once submitted, you will be redirected to your confirmation screen with your guest-share link.
                      </div>
                    </section>
                  ) : null}

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      className="rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10"
                      onClick={previousStep}
                      type="button"
                      variant="outline"
                    >
                      Prev
                    </Button>

                    {activeStep < 3 ? (
                      <Button className="rounded-[10px] bg-[var(--vh-pink)] text-white" onClick={nextStep} type="button">
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        className="rounded-[10px] bg-[var(--vh-pink)] text-white"
                        disabled={!canEditActiveSlot || isSubmitting}
                        onClick={() => void handleSubmit()}
                        type="button"
                      >
                        {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Finish Check-in
                      </Button>
                    )}
                  </div>

                  {!canEditActiveSlot ? (
                    <div className="rounded-[14px] border border-[rgba(57,247,44,0.24)] bg-[rgba(57,247,44,0.08)] p-4 text-sm text-white/80">
                      This guest slot is locked because it is already submitted or verified.
                    </div>
                  ) : null}
                </div>

                <aside className="space-y-5">
                  <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 shadow-[var(--vh-shadow-lg)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Guests</p>
                      <Button
                        className="h-9 rounded-[10px] border border-white/15 bg-white/5 px-3 text-white hover:bg-white/10"
                        disabled={isMutatingSlots}
                        onClick={() => void handleAddSlot()}
                        type="button"
                        variant="ghost"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {slots.map((slot) => (
                        <div
                          key={slot.slot_id}
                          className={cn(
                            "rounded-[14px] border p-3 transition-colors",
                            activeSlotId === slot.slot_id
                              ? "border-[var(--vh-pink)] bg-[rgba(253,16,94,0.12)]"
                              : "border-white/10 bg-white/5 hover:border-white/20",
                          )}
                        >
                          <button
                            className="w-full text-left"
                            onClick={() => void selectSlot(slot.slot_id)}
                            type="button"
                          >
                            <p className="text-xs uppercase tracking-[0.12em] text-white/50">{slot.label}</p>
                            <p className="mt-1 text-sm font-semibold text-white">{slot.guest_name || "Guest details pending"}</p>
                            <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${slotStatusTone(slot.kyc_status)}`}>
                              {slotStatusLabel(slot.kyc_status)}
                            </div>
                          </button>

                          {slots.length > 1 ? (
                            <button
                              aria-label={`Delete ${slot.label}`}
                              className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-[9px] border border-white/15 bg-white/5 text-white/75 hover:border-[var(--vh-hot)] hover:bg-[var(--vh-hot)] hover:text-white"
                              disabled={isMutatingSlots}
                              onClick={() => void handleDeleteSlot(slot.slot_id)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 shadow-[var(--vh-shadow-lg)]">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Active slot</p>
                    <h3 className="mt-2 font-['Space_Grotesk'] text-xl font-bold uppercase text-white">{activeSlot?.label || "Select a slot"}</h3>
                    <p className="mt-2 text-sm text-white/70">
                      {activeSlot?.guest_name || "Fill this slot, upload ID, and submit check-in."}
                    </p>

                    <div className="mt-4 rounded-[14px] border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                      <p>Reservation: {ezeeReservationId}</p>
                      <p className="mt-1">Property: {withBrandName(propertyName)}</p>
                    </div>

                    <Button asChild className="mt-4 w-full rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
                      <Link href="/bookings">Back to bookings</Link>
                    </Button>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={frontUploadInputRef}
        accept="image/*"
        className="hidden"
        onChange={(event) => handleSelectedFile("front", event)}
        type="file"
      />
      <input
        ref={backUploadInputRef}
        accept="image/*"
        className="hidden"
        onChange={(event) => handleSelectedFile("back", event)}
        type="file"
      />
      <input
        ref={frontCameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleSelectedFile("front", event)}
        type="file"
      />
      <input
        ref={backCameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleSelectedFile("back", event)}
        type="file"
      />

      {showUploadPreviewModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[20px] border border-white/12 bg-[var(--vh-section-a)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <p className="font-['Space_Grotesk'] text-lg font-bold uppercase tracking-[0.08em] text-white">Review image</p>
              <button
                aria-label="Close image preview"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                onClick={dismissUploadPreview}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-[14px] border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Selected ID preview" className="h-auto max-h-[360px] w-full object-contain bg-black/40" src={uploadPreviewDraft?.objectUrl || ""} />
            </div>

            <p className="mt-3 text-sm text-white/70">
              Confirm this {uploadPreviewDraft?.side || "ID"} image before upload.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button className="rounded-[10px] border border-white/20 bg-transparent text-white hover:bg-white/10" onClick={dismissUploadPreview} type="button" variant="outline">
                Cancel
              </Button>
              <Button className="rounded-[10px] bg-[var(--vh-pink)] text-white" onClick={() => void applyUploadPreview()} type="button">
                Apply
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isCompletionModalOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[20px] border border-white/12 bg-[var(--vh-section-a)] p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(57,247,44,0.28)] bg-[rgba(57,247,44,0.08)]">
              <CheckCircle2 className="h-10 w-10 text-[var(--vh-lime)]" />
            </div>
            <p className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-[0.06em] text-white">
              Web Check-in to {withBrandName(propertyName)} Done.
            </p>
            <p className="mt-3 text-sm text-white/70">
              You are all set. Open your booking confirmation to manage add guests and arrival details.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Button
                className="rounded-[10px] bg-[var(--vh-pink)] text-white"
                onClick={() => {
                  setIsCompletionModalOpen(false);
                  router.push(`/bookings/${encodeURIComponent(ezeeReservationId)}/confirmed`);
                }}
                type="button"
              >
                View Booking
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
