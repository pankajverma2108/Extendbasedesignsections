import type { EventCardProps, RoomCardProps } from "@/content/types";

const DEFAULT_API_BASE_URL = "https://vibehousebackend-production.up.railway.app";
const DEFAULT_PROPERTY_ID = "prop-bandra-001";
const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1647649644192-af6183269fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200";
const FALLBACK_ROOM_IMAGE = "/images/rooms/room-1.jpg";

// Lightweight runtime telemetry for malformed payload detection
export type TelemetryEvent = {
  type: "null_payload" | "missing_field" | "type_mismatch" | "fallback_used" | "empty_array";
  source: "event" | "room";
  field?: string;
  value?: unknown;
  timestamp: number;
};

let telemetryBuffer: TelemetryEvent[] = [];
const MAX_TELEMETRY_EVENTS = 100;

export function getTelemetryBuffer(): TelemetryEvent[] {
  return [...telemetryBuffer];
}

export function clearTelemetryBuffer(): void {
  telemetryBuffer = [];
}

function recordTelemetry(event: Omit<TelemetryEvent, "timestamp">): void {
  const telemetryEvent: TelemetryEvent = {
    ...event,
    timestamp: Date.now(),
  };

  telemetryBuffer.push(telemetryEvent);

  // Keep buffer bounded to prevent memory leaks
  if (telemetryBuffer.length > MAX_TELEMETRY_EVENTS) {
    telemetryBuffer = telemetryBuffer.slice(-MAX_TELEMETRY_EVENTS);
  }

  // Optional: Log to console in development
  // if (process.env.NODE_ENV === "development") {
  //   console.debug("[CX-API Telemetry]", telemetryEvent);
  // }
}

export type CxRoomCategory = {
  roomTypeId: string;
  slug: string;
  title: string;
  shortTitle: string;
  image: string;
  images?: string[];
  roomType: string;
  guestText: string;
  basePrice: number;
  totalPrice: number;
  availableCount: number;
  totalCount: number;
  inventoryText: string;
  features: string[];
  amenitiesLegend: string[];
};

const STATIC_ROOM_GALLERIES = [
  ["/images/rooms/room-1.jpg", "/images/rooms/room-2.jpg", "/images/rooms/room-3.webp"],
  ["/images/rooms/room-2.jpg", "/images/rooms/room-3.webp", "/images/rooms/room-4.jpg"],
  ["/images/rooms/room-4.jpg", "/images/rooms/room-1.jpg", "/images/rooms/room-3.webp"],
];

function pickStaticRoomGallery(slugOrName: string, index: number): string[] {
  const id = slugOrName.toLowerCase();

  if (id.includes("female")) {
    return STATIC_ROOM_GALLERIES[1];
  }

  if (id.includes("private")) {
    return STATIC_ROOM_GALLERIES[2];
  }

  if (id.includes("mixed") || id.includes("dorm")) {
    return STATIC_ROOM_GALLERIES[0];
  }

  return STATIC_ROOM_GALLERIES[index % STATIC_ROOM_GALLERIES.length];
}

type RawEvent = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  date?: unknown;
  time?: unknown;
  location?: unknown;
  capacity?: unknown;
  price_text?: unknown;
  contact_link?: unknown;
  poster_url?: unknown;
  badge_label?: unknown;
  badge_color?: unknown;
};

type RawRoomType = {
  id?: unknown;
  name?: unknown;
  slug?: unknown;
  type?: unknown;
  beds_per_room?: unknown;
  total_beds?: unknown;
  available_beds?: unknown;
  base_price_per_night?: unknown;
  total_price?: unknown;
  amenities?: unknown;
};

type RawRoomAvailability = {
  property_id?: unknown;
  checkin_date?: unknown;
  checkout_date?: unknown;
  no_of_nights?: unknown;
  room_types?: unknown;
};

export type NormalizedRoomType = {
  id: string;
  name: string;
  slug: string;
  type: string;
  bedsPerRoom: number;
  totalBeds: number;
  availableBeds: number;
  basePricePerNight: number;
  totalPrice: number;
  amenities: string[];
};

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}

function ensureString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function ensureNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function ensureArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function formatDateDdMmYyyy(input: unknown) {
  const raw = ensureString(input);
  if (!raw) {
    return "TBA";
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "TBA";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatTime12Hour(value: unknown) {
  const raw = ensureString(value);
  if (!raw) {
    return "Details on arrival";
  }

  const [h, m] = raw.split(":");
  const hour = Number(h);
  const minute = Number(m);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return "Details on arrival";
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function roomBadge(availableBeds: number) {
  if (availableBeds <= 0) {
    return { label: "Waitlist", color: "#ff2e62" };
  }

  if (availableBeds <= 3) {
    return { label: `${availableBeds} left`, color: "#facc15", textColor: "#0f172a" };
  }

  return undefined;
}

async function fetchUnknownJson(path: string): Promise<unknown> {
  const url = `${apiBaseUrl()}${path}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    if (!text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

function fallbackEvents(count = 3): EventCardProps[] {
  return Array.from({ length: count }, (_, index) => ({
    title: index === 0 ? "Details TBA" : `Experience Drop ${index + 1}`,
    date: "TBA",
    time: "Details on arrival",
    location: "Vibe House",
    price: "Details on arrival",
    image: FALLBACK_EVENT_IMAGE,
    capacity: "Limited slots",
    href: "/events",
    badge: {
      label: "Stay Tuned",
      color: "#00d1ff",
      textColor: "#0f172a",
    },
  }));
}

function normalizeEvent(event: RawEvent): EventCardProps {
  const title = ensureString(event.title, "Details TBA");
  if (!event.title) recordTelemetry({ type: "missing_field", source: "event", field: "title" });

  const date = formatDateDdMmYyyy(event.date);
  if (!event.date) recordTelemetry({ type: "missing_field", source: "event", field: "date" });

  const time = formatTime12Hour(event.time);
  if (!event.time) recordTelemetry({ type: "missing_field", source: "event", field: "time" });

  const location = ensureString(event.location, "Vibe House");
  if (!event.location) recordTelemetry({ type: "missing_field", source: "event", field: "location" });

  const price = ensureString(event.price_text, "Details on arrival");
  if (!event.price_text) recordTelemetry({ type: "missing_field", source: "event", field: "price_text" });

  const image = ensureString(event.poster_url, FALLBACK_EVENT_IMAGE);
  if (!event.poster_url) recordTelemetry({ type: "fallback_used", source: "event", field: "poster_url" });

  const capacityCount = ensureNumber(event.capacity, 0);
  const capacity = capacityCount > 0 ? `${capacityCount} guests` : "Limited slots";
  if (!event.capacity) recordTelemetry({ type: "missing_field", source: "event", field: "capacity" });

  const contact = ensureString(event.contact_link, "/events");
  const badgeLabel = ensureString(event.badge_label);
  const badgeColor = ensureString(event.badge_color, "#00d1ff");

  return {
    title,
    date,
    time,
    location,
    price,
    image,
    capacity,
    href: contact.startsWith("http") ? contact : "/events",
    badge: badgeLabel
      ? {
          label: badgeLabel,
          color: badgeColor,
        }
      : undefined,
  };
}

export async function getPublicEvents(options?: {
  propertyId?: string;
  limit?: number;
}): Promise<EventCardProps[]> {
  const propertyId = options?.propertyId || DEFAULT_PROPERTY_ID;
  const limit = options?.limit;
  const raw = await fetchUnknownJson(`/public/events?property_id=${encodeURIComponent(propertyId)}`);
  
  if (!raw) {
    recordTelemetry({ type: "null_payload", source: "event" });
  }

  const list = ensureArray(raw) as RawEvent[];

  if (list.length === 0) {
    recordTelemetry({ type: "empty_array", source: "event" });
  }

  const normalized = list.map(normalizeEvent);
  if (normalized.length === 0) {
    recordTelemetry({ type: "fallback_used", source: "event" });
    return fallbackEvents(limit ?? 3);
  }

  if (typeof limit === "number" && limit > 0) {
    return normalized.slice(0, limit);
  }

  return normalized;
}

function normalizeRoomType(input: RawRoomType): NormalizedRoomType {
  const availableBeds = Math.max(0, ensureNumber(input.available_beds, 0));
  if (!input.available_beds) recordTelemetry({ type: "missing_field", source: "room", field: "available_beds" });

  const basePricePerNight = Math.max(0, ensureNumber(input.base_price_per_night, 0));
  if (!input.base_price_per_night) recordTelemetry({ type: "missing_field", source: "room", field: "base_price_per_night" });

  const totalPrice = Math.max(basePricePerNight, ensureNumber(input.total_price, basePricePerNight));
  if (!input.total_price) recordTelemetry({ type: "missing_field", source: "room", field: "total_price" });

  const id = ensureString(input.id, `room-${Math.random().toString(36).slice(2, 8)}`);
  if (!input.id) recordTelemetry({ type: "missing_field", source: "room", field: "id" });

  const name = ensureString(input.name, "Room");
  const slug = ensureString(input.slug, ensureString(input.id, "room"));
  const amenities = ensureArray(input.amenities).map((item) => ensureString(item)).filter(Boolean);
  if (!input.amenities || amenities.length === 0) recordTelemetry({ type: "missing_field", source: "room", field: "amenities" });

  return {
    id,
    name,
    slug,
    type: ensureString(input.type, "ROOM"),
    bedsPerRoom: Math.max(1, ensureNumber(input.beds_per_room, 1)),
    totalBeds: Math.max(0, ensureNumber(input.total_beds, 0)),
    availableBeds,
    basePricePerNight,
    totalPrice,
    amenities,
  };
}

function fallbackRoomTypes(): NormalizedRoomType[] {
  return [
    {
      id: "fallback-dorm",
      name: "Dorm Room",
      slug: "dorm-room",
      type: "DORM",
      bedsPerRoom: 4,
      totalBeds: 0,
      availableBeds: 0,
      basePricePerNight: 599,
      totalPrice: 599,
      amenities: ["AC", "WiFi", "Locker"],
    },
    {
      id: "fallback-private",
      name: "Private Room",
      slug: "private-room",
      type: "PRIVATE",
      bedsPerRoom: 1,
      totalBeds: 0,
      availableBeds: 0,
      basePricePerNight: 1299,
      totalPrice: 1299,
      amenities: ["AC", "WiFi", "Attached Bathroom"],
    },
  ];
}

export async function getRoomAvailability(options?: {
  propertyId?: string;
  checkin?: string;
  checkout?: string;
}): Promise<NormalizedRoomType[]> {
  const propertyId = options?.propertyId || DEFAULT_PROPERTY_ID;
  const checkin = ensureString(options?.checkin) || new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkout = ensureString(options?.checkout) || tomorrow.toISOString().slice(0, 10);

  const path = `/guest/booking/rooms?property_id=${encodeURIComponent(propertyId)}&checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}`;
  const raw = (await fetchUnknownJson(path)) as RawRoomAvailability | null;
  
  if (!raw) {
    recordTelemetry({ type: "null_payload", source: "room" });
  }

  const list = ensureArray(raw?.room_types) as RawRoomType[];

  if (list.length === 0) {
    recordTelemetry({ type: "empty_array", source: "room" });
    return fallbackRoomTypes();
  }

  return list.map(normalizeRoomType);
}

export function roomTypesToHomeCards(roomTypes: NormalizedRoomType[]): RoomCardProps[] {
  return roomTypes.map((room, index) => {
    const occupancy = room.type.toUpperCase() === "PRIVATE"
      ? `${Math.max(room.bedsPerRoom, 1)} Guests`
      : `${Math.max(room.bedsPerRoom, 1)} Bed${room.bedsPerRoom > 1 ? "s" : ""}`;
    const images = pickStaticRoomGallery(room.slug || room.name, index);

    return {
      title: room.name,
      price: `Rs. ${room.basePricePerNight}`,
      occupancy,
      image: images[0] ?? FALLBACK_ROOM_IMAGE,
      images,
      badge: roomBadge(room.availableBeds),
      features: room.amenities.length > 0 ? room.amenities : ["Details on arrival"],
      href: "/property",
    };
  });
}

function inventoryLabel(availableBeds: number, totalBeds: number, type: string) {
  if (availableBeds <= 0) {
    return "Details on arrival";
  }

  if (type.toUpperCase() === "PRIVATE") {
    return `${availableBeds} rooms left`;
  }

  if (totalBeds > 0) {
    return `${availableBeds} / ${totalBeds} beds available`;
  }

  return `${availableBeds} beds available`;
}

export function roomTypesToPropertyCategories(roomTypes: NormalizedRoomType[]): CxRoomCategory[] {
  return roomTypes.map((room, index) => {
    const images = pickStaticRoomGallery(room.slug || room.name, index);

    return {
      roomTypeId: room.id,
      slug: room.slug || room.id,
      title: room.name,
      shortTitle: room.name,
      image: images[0] ?? FALLBACK_ROOM_IMAGE,
      images,
      roomType: room.type,
      guestText: `x ${Math.max(room.bedsPerRoom, 1)} Guest${room.bedsPerRoom > 1 ? "s" : ""}`,
      basePrice: room.basePricePerNight,
      totalPrice: room.totalPrice,
      availableCount: room.availableBeds,
      totalCount: room.totalBeds,
      inventoryText: inventoryLabel(room.availableBeds, room.totalBeds, room.type),
      features: room.amenities.length > 0 ? room.amenities.slice(0, 4) : ["Details on arrival"],
      amenitiesLegend: room.amenities.length > 0 ? room.amenities.slice(0, 4) : ["Details on arrival"],
    };
  });
}

export function getDefaultPropertyId() {
  return process.env.NEXT_PUBLIC_PROPERTY_ID?.trim() || DEFAULT_PROPERTY_ID;
}
