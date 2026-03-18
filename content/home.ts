import { rooms } from "@/content/rooms";
import { upcomingEvents } from "@/content/events";

export type HomeSectionId =
  | "trust"
  | "amenities"
  | "rooms"
  | "events"
  | "experience"
  | "energy"
  | "reviews"
  | "cta";

export const heroImages = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920",
  "https://images.unsplash.com/photo-1694151569569-8288e3118519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920",
  "https://images.unsplash.com/photo-1641352848574-9dbb6a244a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920",
  "https://images.unsplash.com/photo-1647649644192-af6183269fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920",
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
  { label: "Fast Wi-Fi", color: "#00d1ff" },
  { label: "Hot Showers", color: "#ff2e62" },
  { label: "Co-working", color: "#facc15" },
  { label: "Laundry", color: "#39ff14" },
  { label: "AC", color: "#00d1ff" },
  { label: "Kitchen", color: "#ff2e62" },
  { label: "Central Location", color: "#facc15" },
  { label: "Lockers", color: "#39ff14" },
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
];

export const guestEnergyImages = [
  "https://images.unsplash.com/photo-1681747971522-2d7a04c78321?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
  "https://images.unsplash.com/photo-1710144994421-a41e387e71c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
  "https://images.unsplash.com/photo-1766113491996-19167a988455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
  "https://images.unsplash.com/photo-1647649644192-af6183269fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
];

export const testimonials = [
  {
    name: "Sarah M.",
    country: "Australia",
    review:
      "Best hostel experience ever. The staff was amazing and I met so many cool people. The cleanliness is top-notch.",
  },
  {
    name: "Marco R.",
    country: "Italy",
    review:
      "The events were incredible. Great vibes, great people, and a location that makes everything easy.",
  },
  {
    name: "Yuki T.",
    country: "Japan",
    review:
      "I felt safe the entire stay. The female dorms are perfect and the Wi-Fi is excellent for remote work.",
  },
];

export const homePageContent = {
  heroTitle: ["Stay", "Mix", "Repeat"],
  trustTitle: "Stay With Confidence",
  trustSubtitle: "your safety is our priority",
  amenitiesTitle: "Amenities",
  amenitiesSubtitle: "everything you need",
  roomsTitle: "Our Rooms",
  roomsSubtitle: "find your corner",
  eventsTitle: "Tonight at Vibe House",
  eventsSubtitle: "next 48 hours",
  experienceTitle: "The Vibe House Experience",
  experienceSubtitle: "why travelers choose us",
  energyTitle: "The Energy",
  energySubtitle: "see what is happening",
  reviewsTitle: "Guest Stories",
  reviewsSubtitle: "what travelers say",
  ctaTitle: "Your Adventure Starts Here",
  ctaBody: "Join the community. Book your stay.",
  homeRooms: rooms,
  homeEvents: upcomingEvents,
};

export const homeSectionOrder: HomeSectionId[] = [
  "trust",
  "amenities",
  "rooms",
  "events",
  "experience",
  "energy",
  "reviews",
  "cta",
];
