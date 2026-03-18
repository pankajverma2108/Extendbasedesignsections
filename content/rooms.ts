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
