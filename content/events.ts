import type { EventCardProps } from "@/content/types";

export const upcomingEvents: EventCardProps[] = [
  {
    title: "Neon DJ Night",
    date: "Mar 18, 2026",
    time: "9:00 PM",
    location: "Rooftop Terrace",
    price: "Free for Guests",
    image:
      "https://images.unsplash.com/photo-1758179764880-7513421d202a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    capacity: "50 guests",
    href: "/events",
    badge: { label: "Tonight", color: "#ff2e62" },
  },
  {
    title: "Old City Pub Crawl",
    date: "Mar 19, 2026",
    time: "8:30 PM",
    location: "Meet at Lobby",
    price: "Rs. 599",
    image:
      "https://images.unsplash.com/photo-1763651961183-19eb504dee15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    capacity: "30 guests",
    href: "/events",
    badge: { label: "Popular", color: "#facc15" },
  },
  {
    title: "Live Local Music",
    date: "Mar 20, 2026",
    time: "7:00 PM",
    location: "Common Area",
    price: "Free for Guests",
    image:
      "https://images.unsplash.com/photo-1647649644192-af6183269fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    capacity: "40 guests",
    href: "/events",
    badge: { label: "Live", color: "#00d1ff" },
  },
];

export const weeklyLineup = [
  { day: "Monday", event: "Movie Night", time: "8:00 PM", color: "#ff2e62" },
  { day: "Tuesday", event: "Beer Pong Tournament", time: "9:00 PM", color: "#facc15" },
  { day: "Wednesday", event: "Game Night", time: "7:30 PM", color: "#39ff14" },
  { day: "Thursday", event: "Pub Crawl", time: "8:30 PM", color: "#00d1ff" },
  { day: "Friday", event: "DJ Night", time: "9:00 PM", color: "#ff2e62" },
  { day: "Saturday", event: "Open Mic", time: "8:00 PM", color: "#39ff14" },
  { day: "Sunday", event: "Chill Sunday", time: "6:00 PM", color: "#facc15" },
];

export const pastEventImages = [
  "https://images.unsplash.com/photo-1681747971522-2d7a04c78321?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  "https://images.unsplash.com/photo-1710144994421-a41e387e71c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  "https://images.unsplash.com/photo-1766113491996-19167a988455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  "https://images.unsplash.com/photo-1647649644192-af6183269fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  "https://images.unsplash.com/photo-1622646771382-1c9c090d3c37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  "https://images.unsplash.com/photo-1641352848574-9dbb6a244a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
];
