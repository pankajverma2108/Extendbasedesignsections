import type { RoomCardProps } from "@/content/types";

export const rooms: RoomCardProps[] = [
  {
    title: "4-Bed Mixed Dorm",
    price: "Rs. 599",
    occupancy: "4 Guests",
    image:
      "https://images.unsplash.com/photo-1694151569569-8288e3118519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    badge: { label: "Most Popular", color: "#ff2e62" },
    features: [
      "Reading lights",
      "Privacy curtains",
      "USB charging ports",
      "Individual lockers",
    ],
    href: "/rooms",
  },
  {
    title: "4-Bed Female Dorm",
    price: "Rs. 599",
    occupancy: "4 Guests",
    image:
      "https://images.unsplash.com/photo-1626265774643-f1943311a86b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    badge: { label: "Safe Space", color: "#39ff14", textColor: "#0f172a" },
    features: [
      "Women-only space",
      "En-suite bathroom",
      "Reading lights",
      "Privacy curtains",
    ],
    href: "/rooms",
  },
  {
    title: "Private Room",
    price: "Rs. 1,299",
    occupancy: "2 Guests",
    image:
      "https://images.unsplash.com/photo-1721522281545-fad32dd5107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    badge: { label: "Privacy", color: "#00d1ff", textColor: "#0f172a" },
    features: [
      "Queen-size bed",
      "En-suite bathroom",
      "Work desk",
      "Mini-fridge",
    ],
    href: "/rooms",
  },
];

export const propertyGallery = [
  {
    src: "https://images.unsplash.com/photo-1694151569569-8288e3118519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600",
    alt: "Vibe House dorm interior",
  },
  {
    src: "https://images.unsplash.com/photo-1681747971522-2d7a04c78321?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600",
    alt: "Guests in social common area",
  },
  {
    src: "https://images.unsplash.com/photo-1641352848574-9dbb6a244a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600",
    alt: "Rooftop lounge with city view",
  },
  {
    src: "https://images.unsplash.com/photo-1721522281545-fad32dd5107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600",
    alt: "Private room at Vibe House",
  },
];

export const propertyOverview = [
  "Vibe House is a social co-living hostel for modern travelers who want connection, safety, and comfort in one place.",
  "Our properties combine clean hotel-grade standards with a high-energy social culture, designed so solo travelers can arrive alone and still feel at home.",
  "You get curated evenings, mixed-gender community spaces, clear house rules, and privacy-focused dorm design without losing the fun hostel vibe.",
];

export const propertyAmenities = [
  { icon: "wifi", label: "Fast Wi-Fi" },
  { icon: "snowflake", label: "AC Rooms" },
  { icon: "shield", label: "Secure Lockers" },
  { icon: "bed", label: "Fresh Linen" },
  { icon: "sparkles", label: "Daily Housekeeping" },
  { icon: "utensils", label: "Cafe & Kitchen" },
  { icon: "music", label: "Social Evenings" },
  { icon: "briefcase", label: "Work Nooks" },
  { icon: "camera", label: "CCTV Common Areas" },
  { icon: "clock", label: "24/7 Reception" },
  { icon: "map-pin", label: "Central Location" },
  { icon: "users", label: "Community Events" },
];

export const socialSpaces = [
  {
    title: "Lounge Arena",
    blurb: "Games, playlists, and easy introductions every evening.",
    image:
      "https://images.unsplash.com/photo-1710144994421-a41e387e71c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
  },
  {
    title: "Rooftop Sessions",
    blurb: "Open-air hangouts, city views, and weekend mixers.",
    image:
      "https://images.unsplash.com/photo-1647649644192-af6183269fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
  },
  {
    title: "Cafe Corner",
    blurb: "Coffee, quick bites, and remote-work-friendly seating.",
    image:
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
  },
];

export const nearbyAttractions = [
  { name: "Marine Drive", travel: "14 min drive", type: "Sunset Spot" },
  { name: "Colaba Causeway", travel: "18 min drive", type: "Shopping" },
  { name: "Gateway of India", travel: "20 min drive", type: "Landmark" },
  { name: "Kala Ghoda District", travel: "16 min drive", type: "Art & Cafes" },
  { name: "Bandra Fort", travel: "24 min drive", type: "Viewpoint" },
  { name: "Airport Metro Link", travel: "12 min drive", type: "Transit" },
];

export const locationMap = {
  title: "Vibe House Mumbai Central",
  address: "123 Backpacker Street, Mumbai 400001",
  embedUrl:
    "https://www.google.com/maps?q=Mumbai+Central&output=embed",
};

export const roomCategories = [
  {
    slug: "mixed-4-bed",
    title: "Bed in 4-Bed Mixed Dorm",
    shortTitle: "4-Bed Mixed Dorm",
    image:
      "https://images.unsplash.com/photo-1694151569569-8288e3118519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    guestText: "x 1 Guest",
    basePrice: 599,
    inventoryText: "07 beds available",
    features: ["Privacy curtain", "Reading light", "USB charging", "Personal locker"],
    amenitiesLegend: ["AC", "Locker", "Fresh linen", "Housekeeping"],
  },
  {
    slug: "female-4-bed",
    title: "Bed in 4-Bed Female Dorm",
    shortTitle: "4-Bed Female Dorm",
    image:
      "https://images.unsplash.com/photo-1626265774643-f1943311a86b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    guestText: "x 1 Guest",
    basePrice: 599,
    inventoryText: "05 beds available",
    features: ["Women-only floor", "En-suite access", "Reading light", "Secure locker"],
    amenitiesLegend: ["AC", "Locker", "Fresh linen", "Housekeeping"],
  },
  {
    slug: "private-room",
    title: "Private Room",
    shortTitle: "Private Room",
    image:
      "https://images.unsplash.com/photo-1721522281545-fad32dd5107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    guestText: "x 2 Guests",
    basePrice: 1299,
    inventoryText: "03 rooms left",
    features: ["Queen bed", "En-suite bathroom", "Work desk", "Mini-fridge"],
    amenitiesLegend: ["AC", "Private bath", "Fresh linen", "Housekeeping"],
  },
];

export const roomListingLegend = [
  "AC",
  "Locker",
  "Fresh linen",
  "Daily housekeeping",
  "CCTV in common areas",
  "24/7 support",
];

export const importantInfo = [
  "Check-in: 2:00 PM onwards | Check-out: 11:00 AM",
  "Valid government photo ID is mandatory for all guests",
  "Outside alcohol and illegal substances are not allowed",
  "Bed-level selection is not available on PLP; final allocation is handled after category selection",
  "For group stays, contact support before booking to align inventory",
];

export const includedAssurances = [
  { label: "Free Fast Wi-Fi", color: "#00d1ff" },
  { label: "AC in All Rooms", color: "#39ff14" },
  { label: "Secure Lockers", color: "#ff2e62" },
  { label: "Fresh Linen Daily", color: "#facc15" },
];

export const roomFaqs = [
  {
    question: "What time is check-in?",
    answer:
      "Check-in is from 2:00 PM onwards. Early check-in may be available upon request subject to availability.",
  },
  {
    question: "Do I need to bring a padlock?",
    answer:
      "No. We provide secure lockers with built-in locks, and reception can help with any extras you need.",
  },
  {
    question: "Are towels and linens provided?",
    answer:
      "Yes. Fresh linen and towels are provided for all guests, with daily housekeeping support.",
  },
  {
    question: "Is breakfast included?",
    answer:
      "Breakfast is not included in the room rate, but the cafe offers affordable breakfast options on site.",
  },
];

export const houseRules = [
  "Quiet hours are 11 PM to 7 AM in dorms.",
  "Locker usage is required for valuables.",
  "Respect the vibe with a zero-tolerance anti-harassment policy.",
  "Outside guests are not permitted in dorms without staff approval.",
  "Keep common areas tidy for everyone.",
];
