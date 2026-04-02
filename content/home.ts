import { rooms } from "@/content/rooms";
import { upcomingEvents } from "@/content/events";

export type HomeSectionId =
  | "amenities"
  | "rooms"
  | "upsell"
  | "events"
  | "experience"
  | "energy"
  | "reviews"
  | "cta";

export const heroImages = [
  "/images/property/hero-1.jpg",
  "/images/property/hero-2.jpg",
  "/images/property/hero-3.jpg",
  "/images/property/hero-4.jpg",
];

export const assurances = [
  { label: "Clean Rooms", color: "#00d1ff" },
  { label: "Safe & Secure", color: "#ff2e62" },
  { label: "AC Dorms", color: "#39ff14" },
  { label: "24/7 Reception", color: "#facc15" },
  { label: "Secure Lockers", color: "#ff2e62" },
  { label: "7-Day Cancel", color: "#39ff14" },
];

export const amenities = [
  { label: "Fast Wi-Fi", color: "#00d1ff", icon: "wifi", tilt: "-rotate-2" },
  { label: "Hot Showers", color: "#ff2e62", icon: "droplets", tilt: "rotate-0" },
  { label: "Cafe", color: "#facc15", icon: "coffee", tilt: "rotate-2" },
  { label: "Laundry", color: "#39ff14", icon: "shirt", tilt: "-rotate-2" },
  { label: "AC", color: "#00d1ff", icon: "snowflake", tilt: "rotate-0" },
  { label: "Kitchen", color: "#ff2e62", icon: "utensils", tilt: "rotate-2" },
  { label: "Central Location", color: "#facc15", icon: "map-pin", tilt: "-rotate-2" },
  { label: "Lockers", color: "#39ff14", icon: "lock", tilt: "rotate-0" },
  { label: "Clean Rooms", color: "#00d1ff", icon: "sparkles", tilt: "rotate-2" },
  { label: "Safe & Secure", color: "#ff2e62", icon: "shield-check", tilt: "-rotate-2" },
  { label: "AC Dorms", color: "#39ff14", icon: "bed-double", tilt: "rotate-2" },
  { label: "24/7 Reception", color: "#facc15", icon: "clock-3", tilt: "rotate-0" },
  { label: "Secure Lockers", color: "#ff2e62", icon: "lock-keyhole", tilt: "-rotate-2" },
  { label: "7-Day Cancel", color: "#39ff14", icon: "calendar-check", tilt: "rotate-2" },
];

export const experienceCards = [
  {
    title: "High Energy",
    body:
      "Daily events, pub crawls, and game nights keep the energy alive. Meet travelers from around the world and create memories that last.",
    color: "#ff2e62",
  },
  {
    title: "Safety First",
    body:
      "24/7 security, CCTV coverage, secure lockers, and verified staff support your peace of mind at every hour.",
    color: "#39ff14",
    darkText: true,
  },
  {
    title: "Social Hub",
    body:
      "Rooftop hangouts, common kitchens, and shared spaces designed for meaningful connections and unexpected friendships.",
    color: "#00d1ff",
    darkText: true,
  },
  {
    title: "Prime Location",
    body:
      "Nestled in the heart of the city with walkable access to markets, cafes, restaurants, and the best cultural experiences.",
    color: "#facc15",
    darkText: true,
  },
];

export const guestEnergyImages = [
  "https://images.unsplash.com/photo-1681747971522-2d7a04c78321?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
  "https://images.unsplash.com/photo-1710144994421-a41e387e71c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
  "https://images.unsplash.com/photo-1766113491996-19167a988455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
  "https://images.unsplash.com/photo-1647649644192-af6183269fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
];

export const testimonials = [
  {
    name: "Aarav Sharma",
    country: "Mumbai, India",
    platform: "Booking.com",
    logo: "/testimonials logos/Booking_Logo.png",
    review:
      "Best hostel experience ever. The staff was warm, the room was spotless, and I met amazing people in one evening.",
  },
  {
    name: "Meera Nair",
    country: "Bengaluru, India",
    platform: "MakeMyTrip",
    logo: "/testimonials logos/MakeMyTrip_ideTNivz-j_1.png",
    review:
      "The events were incredible with great vibes, and the location made every city plan easy to execute.",
  },
  {
    name: "Rohan Kulkarni",
    country: "Pune, India",
    platform: "Agoda",
    logo: "/testimonials logos/Agoda.png",
    review:
      "I felt safe through the entire stay and the Wi-Fi handled remote work calls without a single drop.",
  },
];

export const platformRatings = [
  { platform: "Booking.com", logo: "/testimonials logos/Booking_Logo.png", rating: "8.9", detail: "2.1k reviews" },
  { platform: "MakeMyTrip", logo: "/testimonials logos/MakeMyTrip_ideTNivz-j_1.png", rating: "4.4", detail: "1.3k reviews" },
  { platform: "Agoda", logo: "/testimonials logos/Agoda.png", rating: "8.7", detail: "900+ reviews" },
  { platform: "Google", logo: "/testimonials logos/icons8-google-logo-96.png", rating: "4.6", detail: "3.4k reviews" },
  { platform: "Tripadvisor", rating: "4.5", detail: "780 reviews" },
  { platform: "Hostelworld", rating: "9.1", detail: "640 reviews" },
];

export const homePageContent = {
  heroTitle: ["Stay", "Mix", "Repeat"],
  trustTitle: "Stay With Confidence",
  trustSubtitle: "your safety is our priority",
  amenitiesTitle: "Amenities",
  amenitiesSubtitle: "Live better, stay better",
  amenitiesTagline: "Good vibes, hot showers, solid Wi-Fi, and zero nonsense.",
  roomsTitle: "Our Rooms",
  roomsSubtitle: "Choose your sanctuary",
  roomsTagline: "Pick your perch, drop your bag, and settle into the stay like you own the soundtrack.",
  upsellTitle: "Build Your Stay",
  upsellSubtitle: "Elevate your nights",
  eventsTitle: "Tonight at Vibe House",
  eventsSubtitle: "What's on the agenda",
  experienceTitle: "The Vibe House Experience",
  experienceSubtitle: "Why we're unforgettable",
  energyTitle: "The Energy",
  energySubtitle: "Snapshots of real moments",
  reviewsTitle: "Guest Stories",
  reviewsSubtitle: "Real stories from real travelers",
  reviewsTagline: "Receipts from travelers who clocked the vibe and stayed for another round.",
  ctaTitle: "Your Adventure Starts Here",
  ctaBody: "Join the community. Book your stay.",
  heroUrgencyChips: [
    "Starting at 599 tonight",
    "Only 07 beds left",
    "Book now for 12% off",
  ],
  ctaUrgencyChips: [
    "No booking fees",
    "Limited weekend inventory",
    "Flexible cancellation",
  ],
  homeRooms: rooms,
  homeEvents: upcomingEvents,
};

export const upsellBentoItems = [
  {
    id: "late-checkout",
    title: "Late Checkout Shield",
    body: "Hold your bunk safely until 4 PM with priority support during busy checkout weekends.",
    kicker: "Room Control",
    tone: "blue" as const,
  },
  {
    id: "laundry-drop",
    title: "Laundry Drop",
    body: "Book same-day wash-and-fold pickup and quick return to your room from reception.",
    kicker: "Utility",
    tone: "green" as const,
  },
  {
    id: "city-crawl",
    title: "City Crawl Pass",
    body: "Get skip-queue access to partner venues with a hosted route and curated nightlife stops.",
    kicker: "Social",
    tone: "pink" as const,
    colSpan: "col-span-2 md:col-span-2",
  },
  {
    id: "locker-plus",
    title: "Locker Plus",
    body: "Reserve oversized secure storage with front-desk priority when you need extra luggage room.",
    kicker: "Security",
    tone: "blue" as const,
  },
  {
    id: "breakfast",
    title: "Breakfast Combo",
    body: "Healthy breakfast pack with barista coffee and fresh fruit added to your folio each morning.",
    kicker: "Food",
    tone: "green" as const,
  },
  {
    id: "airport-hop",
    title: "Airport Hop",
    body: "Pre-book an airport transfer slot with pickup coordination from our front desk team.",
    kicker: "Transit",
    tone: "pink" as const,
  },
];

export const homeSectionOrder: HomeSectionId[] = [
  "amenities",
  "rooms",
  "upsell",
  "events",
  "experience",
  "energy",
  "reviews",
  "cta",
];
