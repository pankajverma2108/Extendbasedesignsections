"use client";

import { useMemo, useState } from "react";
import { Search, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";

import { BentoCard } from "@/components/guest/bento-card";
import { guestStickerTags } from "@/components/guest/guest-sticker-tags";
import { SectionBlock } from "@/components/guest/section-block";
import { Button } from "@/components/ui/button";
import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { useGuestCatalog } from "@/hooks/use-guest-catalog";
import { requestService } from "@/lib/guest-experience-api";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { useGuestExperience } from "@/state/guest-experience-provider";

const PROPERTY_ID = "60765";

export function GuestLostFound() {
  const { data, loading, error, reload } = useGuestCatalog(PROPERTY_ID);
  const { selectedBookingId } = useGuestExperience();
  const { isAuthenticated, openAuthModal } = useGuestAuth();
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const lostFoundService = useMemo(
    () => {
      const byCode = data.services.find((service) => service.code === "LOST_FOUND");
      if (byCode) {
        return byCode;
      }

      return data.services.find((service) => service.name.toLowerCase().includes("lost") || service.id.toLowerCase().includes("lost")) ?? null;
    },
    [data.services],
  );

  const onSubmit = async () => {
    if (!lostFoundService) {
      toast.message("Lost & Found service is not available in catalog.");
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

    setSubmitting(true);
    setResultMessage(null);
    setActionError(null);
    try {
      const response = await requestService(selectedBookingId, { product_id: lostFoundService.id }, token);
      const nextMessage = `${response.service_name} submitted. Ticket: ${response.ticket_id}`;
      setResultMessage(nextMessage);
      toast.success(response.message);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to submit Lost & Found request.";
      setActionError("Something went wrong while submitting request.");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionBlock
      description="Lost & Found is submitted through the shared service-request API."
      sticker={guestStickerTags.lostFound}
      title="Lost & Found"
    >
      {loading ? <p className="text-sm text-white/70">Loading service catalog...</p> : null}
      {error ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-rose-300">{error}</p>
          <Button className="h-8 rounded-[10px] px-3 text-xs" onClick={() => void reload()} type="button" variant="secondary">
            Retry
          </Button>
        </div>
      ) : null}
      {resultMessage ? <p className="text-sm text-emerald-300">{resultMessage}</p> : null}
      {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}
      {!loading && !lostFoundService ? <p className="text-sm text-white/70">Lost & Found service is not configured.</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <BentoCard description="Submit a Lost & Found ticket for this booking." icon={Search} title="Report lost item">
          <Button className="h-9 rounded-[12px]" disabled={submitting || !lostFoundService} onClick={() => void onSubmit()} type="button">
            Submit request
          </Button>
        </BentoCard>
        <BentoCard description="Track ticket updates from the backend response." icon={ShieldQuestion} title="Found item status">
          <p className="text-sm text-white/70">{resultMessage ?? "Submit a request to receive ticket details."}</p>
        </BentoCard>
      </div>
    </SectionBlock>
  );
}
