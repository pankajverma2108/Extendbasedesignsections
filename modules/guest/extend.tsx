"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarPlus, Moon } from "lucide-react";
import { toast } from "sonner";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";
import { Button } from "@/components/ui/button";
import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { useGuestCatalog } from "@/hooks/use-guest-catalog";
import { addToCart, getCart, type GuestCart, type GuestCatalogItem } from "@/lib/guest-experience-api";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { useGuestExperience } from "@/state/guest-experience-provider";

const PROPERTY_ID = "60765";
const DEFAULT_UNIT_CODE = "AUTO-UNIT";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function findServiceByKeyword(services: GuestCatalogItem[], keyword: string): GuestCatalogItem | null {
  const normalized = keyword.trim().toLowerCase();
  return services.find((item) => item.name.toLowerCase().includes(normalized) || item.id.toLowerCase().includes(normalized)) ?? null;
}

function isRelevantExtendService(item: GuestCatalogItem): boolean {
  if (item.category !== "SERVICE" || item.base_price <= 0) {
    return false;
  }

  const normalized = `${item.name} ${item.id}`.toLowerCase();
  return normalized.includes("late checkout")
    || normalized.includes("late-checkout")
    || normalized.includes("early check-in")
    || normalized.includes("early checkin")
    || normalized.includes("early-checkin")
    || normalized.includes("extend stay")
    || normalized.includes("stay extension")
    || normalized.includes("extension");
}

export function GuestExtend() {
  const { data, loading, error, reload } = useGuestCatalog(PROPERTY_ID);
  const { selectedBookingId, setCartCount } = useGuestExperience();
  const { isAuthenticated, openAuthModal } = useGuestAuth();
  const [cart, setCart] = useState<GuestCart | null>(null);
  const [mutatingKey, setMutatingKey] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const paidServices = useMemo(() => data.addons.filter(isRelevantExtendService), [data.addons]);
  const extendService = useMemo(() => findServiceByKeyword(paidServices, "extend"), [paidServices]);
  const lateCheckoutService = useMemo(() => findServiceByKeyword(paidServices, "late"), [paidServices]);
  const earlyCheckinService = useMemo(() => findServiceByKeyword(paidServices, "early"), [paidServices]);

  useEffect(() => {
    if (!selectedBookingId || !isAuthenticated) {
      setCart(null);
      return;
    }

    const token = getStoredGuestToken();
    if (!token) {
      setCart(null);
      return;
    }

    let cancelled = false;
    void getCart(selectedBookingId, token)
      .then((nextCart) => {
        if (!cancelled) {
          setCart(nextCart);
          setCartCount((nextCart.items ?? []).length);
          setCartError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load cart.";
          setCartError(message);
          const fallback = { order_id: null, items: [], total: 0 };
          setCart(fallback);
          setCartCount(fallback.items.length);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, selectedBookingId]);

  useEffect(() => {
    setCartCount((cart?.items ?? []).length);
  }, [cart?.items, setCartCount]);

  const onAddService = async (service: GuestCatalogItem | null, key: string) => {
    if (!service) {
      toast.message("No mapped paid service found for this action.");
      return;
    }
    if (!selectedBookingId) {
      toast.error("No active booking found.");
      return;
    }
    if (!isAuthenticated) {
      openAuthModal("signin");
      return;
    }

    const token = getStoredGuestToken();
    if (!token) {
      openAuthModal("signin");
      return;
    }

    setMutatingKey(key);
    setActionError(null);
    try {
      const nextCart = await addToCart(
        selectedBookingId,
        { product_id: service.id, quantity: 1, unit_code: DEFAULT_UNIT_CODE },
        token,
      );
      setCart(nextCart);
      setCartCount((nextCart.items ?? []).length);
      toast.success(`${service.name} added to cart.`);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to add this service.";
      setActionError("Something went wrong while adding service.");
      toast.error(message);
    } finally {
      setMutatingKey(null);
    }
  };

  return (
    <SectionBlock
      description="Stay extension options are treated as paid services and added to the same booking cart."
      sticker={guestStickerTags.extend}
      title="Extend stay"
    >
      {loading ? <p className="text-sm text-white/70">Loading extension services...</p> : null}
      {error ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-rose-300">{error}</p>
          <Button className="h-8 rounded-[10px] px-3 text-xs" onClick={() => void reload()} type="button" variant="secondary">
            Retry
          </Button>
        </div>
      ) : null}
      {cartError ? <p className="text-sm text-rose-300">{cartError}</p> : null}
      {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}
      {!loading && paidServices.length === 0 ? <p className="text-sm text-white/70">No paid extension services found in catalog.</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <BentoCard
          description={extendService ? `From ${formatCurrency(extendService.base_price)}` : "Mapped from paid SERVICE items in catalog."}
          icon={CalendarPlus}
          title="Extend stay"
        >
          <Button className="h-9 rounded-[12px]" disabled={mutatingKey === "extend"} onClick={() => void onAddService(extendService, "extend")} type="button">
            Add to cart
          </Button>
        </BentoCard>
        <BentoCard
          description={lateCheckoutService ? `From ${formatCurrency(lateCheckoutService.base_price)}` : "Mapped from paid SERVICE items in catalog."}
          icon={Moon}
          title="Late checkout"
        >
          <Button className="h-9 rounded-[12px]" disabled={mutatingKey === "late"} onClick={() => void onAddService(lateCheckoutService, "late")} type="button">
            Add to cart
          </Button>
        </BentoCard>
        <BentoCard
          description={earlyCheckinService ? `From ${formatCurrency(earlyCheckinService.base_price)}` : "Mapped from paid SERVICE items in catalog."}
          icon={CalendarClock}
          title="Early check-in"
        >
          <Button className="h-9 rounded-[12px]" disabled={mutatingKey === "early"} onClick={() => void onAddService(earlyCheckinService, "early")} type="button">
            Add to cart
          </Button>
        </BentoCard>
      </div>
    </SectionBlock>
  );
}
