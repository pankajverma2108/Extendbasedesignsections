export type GuestStickerTagConfig = {
  label: string;
  bg: string;
  text: string;
  rotate: string;
};

export const guestStickerTags = {
  shell: { label: "Guest mode", bg: "#f9cb37", text: "#111111", rotate: "rotate-[-2deg]" },
  dashboard: { label: "Stay HQ", bg: "#f9cb37", text: "#111111", rotate: "rotate-[-2deg]" },
  services: { label: "Need a hand", bg: "#00d1ff", text: "#071014", rotate: "rotate-[2deg]" },
  addons: { label: "Add-ons", bg: "#39ff14", text: "#071014", rotate: "rotate-[-1deg]" },
  borrow: { label: "Borrow desk", bg: "#f9cb37", text: "#111111", rotate: "rotate-[1deg]" },
  extend: { label: "More time", bg: "#c92420", text: "#ffffff", rotate: "rotate-[-2deg]" },
  guide: { label: "Property guide", bg: "#00d1ff", text: "#071014", rotate: "rotate-[2deg]" },
  lostFound: { label: "Lost & Found", bg: "#f9cb37", text: "#111111", rotate: "rotate-[-1deg]" },
  checkout: { label: "Checkout desk", bg: "#c92420", text: "#ffffff", rotate: "rotate-[1deg]" },
  review: { label: "Leave a note", bg: "#39ff14", text: "#071014", rotate: "rotate-[-2deg]" },
  notice: { label: "Today at the property", bg: "#f9cb37", text: "#111111", rotate: "rotate-[1deg]" },
} satisfies Record<string, GuestStickerTagConfig>;
