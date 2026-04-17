"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileSearch,
  LoaderCircle,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { QrScanner } from "@/components/booking/QrScanner";
import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
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
import {
  generateUidReferenceId,
  parseAadhaarSecureQrPayload,
  stripImageMetadata,
  validateIdDocumentFile,
  verifyUidaiDigitalSignature,
} from "@/lib/securityUtils";
import { toSafeErrorMessage } from "@/lib/ui-error";
import { cn } from "@/lib/utils";

import { BookingEmptyState, BookingPageShell } from "./booking-shell";

type Step = 1 | 2 | 3;
type GenderValue = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

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
  document_file_key?: string;
  document_file_url?: string;
  aadhaar_uid_reference?: string;
  consent_terms: boolean;
  consent_age: boolean;
};

type UploadPreviewDraft = {
  file: File;
  objectUrl: string;
};

type SlotsCachePayload = {
  slots: BookingSlotSummary[];
  bookingTitle: string;
  propertyName: string;
  bookingStatus?: string | null;
};

const STEPS: Array<{ id: Step; label: string; icon: typeof User; sticker: string }> = [
  { id: 1, label: "Basic Info", icon: User, sticker: "Names first" },
  { id: 2, label: "Gov. ID", icon: FileSearch, sticker: "ID ready" },
  { id: 3, label: "Time", icon: Clock3, sticker: "Final step" },
];

type KycFieldErrors = Partial<Record<
  | "first_name"
  | "last_name"
  | "email"
  | "date_of_birth"
  | "nationality_type"
  | "permanent_address"
  | "id_type"
  | "document_file_key"
  | "id_number"
  | "consent_terms"
  | "consent_age"
  | "arrival_time"
  | "coming_from"
  | "going_to"
  | "contact_number"
  | "purpose",
  string
>>;

const NAME_REGEX = /^[A-Za-z][A-Za-z' -]{1,49}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTACT_REGEX = /^\+\d{10,15}$/;
const PLACE_REGEX = /^[A-Za-z][A-Za-z0-9,'.\-\s]{1,79}$/;

function idNumberRegex(idType: string): RegExp {
  switch (idType) {
    case "AADHAAR":
      return /^X{4}-X{4}-\d{4}$/i;
    case "PASSPORT":
      return /^[A-PR-WY][1-9]\d{6}$/i;
    case "DRIVING_LICENCE":
      return /^[A-Z]{2}\d{2}\d{11,13}$/i;
    case "VOTER_ID":
      return /^[A-Z]{3}\d{7}$/i;
    default:
      return /^.{4,30}$/;
  }
}

function idNumberHint(idType: string): string {
  switch (idType) {
    case "AADHAAR":
      return "Scan the Aadhaar Secure QR to populate a masked number.";
    case "PASSPORT":
      return "Passport format looks invalid.";
    case "DRIVING_LICENCE":
      return "Driving licence format looks invalid.";
    case "VOTER_ID":
      return "Voter ID format looks invalid.";
    default:
      return "ID number format looks invalid.";
  }
}

function stepTabButtonClasses(isActive: boolean, isComplete: boolean): string {
  if (isActive || isComplete) {
    return "bg-[var(--vh-pink)] text-white shadow-[4px_4px_0px_rgba(0,0,0,0.45)] outline outline-1 outline-black";
  }

  return "bg-white/5 text-white/45 outline outline-1 outline-white/20";
}

function mergeFieldErrors(...parts: KycFieldErrors[]): KycFieldErrors {
  return parts.reduce<KycFieldErrors>((acc, item) => ({ ...acc, ...item }), {});
}

function parseDateString(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function toInputDateString(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDobDate(value?: string): string {
  const parsed = parseDateString(value);
  if (!parsed) {
    return "Select date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

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
    document_file_key: undefined,
    document_file_url: kyc.front_image_url || kyc.back_image_url || undefined,
    aadhaar_uid_reference: undefined,
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
  if (raw === "prefer_not_to_say" || raw === "prefer not to say") {
    return "PREFER_NOT_TO_SAY";
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

function isPaymentPendingStatus(status?: string | null): boolean {
  const normalized = (status || "").trim().toUpperCase();
  return normalized === "PENDING_PAYMENT" || normalized === "PAYMENT_PENDING" || normalized === "UNPAID";
}

function validateStepOne(state: KycEditorState): KycFieldErrors {
  const errors: KycFieldErrors = {};

  const firstName = state.first_name.trim();
  const lastName = state.last_name.trim();
  const email = state.email.trim();
  const contact = state.contact_number.trim();
  const address = state.permanent_address.trim();

  if (!firstName) {
    errors.first_name = "First name is required.";
  } else if (!NAME_REGEX.test(firstName)) {
    errors.first_name = "Use letters only for first name.";
  }

  if (!lastName) {
    errors.last_name = "Last name is required.";
  } else if (!NAME_REGEX.test(lastName)) {
    errors.last_name = "Use letters only for last name.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!state.date_of_birth || !/^\d{4}-\d{2}-\d{2}$/.test(state.date_of_birth)) {
    errors.date_of_birth = "Date of birth is required.";
  } else if (!isAdult(state.date_of_birth)) {
    errors.date_of_birth = "Guest must be at least 18 years old.";
  }

  if (!state.nationality_type.trim()) {
    errors.nationality_type = "Nationality is required.";
  }

  if (!CONTACT_REGEX.test(contact)) {
    errors.contact_number = "Contact number must include country code (example: +918765432109).";
  }

  if (!address) {
    errors.permanent_address = "Address is required.";
  } else if (address.length < 8) {
    errors.permanent_address = "Address is too short.";
  }

  return errors;
}

function validateStepTwo(state: KycEditorState): KycFieldErrors {
  const errors: KycFieldErrors = {};
  const idNumber = state.id_number.trim().toUpperCase();

  if (!state.id_type.trim()) {
    errors.id_type = "Select one government ID type.";
  }

  if (state.id_type === "AADHAAR") {
    if (!state.aadhaar_uid_reference) {
      errors.document_file_key = "Scan and verify the Aadhaar Secure QR before continuing.";
    }
  } else if (!state.document_file_url || !state.document_file_key) {
    errors.document_file_key = "Upload one ID document (max 5MB, PDF/JPEG/PNG).";
  }

  if (!idNumber) {
    errors.id_number = "ID number is required.";
  } else if (!idNumberRegex(state.id_type).test(idNumber)) {
    errors.id_number = idNumberHint(state.id_type);
  }

  if (!state.consent_terms) {
    errors.consent_terms = "Please accept Terms and Conditions.";
  }

  if (!state.consent_age) {
    errors.consent_age = "Age confirmation is required.";
  }

  return errors;
}

function validateStepThree(state: KycEditorState): KycFieldErrors {
  const errors: KycFieldErrors = {};
  const comingFrom = state.coming_from.trim();
  const goingTo = state.going_to.trim();
  if (!state.arrival_time.trim()) {
    errors.arrival_time = "Select your expected arrival window.";
  }

  if (!comingFrom) {
    errors.coming_from = "Please enter where you are coming from.";
  } else if (!PLACE_REGEX.test(comingFrom)) {
    errors.coming_from = "Coming from can only include letters and basic punctuation.";
  }

  if (!goingTo) {
    errors.going_to = "Please enter your next destination.";
  } else if (!PLACE_REGEX.test(goingTo)) {
    errors.going_to = "Next destination can only include letters and basic punctuation.";
  }

  if (!PURPOSES.includes(state.purpose)) {
    errors.purpose = "Select a valid travel purpose.";
  }

  return errors;
}

function validateForSubmit(state: KycEditorState): KycFieldErrors {
  return mergeFieldErrors(validateStepOne(state), validateStepTwo(state), validateStepThree(state));
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
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dobPickerOpen, setDobPickerOpen] = useState(false);
  const [isAadhaarScannerOpen, setIsAadhaarScannerOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState("Scan the Aadhaar Secure QR for verification.");
  const [scanAnnouncement, setScanAnnouncement] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<KycFieldErrors>({});
  const [uploadPreviewDraft, setUploadPreviewDraft] = useState<UploadPreviewDraft | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  const documentUploadInputRef = useRef<HTMLInputElement | null>(null);
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

  const documentPreview = editorState.document_file_url;

  const showUploadPreviewModal = Boolean(uploadPreviewDraft);

  const setField = <K extends keyof KycEditorState>(key: K, value: KycEditorState[K]) => {
    setEditorState((current) => {
      if (key === "id_type") {
        const nextIdType = String(value);
        return {
          ...current,
          id_type: nextIdType,
          id_number: "",
          document_file_key: undefined,
          document_file_url: undefined,
          aadhaar_uid_reference: undefined,
          [key]: value,
        };
      }

      return { ...current, [key]: value };
    });
    setFieldErrors((current) => ({
      ...current,
      [key]: undefined,
      ...(key === "id_type" ? { id_number: undefined, document_file_key: undefined } : {}),
    }));
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
    if (editorState.id_type !== "AADHAAR" && isAadhaarScannerOpen) {
      setIsAadhaarScannerOpen(false);
    }
  }, [editorState.id_type, isAadhaarScannerOpen]);

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

  async function handleSelectedFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validation = await validateIdDocumentFile(file);
    if (!validation.valid) {
      setFieldErrors((current) => ({
        ...current,
        document_file_key: validation.error || "Unsupported document.",
      }));
      event.target.value = "";
      return;
    }

    setFieldErrors((current) => ({ ...current, document_file_key: undefined }));

    if (file.type === "application/pdf") {
      await handleUpload(file);
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (uploadPreviewDraft?.objectUrl) {
      URL.revokeObjectURL(uploadPreviewDraft.objectUrl);
    }
    setUploadPreviewDraft({ file, objectUrl });
    event.target.value = "";
  }

  async function handleUpload(file: File) {
    const token = getStoredGuestToken();
    if (!token) {
      setErrorMessage("Your session ended. Please sign in again.");
      return;
    }

    setIsUploadingDocument(true);
    setErrorMessage(null);

    try {
      const sanitizedFile = await stripImageMetadata(file);
      const upload = await getBookingKycUploadUrl(token, ezeeReservationId, {
        file_name: sanitizedFile.name,
        content_type: sanitizedFile.type || "application/octet-stream",
      });

      await uploadFileToPresignedUrl(upload.uploadUrl, sanitizedFile);
      const publicUrl = publicFileUrlFromUploadUrl(upload.uploadUrl);

      setEditorState((current) => ({
        ...current,
        document_file_key: upload.fileKey,
        document_file_url: publicUrl,
      }));

      toast.success("ID uploaded", {
        description: "Document uploaded successfully.",
      });
    } catch (error) {
      setErrorMessage(toSafeErrorMessage(error, "Document upload failed. Please try again."));
    } finally {
      setIsUploadingDocument(false);
    }
  }

  async function applyUploadPreview() {
    if (!uploadPreviewDraft) {
      return;
    }

    const { file, objectUrl } = uploadPreviewDraft;
    setUploadPreviewDraft(null);
    URL.revokeObjectURL(objectUrl);
    await handleUpload(file);
  }

  function dismissUploadPreview() {
    if (uploadPreviewDraft?.objectUrl) {
      URL.revokeObjectURL(uploadPreviewDraft.objectUrl);
    }
    setUploadPreviewDraft(null);
  }

  async function handleRunOcr() {
    const token = getStoredGuestToken();
    if (!token || !activeSlotId || !editorState.document_file_key || editorState.id_type === "AADHAAR") {
      return;
    }

    setIsRunningOcr(true);
    setErrorMessage(null);

    try {
      const ocr = await runBookingKycOcr(token, ezeeReservationId, activeSlotId, {
        front_image_key: editorState.document_file_key,
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

  const handleAadhaarScanSuccess = useCallback(
    async (decodedText: string) => {
      setScanAnnouncement("");
      setErrorMessage(null);

      const secureData = parseAadhaarSecureQrPayload(decodedText);
      if (!secureData) {
        setScanStatus("Invalid QR payload.");
        setScanAnnouncement("Invalid Aadhaar Secure QR payload.");
        setFieldErrors((current) => ({
          ...current,
          id_number: "Invalid Secure QR. Scan a valid Aadhaar Secure QR code.",
        }));
        return;
      }

      const uidaiPublicKey = process.env.NEXT_PUBLIC_UIDAI_QR_PUBLIC_KEY_PEM;
      if (!uidaiPublicKey) {
        setScanStatus("UIDAI public key not configured.");
        setScanAnnouncement("UIDAI digital signature key is missing.");
        setFieldErrors((current) => ({
          ...current,
          id_number: "UIDAI signature key is missing. Configure NEXT_PUBLIC_UIDAI_QR_PUBLIC_KEY_PEM.",
        }));
        return;
      }

      const isSignatureValid = await verifyUidaiDigitalSignature(
        secureData,
        uidaiPublicKey,
      );

      if (!isSignatureValid) {
        setScanStatus("Invalid QR signature.");
        setScanAnnouncement("Invalid QR signature. Scan could not be verified.");
        setFieldErrors((current) => ({
          ...current,
          id_number: "Invalid QR signature. Please scan a valid Aadhaar Secure QR.",
        }));
        return;
      }

      const uidReference =
        secureData.uidToken
        || await generateUidReferenceId(
          `${secureData.maskedAadhaar}|${secureData.name}|${secureData.dateOfBirth}`,
        );

      setEditorState((current) => {
        const [firstName, ...lastNameParts] = secureData.name.trim().split(/\s+/).filter(Boolean);

        return {
          ...current,
          first_name: firstName || current.first_name,
          last_name: lastNameParts.join(" ") || current.last_name,
          date_of_birth: normalizeBirthDate(secureData.dateOfBirth) || current.date_of_birth,
          gender: normalizeGender(secureData.gender),
          permanent_address: secureData.address || current.permanent_address,
          id_number: secureData.maskedAadhaar,
          aadhaar_uid_reference: uidReference,
          document_file_key: undefined,
          document_file_url: undefined,
        };
      });

      setScanStatus("Scanning complete.");
      setScanAnnouncement("Aadhaar Secure QR verified successfully.");
      setFieldErrors((current) => ({
        ...current,
        id_number: undefined,
        document_file_key: undefined,
      }));
      setIsAadhaarScannerOpen(false);

      toast.success("Secure QR verified", {
        description: "Masked Aadhaar and UID reference captured.",
      });
    },
    [],
  );

  function nextStep() {
    const stepErrors =
      activeStep === 1 ? validateStepOne(editorState) : activeStep === 2 ? validateStepTwo(editorState) : {};

    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors((current) => ({ ...current, ...stepErrors }));
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
    setFieldErrors({});
    setActiveStep((current) => Math.max(1, current - 1) as Step);
  }

  async function handleSubmit() {
    const token = getStoredGuestToken();
    if (!token || !activeSlotId) {
      setErrorMessage("Your session ended. Please sign in again.");
      return;
    }

    const validationErrors = validateForSubmit(editorState);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors((current) => ({ ...current, ...validationErrors }));

      const hasStepOneError = Object.keys(validationErrors).some((key) => [
        "first_name",
        "last_name",
        "email",
        "date_of_birth",
        "contact_number",
        "nationality_type",
        "permanent_address",
      ].includes(key));
      const hasStepTwoError = Object.keys(validationErrors).some((key) => [
        "id_type",
        "document_file_key",
        "id_number",
        "consent_terms",
        "consent_age",
      ].includes(key));

      if (hasStepOneError) {
        setActiveStep(1);
      } else if (hasStepTwoError) {
        setActiveStep(2);
      } else {
        setActiveStep(3);
      }

      return;
    }

    const payload: KycSubmitPayload = {
      nationality_type: editorState.nationality_type,
      id_type: editorState.id_type,
      full_name: `${editorState.first_name} ${editorState.last_name}`.replace(/\s+/g, " ").trim(),
      date_of_birth: editorState.date_of_birth,
      // Aadhaar flow sends only UID token/reference (never a 12-digit number).
      id_number: editorState.id_type === "AADHAAR"
        ? (editorState.aadhaar_uid_reference || editorState.id_number.trim())
        : editorState.id_number.trim(),
      permanent_address: editorState.permanent_address.trim(),
      contact_number: editorState.contact_number.trim(),
      coming_from: editorState.coming_from.trim(),
      going_to: editorState.going_to.trim(),
      purpose: editorState.purpose,
      front_image_url: editorState.id_type === "AADHAAR" ? undefined : editorState.document_file_url,
      back_image_url: undefined,
      consent_given: editorState.consent_terms && editorState.consent_age,
    };

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      await submitBookingKyc(token, ezeeReservationId, activeSlotId, payload);
      toast.success("Web check-in submitted", {
        description: "Your details are submitted successfully.",
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
    <section className="min-h-screen bg-[#111111] pb-12 pt-24 animate-vh-fade-in md:pt-28">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-[980px]">
          <div className="relative min-h-10">
            <Button
              asChild
              className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-white/10 bg-transparent p-0 text-white shadow-none hover:bg-white/10"
              variant="ghost"
            >
              <Link aria-label="Back to booking detail" href={`/bookings/${encodeURIComponent(ezeeReservationId)}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="vh-title text-center text-[26px] leading-[1.12] text-white md:text-[30px]">Web Check-In</h1>
          </div>

          <p className="mt-2 text-center text-sm text-[#99A1AF]">{propertyName}</p>
          <p className="mt-1 text-center text-xs uppercase tracking-[0.12em] text-[#6A7282]">{bookingTitle}</p>

          {errorMessage ? (
            <div className="mt-4 rounded-[12px] border border-[rgba(255,106,95,0.35)] bg-[rgba(255,106,95,0.1)] px-4 py-3 text-sm text-[#ffd9d4]" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <div className="mx-auto mb-8 mt-8 flex max-w-[760px] items-center justify-center">
            <div className="grid w-full items-start gap-3" style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}>
              {STEPS.map((step, index) => {
                const isCurrent = step.id === activeStep;
                const isDone = step.id < activeStep;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="relative flex flex-col items-center gap-3">
                    {index < STEPS.length - 1 ? (
                      <div className={`absolute left-[calc(50%+28px)] top-6 hidden h-[2px] w-[calc(100%-56px)] md:block ${activeStep > step.id ? "bg-[var(--vh-pink)]" : "bg-white/10"}`} />
                    ) : null}
                    <button
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-[14px] ${stepTabButtonClasses(isCurrent, isDone)}`}
                      onClick={() => {
                        if (step.id <= activeStep) {
                          setActiveStep(step.id);
                        }
                      }}
                      type="button"
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                    <div className="flex flex-col items-center gap-2">
                      <p className={`text-center text-[11px] font-bold uppercase tracking-[0.08em] ${isCurrent || isDone ? "text-white" : "text-white/45"}`}>
                        {step.label}
                      </p>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isCurrent || isDone ? "bg-white/10 text-white/75" : "bg-white/5 text-white/35"}`}>
                        {step.sticker}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-[16px] border border-white/5 bg-[#1A1A1A] p-5 md:p-8">
              {activeStep === 1 ? (
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[20px] font-bold leading-7 text-white">Basic Info</h2>
                    <User className="h-5 w-5 text-[#99A1AF]" />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">First Name</span>
                      <input
                        className={`h-12 w-full rounded-[10px] border bg-[#212121] px-4 text-sm text-white outline-none placeholder:text-[#6A7282] ${fieldErrors.first_name ? "border-[#ff6a5f]" : "border-white/10 focus:border-[var(--vh-pink)]"}`}
                        onChange={(event) => setField("first_name", event.target.value)}
                        placeholder="First name"
                        value={editorState.first_name}
                      />
                      {fieldErrors.first_name ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.first_name}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Last Name</span>
                      <input
                        className={`h-12 w-full rounded-[10px] border bg-[#212121] px-4 text-sm text-white outline-none placeholder:text-[#6A7282] ${fieldErrors.last_name ? "border-[#ff6a5f]" : "border-white/10 focus:border-[var(--vh-pink)]"}`}
                        onChange={(event) => setField("last_name", event.target.value)}
                        placeholder="Last name"
                        value={editorState.last_name}
                      />
                      {fieldErrors.last_name ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.last_name}</p> : null}
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Email</span>
                      <input
                        className={`h-12 w-full rounded-[10px] border bg-[#212121] px-4 text-sm text-white outline-none placeholder:text-[#6A7282] ${fieldErrors.email ? "border-[#ff6a5f]" : "border-white/10 focus:border-[var(--vh-pink)]"}`}
                        onChange={(event) => setField("email", event.target.value)}
                        placeholder="Email"
                        type="email"
                        value={editorState.email}
                      />
                      {fieldErrors.email ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.email}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Date Of Birth</span>
                      <Popover onOpenChange={setDobPickerOpen} open={dobPickerOpen}>
                        <PopoverTrigger asChild>
                          <button
                            className={`flex h-12 w-full items-center justify-between rounded-[10px] border bg-[#212121] px-4 text-left text-sm text-white outline-none ${fieldErrors.date_of_birth ? "border-[#ff6a5f]" : "border-white/10 hover:border-white/20"}`}
                            type="button"
                          >
                            <span>{formatDobDate(editorState.date_of_birth)}</span>
                            <ChevronDown className="h-4 w-4 text-[#99A1AF]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="z-[220] w-auto border-white/10 bg-[#10111a] p-2">
                          <Calendar
                            captionLayout="dropdown"
                            className="vh-calendar-dark vh-calendar-balanced rounded-[16px]"
                            disabled={{ after: new Date() }}
                            fromYear={1900}
                            mode="single"
                            onSelect={(nextDate) => {
                              if (!nextDate) {
                                return;
                              }

                              setField("date_of_birth", toInputDateString(nextDate));
                              setDobPickerOpen(false);
                            }}
                            selected={parseDateString(editorState.date_of_birth)}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                      {fieldErrors.date_of_birth ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.date_of_birth}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Gender</span>
                      <Select onValueChange={(value) => setField("gender", value as GenderValue)} value={editorState.gender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Nationality</span>
                      <Select onValueChange={(value) => setField("nationality_type", value)} value={editorState.nationality_type}>
                        <SelectTrigger className={fieldErrors.nationality_type ? "border-[#ff6a5f]" : ""}>
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIAN">Indian</SelectItem>
                          <SelectItem value="OTHER">Other Nationality</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.nationality_type ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.nationality_type}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Contact Number</span>
                      <input
                        className={`h-12 w-full rounded-[10px] border bg-[#212121] px-4 text-sm text-white outline-none placeholder:text-[#6A7282] ${fieldErrors.contact_number ? "border-[#ff6a5f]" : "border-white/10 focus:border-[var(--vh-pink)]"}`}
                        onChange={(event) => setField("contact_number", normalizeContactNumber(event.target.value))}
                        placeholder="+918765432109"
                        value={editorState.contact_number}
                      />
                      {fieldErrors.contact_number ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.contact_number}</p> : null}
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Address</span>
                      <textarea
                        className={`min-h-[120px] w-full resize-y rounded-[10px] border bg-[#212121] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6A7282] ${fieldErrors.permanent_address ? "border-[#ff6a5f]" : "border-white/10 focus:border-[var(--vh-pink)]"}`}
                        onChange={(event) => setField("permanent_address", event.target.value)}
                        placeholder="Full address"
                        value={editorState.permanent_address}
                      />
                      {fieldErrors.permanent_address ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.permanent_address}</p> : null}
                    </label>
                  </div>
                </section>
              ) : null}

              {activeStep === 2 ? (
                <section>
                  <h2 className="text-[20px] font-bold leading-7 text-white">Just one ID needed</h2>
                  <p className="mt-2 text-sm text-[#99A1AF]">Choose one document to upload.</p>
                  {fieldErrors.id_type ? <p className="mt-2 text-xs text-[#ff6a5f]">{fieldErrors.id_type}</p> : null}

                  <div className="mt-4 grid gap-3">
                    {ID_TYPES.map((idType) => (
                      <button
                        key={idType.value}
                        className={cn(
                          "flex items-center justify-between rounded-[14px] border px-4 py-4 text-left transition-colors",
                          editorState.id_type === idType.value
                            ? "border-[var(--vh-pink)] bg-[rgba(198,40,40,0.12)] text-[var(--vh-pink)]"
                            : "border-white/10 bg-[#212121] text-white hover:border-white/20",
                        )}
                        onClick={() => setField("id_type", idType.value)}
                        type="button"
                      >
                        <p className="text-base font-semibold tracking-[0.02em]">{idType.label}</p>
                        {editorState.id_type === idType.value ? <Upload className="h-4 w-4" /> : null}
                      </button>
                    ))}
                  </div>

                  {editorState.id_type === "AADHAAR" ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[12px] border border-[rgba(241,88,36,0.3)] bg-[rgba(241,88,36,0.08)] p-4 text-sm text-[#ffd9d4]">
                        UIDAI compliance mode is active. Aadhaar uploads are disabled. Scan only the Aadhaar Secure QR
                        from the physical card or mAadhaar app.
                      </div>

                      <Button
                        className="rounded-[10px] bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink-soft)]"
                        disabled={!canEditActiveSlot}
                        onClick={() => setIsAadhaarScannerOpen((current) => !current)}
                        type="button"
                      >
                        <Upload className="h-4 w-4" />
                        {isAadhaarScannerOpen ? "Stop Secure QR Scan" : "Start Secure QR Scan"}
                      </Button>

                      <p aria-live="polite" className="text-sm text-[#99A1AF]">{scanStatus}</p>
                      <p aria-live="polite" className="sr-only">{scanAnnouncement}</p>

                      {isAadhaarScannerOpen ? (
                        <QrScanner
                          active={isAadhaarScannerOpen}
                          onError={(message) => {
                            setScanStatus(message);
                            setScanAnnouncement(message);
                          }}
                          onScanSuccess={(decodedText) => {
                            void handleAadhaarScanSuccess(decodedText);
                          }}
                          onStatusChange={(statusText) => {
                            setScanStatus(statusText);
                          }}
                        />
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Masked Aadhaar</span>
                          <input
                            className="h-12 w-full rounded-[10px] border border-white/10 bg-[#212121] px-4 text-sm text-white outline-none"
                            placeholder="XXXX-XXXX-1234"
                            readOnly
                            value={editorState.id_number}
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">UID Reference</span>
                          <input
                            className="h-12 w-full rounded-[10px] border border-white/10 bg-[#212121] px-4 text-sm text-white outline-none"
                            placeholder="Generated after verification"
                            readOnly
                            value={editorState.aadhaar_uid_reference || ""}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[12px] border border-white/10 bg-[#212121] p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Upload ID Document</p>
                        <div className="relative mt-3 flex h-44 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-black/30">
                          {documentPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt="ID preview" className="h-full w-full object-cover" src={documentPreview} />
                          ) : (
                            <p className="text-xs uppercase tracking-[0.12em] text-[#6A7282]">No file selected</p>
                          )}
                          {isRunningOcr ? (
                            <div className="pointer-events-none absolute inset-0 bg-black/35">
                              <div className="vh-scan-line absolute left-0 right-0 h-[2px] bg-[var(--vh-pink)] shadow-[0_0_12px_rgba(198,40,40,0.7)]" />
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-3">
                          <Button
                            className="rounded-[10px] border border-white/20 bg-transparent text-white hover:bg-white/8"
                            disabled={!canEditActiveSlot || isUploadingDocument}
                            onClick={() => documentUploadInputRef.current?.click()}
                            type="button"
                            variant="outline"
                          >
                            {isUploadingDocument ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Upload
                          </Button>
                        </div>
                      </div>

                      {fieldErrors.document_file_key ? (
                        <p className="text-xs text-[#ff6a5f]" role="alert">{fieldErrors.document_file_key}</p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          className="rounded-[10px] bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink-soft)]"
                          disabled={!canEditActiveSlot || !editorState.document_file_key || isRunningOcr}
                          onClick={() => void handleRunOcr()}
                          type="button"
                        >
                          {isRunningOcr ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                          {isRunningOcr ? "Scanning ID" : "Scan ID"}
                        </Button>
                        <p className="text-sm text-[#99A1AF]">Run scan to auto-fill name, DOB, ID number, and address.</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">ID Number</span>
                      <input
                        className={`h-12 w-full rounded-[10px] border bg-[#212121] px-4 text-sm text-white outline-none placeholder:text-[#6A7282] ${fieldErrors.id_number ? "border-[#ff6a5f]" : "border-white/10 focus:border-[var(--vh-pink)]"} ${editorState.id_type === "AADHAAR" ? "opacity-90" : ""}`}
                        onChange={(event) => setField("id_number", event.target.value)}
                        placeholder={editorState.id_type === "AADHAAR" ? "Masked Aadhaar from secure QR" : "As printed on ID"}
                        readOnly={editorState.id_type === "AADHAAR"}
                        value={editorState.id_number}
                      />
                      {fieldErrors.id_number ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.id_number}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Purpose</span>
                      <Select onValueChange={(value) => setField("purpose", value)} value={editorState.purpose}>
                        <SelectTrigger className={fieldErrors.purpose ? "border-[#ff6a5f]" : ""}>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          {PURPOSES.map((purpose) => (
                            <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.purpose ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.purpose}</p> : null}
                    </label>
                  </div>

                  <div className="mt-5 space-y-3 rounded-[12px] border border-white/10 bg-[#212121] p-4">
                    <label className="flex items-start gap-3 text-sm text-[#D1D5DC]">
                      <input
                        checked={editorState.consent_terms}
                        className="mt-1 accent-[var(--vh-pink)]"
                        onChange={(event) => setField("consent_terms", event.target.checked)}
                        type="checkbox"
                      />
                      <span>
                        I hereby consent to provide my identity details for guest registration as required by local law.
                        I understand my data is encrypted and processed according to <Link className="underline decoration-white/40 underline-offset-4" href="/policies">[Privacy Policy]</Link>.
                      </span>
                    </label>
                    {fieldErrors.consent_terms ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.consent_terms}</p> : null}
                    <label className="flex items-start gap-3 text-sm text-[#D1D5DC]">
                      <input
                        checked={editorState.consent_age}
                        className="mt-1 accent-[var(--vh-pink)]"
                        onChange={(event) => setField("consent_age", event.target.checked)}
                        type="checkbox"
                      />
                      I confirm that I am above the age of 18.
                    </label>
                    {fieldErrors.consent_age ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.consent_age}</p> : null}
                  </div>
                </section>
              ) : null}

              {activeStep === 3 ? (
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[20px] font-bold leading-7 text-white">Final Details</h2>
                    <Clock3 className="h-5 w-5 text-[#99A1AF]" />
                  </div>

                  <div className="mt-5 grid gap-4">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Time of Arrival</span>
                      <Select onValueChange={(value) => setField("arrival_time", value)} value={editorState.arrival_time}>
                        <SelectTrigger className={fieldErrors.arrival_time ? "border-[#ff6a5f]" : ""}>
                          <SelectValue placeholder="Select arrival slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {ARRIVAL_WINDOWS.map((windowLabel) => (
                            <SelectItem key={windowLabel} value={windowLabel}>{windowLabel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.arrival_time ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.arrival_time}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Coming From</span>
                      <input
                        className={`h-12 w-full rounded-[10px] border bg-[#212121] px-4 text-sm text-white outline-none placeholder:text-[#6A7282] ${fieldErrors.coming_from ? "border-[#ff6a5f]" : "border-white/10 focus:border-[var(--vh-pink)]"}`}
                        onChange={(event) => setField("coming_from", event.target.value)}
                        placeholder="e.g. Delhi"
                        value={editorState.coming_from}
                      />
                      {fieldErrors.coming_from ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.coming_from}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Next Destination</span>
                      <input
                        className={`h-12 w-full rounded-[10px] border bg-[#212121] px-4 text-sm text-white outline-none placeholder:text-[#6A7282] ${fieldErrors.going_to ? "border-[#ff6a5f]" : "border-white/10 focus:border-[var(--vh-pink)]"}`}
                        onChange={(event) => setField("going_to", event.target.value)}
                        placeholder="e.g. Goa"
                        value={editorState.going_to}
                      />
                      {fieldErrors.going_to ? <p className="text-xs text-[#ff6a5f]">{fieldErrors.going_to}</p> : null}
                    </label>
                  </div>

                  <div className="mt-6 rounded-[12px] border border-[rgba(5,223,114,0.3)] bg-[rgba(5,223,114,0.08)] p-4 text-sm text-[#D1D5DC]">
                    Once submitted, you will be redirected to your confirmation screen with your guest-share link.
                  </div>
                </section>
              ) : null}

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button
                  className="rounded-[10px] border border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={previousStep}
                  type="button"
                  variant="outline"
                >
                  Prev
                </Button>

                {activeStep < 3 ? (
                  <Button className="rounded-[10px] bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink-soft)]" onClick={nextStep} type="button">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="rounded-[10px] bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink-soft)]"
                    disabled={!canEditActiveSlot || isSubmitting}
                    onClick={() => void handleSubmit()}
                    type="button"
                  >
                    {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Finish Check-in
                  </Button>
                )}
              </div>

              {!canEditActiveSlot ? (
                <div className="mt-4 rounded-[12px] border border-[rgba(5,223,114,0.3)] bg-[rgba(5,223,114,0.08)] p-4 text-sm text-[#D1D5DC]">
                  This check-in entry is locked because it is already submitted or verified.
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-[16px] border border-white/5 bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#99A1AF]">Booking Summary</p>
              <div className="mt-3 rounded-[10px] border border-white/10 bg-[#212121] p-3 text-xs text-[#99A1AF]">
                <p>Reservation: {ezeeReservationId}</p>
                <p className="mt-1">Property: {propertyName}</p>
                <p className="mt-1">Guests completed: {completedSlotCount}/{slots.length}</p>
              </div>

              <Button asChild className="mt-4 w-full rounded-[10px] border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
                <Link href="/bookings">Back to bookings</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={documentUploadInputRef}
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(event) => {
          void handleSelectedFile(event);
        }}
        type="file"
      />

      {showUploadPreviewModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-[448px] overflow-hidden rounded-[16px] border border-white/10 bg-[#1A1A1A] shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-lg font-bold text-white">Crop Image</p>
              <button
                aria-label="Close image preview"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#99A1AF] hover:bg-white/10"
                onClick={dismissUploadPreview}
                type="button"
              >
                x
              </button>
            </div>

            <div className="p-4">
              <div className="overflow-hidden rounded-[10px] border border-[#4A5565] bg-[#1E2939]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Selected ID preview"
                  className="h-[248px] w-full object-contain"
                  src={uploadPreviewDraft?.objectUrl || ""}
                />
              </div>

              <p className="mt-4 text-center text-sm text-[#99A1AF]">
                Make sure the details on the document are clearly visible.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button
                  className="rounded-[10px] border border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={dismissUploadPreview}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button className="rounded-[10px] bg-[var(--vh-pink)] text-white hover:bg-[var(--vh-pink-soft)]" onClick={() => void applyUploadPreview()} type="button">
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCompletionModalOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(17,17,17,0.95)] px-4">
          <div className="w-full max-w-xl text-center">
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-[rgba(0,201,80,0.2)] bg-[rgba(0,201,80,0.1)] shadow-[0_0_100px_rgba(34,197,94,0.2)]">
              <div className="flex h-[142px] w-[142px] items-center justify-center rounded-full border border-[rgba(0,201,80,0.3)]">
                <CheckCircle2 className="h-14 w-14 text-[#00C950]" />
              </div>
            </div>

            <p className="mt-8 text-3xl font-black leading-10 text-white md:text-[30px] md:leading-[36px]">
              Web Check-in to <br />
              <span className="text-[var(--vh-pink)]">{propertyName}</span>
            </p>
            <p className="mt-3 text-xl font-bold uppercase tracking-[0.1em] text-white">
              Done.
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                className="h-14 rounded-full bg-white px-10 text-sm font-black uppercase tracking-[0.08em] text-black hover:bg-white/90"
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
