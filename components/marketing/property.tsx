"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  BatteryCharging,
  BedDouble,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Car,
  ChevronDown,
  ChevronRight,
  Clock3,
  Droplets,
  GlassWater,
  LampDesk,
  Lock,
  Minus,
  PawPrint,
  Plus,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Usb,
  Waves,
  Wifi,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { CxRoomCategory } from "@/lib/cx-api";
import {
  bookingSummary,
  locationMap,
  nearbyAttractions,
  propertyAmenities,
  propertyGallery,
  propertyGuidelines,
  propertyHero,
  propertyOverview,
  roomCategories,
  roomFaqs,
} from "@/content/rooms";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

const amenityIcons = {
  wifi: Wifi,
  snowflake: Snowflake,
  building: Building2,
  sparkles: Sparkles,
  car: Car,
  "paw-print": PawPrint,
  waves: Waves,
  "battery-charging": BatteryCharging,
  smartphone: Smartphone,
  "glass-water": GlassWater,
  camera: Camera,
  briefcase: Briefcase,
} as const;

const roomFeatureIcons: Record<string, typeof Wifi> = {
  "Privacy curtain": ShieldCheck,
  "Reading light": LampDesk,
  "USB charging": Usb,
  "Personal locker": Lock,
  "Women-only floor": ShieldCheck,
  "En-suite access": Droplets,
  "Secure locker": Lock,
  "Queen bed": BedDouble,
  "En-suite bathroom": Droplets,
  "Work desk": Briefcase,
  "Mini-fridge": GlassWater,
  AC: Snowflake,
  Locker: Lock,
  "Fresh linen": Sparkles,
  Housekeeping: Sparkles,
  "Private bath": Droplets,
};

type RoomCategory = CxRoomCategory;

function getLocalDate(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function toLocalDateString(date?: Date) {
  if (!date) {
    return "";
  }

  const localDate = new Date(date);
  localDate.setHours(12, 0, 0, 0);

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromDateString(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDisplayDate(value?: string): string {
  if (!value) {
    return "Select date";
  }

  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date?: Date) {
  if (!date) {
    return "Select";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getNightCount(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) {
    return 1;
  }

  const start = new Date(`${checkIn}T12:00:00`).getTime();
  const end = new Date(`${checkOut}T12:00:00`).getTime();

  return Math.max(1, Math.round((end - start) / 86400000));
}

function buildPropertyHref(checkIn: string, checkOut: string): string {
  const params = new URLSearchParams();

  if (checkIn) {
    params.set("checkin", checkIn);
  }

  if (checkOut) {
    params.set("checkout", checkOut);
  }

  const query = params.toString();
  return query ? `/property?${query}` : "/property";
}

function iconForLabel(label: string) {
  return roomFeatureIcons[label] ?? Sparkles;
}

function getRoomGallery(room: RoomCategory) {
  const sources = [room.image, ...propertyGallery.map((image) => image.src)];
  return Array.from(new Set(sources)).slice(0, 5);
}

function SectionTitle({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  return <h2 className={`text-[28px] font-bold leading-[34px] text-white ${className}`}>{title}</h2>;
}

function DateRangePicker({
  dateRange,
  onSelect,
  align = "right",
}: {
  dateRange: DateRange | undefined;
  onSelect: (value: DateRange | undefined) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 rounded-[20px] border border-white/12 bg-[rgba(15,16,26,0.86)] px-4 py-4 text-left hover:border-white/20"
          type="button"
        >
          <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 md:gap-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-[var(--vh-cyan)]">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Check In</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatShortDate(dateRange?.from)}</p>
            </div>
            <div className="min-w-0 border-l border-white/10 pl-3 md:pl-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Check Out</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatShortDate(dateRange?.to)}</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-white/60 ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align === "left" ? "start" : "end"}
        className="z-[200] w-[min(100vw-2rem,420px)] border-white/10 bg-[var(--vh-panel-strong)] p-3"
      >
        <Calendar
          className="vh-calendar-dark rounded-[20px]"
          defaultMonth={dateRange?.from}
          mode="range"
          numberOfMonths={1}
          onSelect={(nextValue) => {
            onSelect(nextValue);

            if (nextValue?.from && nextValue?.to) {
              setOpen(false);
            }
          }}
          selected={dateRange}
          disabled={{ before: getLocalDate(0) }}
        />
      </PopoverContent>
    </Popover>
  );
}

function DesktopBookingSummary({
  checkIn,
  checkOut,
  selectedCounts,
  roomCategoryList,
}: {
  checkIn: string;
  checkOut: string;
  selectedCounts: Record<string, number>;
  roomCategoryList: RoomCategory[];
}) {
  const propertyHref = useMemo(() => buildPropertyHref(checkIn, checkOut), [checkIn, checkOut]);
  const nights = getNightCount(checkIn, checkOut);
  const selectedRooms = roomCategoryList.filter((room) => (selectedCounts[room.slug] ?? 0) > 0);
  const roomTotal = selectedRooms.reduce(
    (sum, room) => sum + room.basePrice * (selectedCounts[room.slug] ?? 0) * nights,
    0,
  );
  const taxes = Math.round(roomTotal * 0.12);
  const grandTotal = roomTotal + taxes;

  return (
    <aside className="hidden self-start lg:sticky lg:top-28 lg:block">
      <div className="rounded-[26px] border border-white/12 bg-[var(--vh-panel-strong)] p-5 shadow-[var(--vh-shadow-lg)] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <h2 className="text-3xl font-semibold uppercase text-white">{bookingSummary.title}</h2>

        <div className="mt-5 rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-white">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/48">Check In</p>
              <p className="mt-1 text-sm font-semibold">{formatDisplayDate(checkIn)}</p>
            </div>
            <div className="rounded-full bg-[var(--vh-amber)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-900">
              {nights} {nights === 1 ? "Night" : "Nights"}
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/48">Check Out</p>
              <p className="mt-1 text-sm font-semibold">{formatDisplayDate(checkOut)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-white/82">
          {selectedRooms.length > 0 ? (
            selectedRooms.map((room) => (
              <div key={room.slug} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{room.title}</p>
                  <p className="text-xs text-white/55">
                    Rs. {room.basePrice} x {selectedCounts[room.slug]} x {nights} {nights === 1 ? "night" : "nights"}
                  </p>
                </div>
                <p className="font-semibold text-white">
                  Rs. {room.basePrice * (selectedCounts[room.slug] ?? 0) * nights}
                </p>
              </div>
            ))
          ) : (
            <p className="text-white/62">{bookingSummary.note}</p>
          )}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 text-sm text-white/82">
          <div className="flex items-center justify-between">
            <p>Taxes</p>
            <p className="font-semibold text-white">Rs. {taxes}</p>
          </div>
          <div className="mt-3 flex items-center justify-between text-base">
            <p className="font-semibold text-white">Payable Now</p>
            <p className="font-bold text-[var(--vh-amber)]">Rs. {grandTotal}</p>
          </div>
        </div>

        <Button asChild className="mt-5 w-full">
          <Link href={`${propertyHref}#availability`}>Book Now</Link>
        </Button>
      </div>
    </aside>
  );
}

function MobileStickySummary({
  checkIn,
  checkOut,
  selectedCounts,
  roomCategoryList,
}: {
  checkIn: string;
  checkOut: string;
  selectedCounts: Record<string, number>;
  roomCategoryList: RoomCategory[];
}) {
  const [open, setOpen] = useState(false);
  const nights = getNightCount(checkIn, checkOut);
  const selectedRooms = roomCategoryList.filter((room) => (selectedCounts[room.slug] ?? 0) > 0);
  const roomTotal = selectedRooms.reduce(
    (sum, room) => sum + room.basePrice * (selectedCounts[room.slug] ?? 0) * nights,
    0,
  );
  const taxes = Math.round(roomTotal * 0.12);
  const grandTotal = roomTotal + taxes;
  const hasSelection = selectedRooms.length > 0;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
      <div className="overflow-hidden rounded-[30px] border border-white/12 bg-[var(--vh-panel-strong)] shadow-[var(--vh-shadow-lg)] backdrop-blur-xl">
        {open && hasSelection ? (
          <div className="animate-vh-fade-in">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-lg font-semibold text-white">Booking Summary</p>
                <p className="text-xs text-white/58">
                  {nights} {nights === 1 ? "night" : "nights"} starting from {formatDisplayDate(checkIn)}
                </p>
              </div>
              <button
                aria-label="Hide Summary"
                className="rounded-full border border-white/10 p-2 text-white/70"
                onClick={() => setOpen(false)}
                type="button"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[40vh] space-y-4 overflow-y-auto px-4 pb-4">
              {selectedRooms.map((room) => (
                <div key={room.slug} className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-white">
                      {room.title} x {selectedCounts[room.slug]}
                    </p>
                    <p className="font-semibold text-white">
                      Rs. {room.basePrice * (selectedCounts[room.slug] ?? 0) * nights}
                    </p>
                  </div>
                  <p className="text-xs text-white/55">Rs. {room.basePrice} / night</p>
                </div>
              ))}
              <div className="border-t border-dashed border-white/15 pt-4 text-sm text-white/78">
                <div className="flex items-center justify-between">
                  <p>Tax</p>
                  <p>Rs. {taxes}</p>
                </div>
                <div className="mt-2 flex items-center justify-between font-semibold text-white">
                  <p>Grand Total</p>
                  <p>Rs. {grandTotal}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className={cn("flex items-center justify-between gap-4 p-4", open && hasSelection ? "border-t border-white/10" : "")}>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/48">
              {hasSelection ? "Payable Now" : "Starting From"}
            </p>
            <p className="text-2xl font-semibold text-white">Rs. {hasSelection ? grandTotal : roomCategoryList[0]?.basePrice ?? 0}</p>
          </div>
          {hasSelection ? (
            <Button className="h-10 rounded-[16px] px-5 py-2.5 text-sm" onClick={() => setOpen((value) => !value)} type="button">
              {open ? "Hide Summary" : "View Summary"}
            </Button>
          ) : (
            <a
              className="inline-flex h-10 items-center justify-center rounded-[16px] bg-[var(--vh-pink)] px-5 py-2.5 text-sm font-semibold text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.18)]"
              href="#availability"
            >
              Select Rooms
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function RoomCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.03)]">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_188px]">
        {/* Image skeleton */}
        <Skeleton className="h-[220px] w-full lg:h-full" />
        
        {/* Content skeleton */}
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-14 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        
        {/* Price skeleton */}
        <div className="flex flex-col justify-between border-t border-white/10 p-5 lg:border-l lg:border-t-0">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="mt-5 h-10 w-full rounded-full" />
        </div>
      </div>
    </article>
  );
}

function RoomDetailsPopup({
  room,
  count,
  imageIndex,
  onClose,
  onImageChange,
  onIncrement,
  onDecrement,
}: {
  room: RoomCategory | null;
  count: number;
  imageIndex: number;
  onClose: () => void;
  onImageChange: (value: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  useEffect(() => {
    if (!room) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [room, onClose]);

  if (!room) {
    return null;
  }

  const gallery = getRoomGallery(room);
  const activeImage = gallery[imageIndex] ?? gallery[0];
  const detailItems = [...room.features, ...room.amenitiesLegend];

  return (
    <div
      className="animate-vh-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(5,8,14,0.78)] px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-vh-scale-in grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] shadow-[var(--vh-shadow-lg)] lg:grid-cols-[1.2fr_0.8fr]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r lg:p-6">
          <div className="overflow-hidden rounded-[22px]">
            <ImageWithFallback alt={room.title} className="h-[260px] w-full object-cover md:h-[420px]" src={activeImage} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {gallery.map((image, index) => (
              <button
                key={image}
                className={`overflow-hidden rounded-[16px] border ${index === imageIndex ? "border-[var(--vh-pink)]" : "border-white/10"}`}
                onClick={() => onImageChange(index)}
                type="button"
              >
                <ImageWithFallback alt={`${room.title} ${index + 1}`} className="h-16 w-full object-cover" src={image} />
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[92vh] overflow-y-auto p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="vh-chip w-fit">Room Details</p>
              <h3 className="mt-4 text-3xl font-bold text-white">{room.title}</h3>
              <p className="mt-2 text-sm text-white/68">{room.guestText.replace("x ", "")}</p>
            </div>
            <button
              aria-label="Close"
              className="rounded-full border border-white/10 p-2 text-white/65 hover:border-white/25 hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-6 text-sm leading-7 text-white/80">
            Clean, practical, and comfortable for city stays, with features that make the room work well for both rest and day-to-day use.
          </p>

          <div className="mt-6 rounded-[18px] border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Availability</p>
            <p className="mt-2 text-lg font-semibold text-[var(--vh-amber)]">{room.inventoryText}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">Rs. {room.basePrice}</span>
                <span className="text-xs text-white/55">/ night</span>
              </div>
              {count === 0 ? (
                <Button className="h-10 rounded-full px-5" onClick={onIncrement} type="button">
                  Add
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Decrement Count"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--vh-surface-2)]"
                    onClick={onDecrement}
                    type="button"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-4 text-center text-sm font-semibold text-white">{count}</span>
                  <button
                    aria-label="Increment Count"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--vh-surface-2)]"
                    onClick={onIncrement}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Room Amenities</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {detailItems.map((label) => {
                const Icon = iconForLabel(label);

                return (
                  <div key={label} className="flex items-center gap-3 text-sm text-white/84">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--vh-cyan)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type PropertyProps = {
  propertyId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRoomCategories?: RoomCategory[];
};

export function Property({
  propertyId = "prop-bandra-001",
  initialCheckIn,
  initialCheckOut,
  initialRoomCategories = roomCategories,
}: PropertyProps) {
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});
  const [activeRoomSlug, setActiveRoomSlug] = useState<string | null>(null);
  const [activeRoomImageIndex, setActiveRoomImageIndex] = useState(0);
  const [roomCategoryList, setRoomCategoryList] = useState<RoomCategory[]>(
    initialRoomCategories.length > 0 ? initialRoomCategories : roomCategories,
  );
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: fromDateString(initialCheckIn) ?? getLocalDate(0),
    to: fromDateString(initialCheckOut) ?? getLocalDate(1),
  });

  const checkIn = toLocalDateString(dateRange?.from);
  const checkOut = toLocalDateString(dateRange?.to);
  const activeRoom = roomCategoryList.find((room) => room.slug === activeRoomSlug) ?? null;

  const updateCount = (slug: string, nextValue: number) => {
    setSelectedCounts((current) => ({
      ...current,
      [slug]: Math.max(0, nextValue),
    }));
  };

  const handleRangeChange = (nextValue: DateRange | undefined) => {
    setDateRange((current) => {
      if (!nextValue?.from) {
        return current;
      }

      const fallbackTo = nextValue.to ?? current?.to ?? getLocalDate(1);

      if (fallbackTo < nextValue.from) {
        return {
          from: nextValue.from,
          to: nextValue.from,
        };
      }

      return {
        from: nextValue.from,
        to: fallbackTo,
      };
    });
  };

  useEffect(() => {
    let mounted = true;

    async function loadRooms() {
      if (!checkIn || !checkOut) {
        return;
      }

      setIsLoadingRooms(true);

      try {
        const params = new URLSearchParams({
          property_id: propertyId,
          checkin: checkIn,
          checkout: checkOut,
        });

        const response = await fetch(`/api/cx/rooms?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { categories?: unknown };
        const nextCategories = Array.isArray(payload.categories) ? payload.categories : [];

        if (mounted && nextCategories.length > 0) {
          setRoomCategoryList(nextCategories as RoomCategory[]);
        }
      } catch {
        if (mounted) {
          setRoomCategoryList((current) => (current.length > 0 ? current : roomCategories));
        }
      } finally {
        if (mounted) {
          setIsLoadingRooms(false);
        }
      }
    }

    loadRooms();

    return () => {
      mounted = false;
    };
  }, [checkIn, checkOut, propertyId]);

  const openRoomPopup = (slug: string) => {
    setActiveRoomSlug(slug);
    setActiveRoomImageIndex(0);
  };

  return (
    <>
      <section className="vh-section pt-28 md:pt-32">
        <div className="vh-container">
          <FadeIn className="mb-8 text-center">
            <p className="vh-kicker inline-flex rounded-full border border-white/15 bg-white/6 px-4 py-1.5 text-white/72">
              {propertyHero.eyebrow}
            </p>
            <h1 className="mt-5 font-suez text-4xl font-normal uppercase tracking-[-0.04em] text-white md:text-6xl">
              {propertyHero.title}
            </h1>
            <p className="mt-2 text-4xl font-bold tracking-[-0.05em] text-white md:text-7xl">
              {propertyHero.location}
            </p>
            <p className="mx-auto mt-5 max-w-[760px] text-base leading-7 text-white/78 md:text-lg">
              {propertyHero.blurb}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/72">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <CalendarDays className="h-4 w-4 text-[var(--vh-cyan)]" />
                {propertyHero.addressName}
              </span>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:border-white/30 hover:bg-white/8"
                href={propertyHero.mapsHref}
                target="_blank"
              >
                View location
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="overflow-hidden rounded-[18px]">
                <ImageWithFallback
                  alt={propertyGallery[0].alt}
                  className="h-[340px] w-full object-cover md:h-[500px]"
                  src={propertyGallery[0].src}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-5">
              {propertyGallery.slice(1).map((image) => (
                <div key={image.src} className="overflow-hidden rounded-[18px]">
                  <ImageWithFallback alt={image.alt} className="h-[162px] w-full object-cover md:h-[242px]" src={image.src} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-14 pb-6 lg:pb-0">
            <section id="about" className="scroll-mt-28">
              <div className="flex max-w-4xl flex-col gap-6">
                <div>
                  <SectionTitle title="About" />
                  <p className="mt-2 max-w-[640px] text-sm leading-6 text-slate-300">
                    The lowdown before you toss your bag, claim a bunk, and start settling in.
                  </p>
                </div>
                <div className="relative w-full">
                  <div className={`relative overflow-hidden transition-all duration-500 ease-in-out ${aboutExpanded ? "max-h-[560px]" : "max-h-32"}`}>
                    <div className="space-y-4 text-sm leading-7 text-white/82 md:text-base">
                      {propertyOverview.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    {!aboutExpanded ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--vh-section-b)] via-[var(--vh-section-b)]/80 to-transparent" />
                    ) : null}
                  </div>
                  <button
                    className="mt-2 text-sm underline transition-colors duration-200 hover:text-[var(--vh-cyan)]"
                    onClick={() => setAboutExpanded((value) => !value)}
                    type="button"
                  >
                    {aboutExpanded ? "View Less" : "View More"}
                  </button>
                </div>
              </div>
            </section>

            <section id="amenities">
              <div>
                <SectionTitle title="Amenities" />
                <p className="mt-2 max-w-[640px] text-sm leading-6 text-slate-300">
                  The good stuff that keeps the stay easy, social, and very hard to complain about.
                </p>
              </div>
              <Stagger className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {propertyAmenities.map((amenity) => {
                  const Icon = amenityIcons[amenity.icon as keyof typeof amenityIcons] ?? Sparkles;
                  const colorIndex = propertyAmenities.indexOf(amenity) % 4;
                  const colors = ["#00d1ff", "#ff2e62", "#39ff14", "#facc15"];

                  return (
                    <StaggerItem key={amenity.label}>
                      <div className="mx-auto w-full max-w-[110px] text-center">
                        <span className="inline-flex h-10 w-10 items-center justify-center" style={{ color: colors[colorIndex] }}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <p className="mt-2 text-sm font-medium leading-5 text-white/82">{amenity.label}</p>
                      </div>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </section>

            <section id="availability" className="scroll-mt-28">
              <div className="space-y-6">
                <div className="text-left">
                  <SectionTitle title="Availability" />
                  <p className="mt-2 max-w-[640px] text-sm leading-6 text-slate-300">
                    Pick your perch for tonight. We&apos;ll keep the vibe ready.
                  </p>
                </div>
                <div className="max-w-[420px]">
                  <DateRangePicker align="left" dateRange={dateRange} onSelect={handleRangeChange} />
                </div>
                <div className="space-y-5">
                {isLoadingRooms ? (
                  <>
                    <RoomCardSkeleton />
                    <RoomCardSkeleton />
                    <RoomCardSkeleton />
                  </>
                ) : (
                  roomCategoryList.map((room) => {
                    const count = selectedCounts[room.slug] ?? 0;
                    const featureLabels = [...room.features, ...room.amenitiesLegend];

                    return (
                      <article key={room.slug} className="overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.03)]" style={{ backgroundColor: "#211122" }}>
                        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_188px]">
                          <button className="group block text-left" onClick={() => openRoomPopup(room.slug)} type="button">
                            <ImageWithFallback
                              alt={room.title}
                              className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-[1.03] lg:h-full"
                              src={room.image}
                            />
                          </button>

                          <div className="space-y-4 p-5">
                            <div className="flex flex-wrap items-center gap-3">
                              <button className="text-left" onClick={() => openRoomPopup(room.slug)} type="button">
                                <h3 className="text-xl font-semibold text-white hover:text-[var(--vh-cyan)]">{room.title}</h3>
                              </button>
                              <span className="text-sm text-white/55">{room.guestText}</span>
                            </div>

                            <p className="text-sm leading-7 text-white/78">
                              Designed for practical, easy stays with the essentials that matter most for sleep, work, and daily comfort.
                            </p>

                            <div className="flex flex-wrap gap-1">
                              {featureLabels.map((label, index) => {
                                const Icon = iconForLabel(label);
                                const colorIndex = index % 4;
                                const colors = ["#00d1ff", "#ff2e62", "#39ff14", "#facc15"];

                                return (
                                  <span
                                    key={label}
                                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs"
                                    title={label}
                                    style={{ color: colors[colorIndex] }}
                                  >
                                    <Icon className="h-3 w-3" />
                                    <span className="text-white/70">{label}</span>
                                  </span>
                                );
                              })}
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-semibold text-[var(--vh-amber)]">{room.inventoryText}</p>
                              <button
                                className="text-sm font-semibold text-[var(--vh-cyan)] hover:text-white"
                                onClick={() => openRoomPopup(room.slug)}
                                type="button"
                              >
                                View details
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col justify-between border-t border-white/10 p-5 lg:border-l lg:border-t-0">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Price / night</p>
                              <p className="mt-2 text-3xl font-bold text-[#ff2e62]">Rs. {room.basePrice}</p>
                            </div>

                            <div className="mt-5 flex items-center justify-end gap-2">
                              {count === 0 ? (
                                <Button className="w-full rounded-full" onClick={() => updateCount(room.slug, 1)} type="button">
                                  Add
                                </Button>
                              ) : (
                                <div className="ml-auto flex items-center gap-2">
                                  <button
                                    aria-label="Decrement Count"
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--vh-surface-2)]"
                                    onClick={() => updateCount(room.slug, count - 1)}
                                    type="button"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-4 text-center text-sm font-semibold text-white">{count}</span>
                                  <button
                                    aria-label="Increment Count"
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--vh-surface-2)]"
                                    onClick={() => updateCount(room.slug, count + 1)}
                                    type="button"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
                </div>
              </div>
            </section>

            <section id="guidelines">
              <SectionTitle title="Guidelines" />
              <div className="mt-6 max-w-4xl">
                <div className="mb-5 flex flex-wrap justify-between gap-x-4 gap-y-3 rounded-[16px] bg-white/6 p-4 text-white/84">
                  <div className="flex min-w-[180px] items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-[var(--vh-cyan)]" />
                    <span>
                      Check in:
                      <strong className="ml-1 text-white">{propertyGuidelines.checkIn}</strong>
                    </span>
                  </div>
                  <div className="flex min-w-[180px] items-center gap-3">
                    <Clock3 className="h-5 w-5 text-[var(--vh-cyan)]" />
                    <span>
                      Check out:
                      <strong className="ml-1 text-white">{propertyGuidelines.checkOut}</strong>
                    </span>
                  </div>
                </div>

                <Accordion className="space-y-4" defaultValue={["general-guidelines"]} type="multiple">
                  <AccordionItem className="overflow-hidden rounded-lg border border-white/10 bg-white/5 px-4" value="general-guidelines">
                    <AccordionTrigger className="text-base">General guidelines</AccordionTrigger>
                    <AccordionContent className="space-y-3 border-t border-white/10 pt-4 text-sm leading-7">
                      {propertyGuidelines.summary.map((item) => (
                        <p key={item}>- {item}</p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  {propertyGuidelines.sections.map((section, index) => (
                    <AccordionItem
                      key={section.title}
                      className="overflow-hidden rounded-lg border border-white/10 bg-white/5 px-4"
                      value={`guideline-${index}`}
                    >
                      <AccordionTrigger className="text-base">{section.title}</AccordionTrigger>
                      <AccordionContent className="space-y-3 border-t border-white/10 pt-4 text-sm leading-7">
                        {section.content.map((item) => (
                          <p key={item}>- {item}</p>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>

            <section id="faq">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                <div>
                  <SectionTitle title="Frequently Asked Questions" />
                  <Accordion className="mt-6 space-y-4" defaultValue={["faq-0"]} type="multiple">
                    {roomFaqs.map((faq, index) => (
                      <AccordionItem
                        key={faq.question}
                        className="overflow-hidden rounded-lg border border-white/10 bg-white/5 px-4"
                        value={`faq-${index}`}
                      >
                        <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
                        <AccordionContent className="border-t border-white/10 pt-4 text-sm leading-7">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                <div className="space-y-6">
                  <section>
                    <SectionTitle title="Location" />
                    <div className="mt-6 overflow-hidden rounded-[18px]">
                      <iframe
                        className="h-[300px] w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={locationMap.embedUrl}
                        title={locationMap.title}
                      />
                    </div>
                    <Link
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--vh-cyan)] hover:text-white"
                      href={propertyHero.mapsHref}
                      target="_blank"
                    >
                      Open in Maps
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </section>

                  <section>
                    <SectionTitle title="Nearby" />
                    <div className="mt-6 space-y-3">
                      {nearbyAttractions.map((place) => (
                        <div key={place.name} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                          <div>
                            <p className="font-semibold text-white">{place.name}</p>
                            <p className="text-xs uppercase tracking-[0.14em] text-white/48">{place.type}</p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/72">
                            {place.travel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                </div>
              </div>
            </section>
          </div>

          <DesktopBookingSummary
            checkIn={checkIn}
            checkOut={checkOut}
            selectedCounts={selectedCounts}
            roomCategoryList={roomCategoryList}
          />
        </div>
      </section>

      <MobileStickySummary
        checkIn={checkIn}
        checkOut={checkOut}
        selectedCounts={selectedCounts}
        roomCategoryList={roomCategoryList}
      />
      <RoomDetailsPopup
        count={activeRoom ? selectedCounts[activeRoom.slug] ?? 0 : 0}
        imageIndex={activeRoomImageIndex}
        onClose={() => setActiveRoomSlug(null)}
        onDecrement={() => activeRoom && updateCount(activeRoom.slug, (selectedCounts[activeRoom.slug] ?? 0) - 1)}
        onImageChange={setActiveRoomImageIndex}
        onIncrement={() => activeRoom && updateCount(activeRoom.slug, (selectedCounts[activeRoom.slug] ?? 0) + 1)}
        room={activeRoom}
      />
    </>
  );
}
