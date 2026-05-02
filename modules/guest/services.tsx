"use client";

import { useState } from "react";
import { ConciergeBell } from "lucide-react";
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

export function GuestServices() {
  const { data, loading, error, reload } = useGuestCatalog(PROPERTY_ID);
  const { selectedBookingId } = useGuestExperience();
  const { isAuthenticated, openAuthModal } = useGuestAuth();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [lastTicketMessage, setLastTicketMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const onRequestService = async (productId: string) => {
    if (!selectedBookingId) {
      toast.error("No active booking found for service request.");
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

    setSubmittingId(productId);
    setLastTicketMessage(null);
    setActionError(null);
    try {
      const response = await requestService(selectedBookingId, { product_id: productId }, token);
      const message = `${response.service_name} requested. Ticket: ${response.ticket_id}`;
      setLastTicketMessage(message);
      toast.success(response.message);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to submit service request.";
      setActionError("Something went wrong while submitting request.");
      toast.error(message);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <SectionBlock
      description="Service requests are submitted from the shared services catalog."
      sticker={guestStickerTags.services}
      title="Services"
    >
      {loading ? <p className="text-sm text-white/70">Loading services...</p> : null}
      {error ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-rose-300">{error}</p>
          <Button className="h-8 rounded-[10px] px-3 text-xs" onClick={() => void reload()} type="button" variant="secondary">
            Retry
          </Button>
        </div>
      ) : null}
      {lastTicketMessage ? <p className="text-sm text-emerald-300">{lastTicketMessage}</p> : null}
      {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}
      {!loading && data.services.length === 0 ? <p className="text-sm text-white/70">No services available right now.</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {data.services.map((service) => (
          <BentoCard
            key={service.id}
            description="Submit directly and track via ticket response."
            icon={ConciergeBell}
            title={service.name}
          >
            <Button className="h-9 rounded-[12px]" disabled={submittingId === service.id} onClick={() => void onRequestService(service.id)} type="button">
              Request service
            </Button>
          </BentoCard>
        ))}
      </div>
    </SectionBlock>
  );
}
