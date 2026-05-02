"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageCheck, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";
import { StickySummary } from "@/components/guest/sticky-summary";
import { Button } from "@/components/ui/button";
import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { useGuestCatalog } from "@/hooks/use-guest-catalog";
import { getBorrowMine, requestBorrow, type BorrowMineItem } from "@/lib/guest-experience-api";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { useGuestExperience } from "@/state/guest-experience-provider";

const PROPERTY_ID = "60765";

export function GuestBorrow() {
  const { data, loading: catalogLoading, error: catalogError, reload } = useGuestCatalog(PROPERTY_ID);
  const { selectedBookingId, setBorrowCount, paymentSyncTick } = useGuestExperience();
  const { isAuthenticated, openAuthModal } = useGuestAuth();
  const [mine, setMine] = useState<BorrowMineItem[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [mineError, setMineError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [returnDraftIds, setReturnDraftIds] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const activeMineCount = useMemo(
    () => mine.filter((item) => item.status === "CHECKED_OUT" || item.status === "OVERDUE").length,
    [mine],
  );

  useEffect(() => {
    setBorrowCount(activeMineCount);
  }, [activeMineCount, setBorrowCount]);

  useEffect(() => {
    if (!selectedBookingId || !isAuthenticated) {
      setMine([]);
      return;
    }

    const token = getStoredGuestToken();
    if (!token) {
      setMine([]);
      return;
    }

    let cancelled = false;
    setLoadingMine(true);
    setMineError(null);

    void getBorrowMine(selectedBookingId, token)
      .then((rows) => {
        if (!cancelled) {
          setMine(Array.isArray(rows) ? rows : []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load borrowed items.";
          setMineError(message);
          setMine([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMine(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, paymentSyncTick, selectedBookingId]);

  const requireBookingAndToken = () => {
    if (!selectedBookingId) {
      toast.error("No active booking found for borrow flow.");
      return null;
    }
    if (!isAuthenticated) {
      openAuthModal("signin");
      return null;
    }
    const token = getStoredGuestToken();
    if (!token) {
      openAuthModal("signin");
      return null;
    }
    return { bookingId: selectedBookingId, token };
  };

  const onBorrowRequest = async (productId: string) => {
    const auth = requireBookingAndToken();
    if (!auth) {
      return;
    }

    setSubmittingId(productId);
    setActionError(null);
    try {
      await requestBorrow(auth.bookingId, { product_id: productId }, auth.token);
      const refreshed = await getBorrowMine(auth.bookingId, auth.token);
      setMine(Array.isArray(refreshed) ? refreshed : []);
      toast.success("Borrow request submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to request this item.";
      setActionError("Something went wrong while requesting this item.");
      toast.error(message);
    } finally {
      setSubmittingId(null);
    }
  };

  const onReturnUiAction = (borrowId: string) => {
    setReturnDraftIds((current) => ({ ...current, [borrowId]: true }));
    toast.message("Return noted. Staff verification is required.");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <SectionBlock
        description="Request borrowable items and track active checkouts. Return remains UI-only until a backend endpoint is available."
        sticker={guestStickerTags.borrow}
        title="Borrow"
      >
        {catalogLoading || loadingMine ? <p className="text-sm text-white/70">Loading borrowables...</p> : null}
        {catalogError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-rose-300">{catalogError}</p>
            <Button className="h-8 rounded-[10px] px-3 text-xs" onClick={() => void reload()} type="button" variant="secondary">
              Retry
            </Button>
          </div>
        ) : null}
        {mineError ? <p className="text-sm text-rose-300">{mineError}</p> : null}
        {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <BentoCard description="Live availability from borrowables catalog." icon={PackagePlus} title="Borrow items">
            <div className="space-y-2">
              {data.borrowables.length === 0 ? <p className="text-sm text-white/70">No borrowables available.</p> : null}
              {data.borrowables.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-white/60">Available {item.available} / {item.total}</p>
                  </div>
                  <Button
                    className="h-8 rounded-[10px] px-3 text-xs"
                    disabled={item.available <= 0 || submittingId === item.id}
                    onClick={() => void onBorrowRequest(item.id)}
                    type="button"
                  >
                    Request
                  </Button>
                </div>
              ))}
            </div>
          </BentoCard>
          <BentoCard description="Active borrowed items and return-request marker." icon={PackageCheck} title="Return flow">
            <div className="space-y-2">
              {mine.length === 0 ? <p className="text-sm text-white/70">No borrowed items yet.</p> : null}
              {mine.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.product_name}</p>
                    <p className="text-xs text-white/60">{item.status}</p>
                  </div>
                  <Button
                    className="h-8 rounded-[10px] px-3 text-xs"
                    disabled={item.status !== "CHECKED_OUT" && item.status !== "OVERDUE"}
                    onClick={() => onReturnUiAction(item.id)}
                    type="button"
                    variant="secondary"
                  >
                    {returnDraftIds[item.id] ? "Requested" : "Return"}
                  </Button>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      </SectionBlock>
      <StickySummary
        title="Borrow summary"
        items={[
          { label: "Active", value: `${activeMineCount} items` },
          { label: "Returned", value: `${mine.filter((item) => item.status === "RETURNED").length}` },
          { label: "Requests", value: "UI + API mixed" },
        ]}
      />
    </div>
  );
}
