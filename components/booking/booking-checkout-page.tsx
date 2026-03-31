"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { useGuestAuth } from "@/components/auth/guest-auth-provider";
import { Button } from "@/components/ui/button";
import {
  createBookingPaymentOrder,
  createGuestBookingOrder,
  failBookingPayment,
  getStoreCatalog,
  type StoreCatalogItem,
  verifyBookingPayment,
} from "@/lib/booking-api";
import {
  buildBookingSignature,
  clearBookingDraft,
  clearPendingBookingOrder,
  type BookingDraft,
  getStoredBookingState,
  saveBookingDraft,
  saveConfirmedBookingSnapshot,
  savePendingBookingOrder,
} from "@/lib/booking-session";
import { getStoredGuestToken } from "@/lib/guest-auth-api";
import { cn } from "@/lib/utils";

import {
  BookingEmptyState,
  BookingPageShell,
  BookingSummaryCard,
  formatCurrency,
  getNightCount,
} from "./booking-shell";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function isPurchasableCatalogItem(
  item: StoreCatalogItem,
): item is StoreCatalogItem & { category: "COMMODITY" | "SERVICE" } {
  return item.category === "COMMODITY" || item.category === "SERVICE";
}

function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_URL}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function createDraftWithAddons(
  draft: BookingDraft,
  catalogItems: StoreCatalogItem[],
  quantities: Record<string, number>,
): BookingDraft {
  const selectedAddons: BookingDraft["addons"] = catalogItems
    .filter(isPurchasableCatalogItem)
    .map((item) => ({
      productId: item.id,
      name: item.name,
      category: item.category,
      quantity: Math.max(0, quantities[item.id] ?? 0),
      unitPrice: item.base_price,
      inStock: item.in_stock,
    }))
    .filter((item) => item.quantity > 0);

  return {
    ...draft,
    addons: selectedAddons,
    signature: buildBookingSignature({
      propertyId: draft.propertyId,
      checkinDate: draft.checkinDate,
      checkoutDate: draft.checkoutDate,
      rooms: draft.rooms.map((room) => ({ roomTypeId: room.roomTypeId, quantity: room.quantity })),
      addons: selectedAddons.map((addon) => ({ productId: addon.productId, quantity: addon.quantity })),
    }),
  };
}

export function BookingCheckoutPage() {
  const router = useRouter();
  const { guest, isAuthenticated, openAuthModal } = useGuestAuth();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [catalogItems, setCatalogItems] = useState<StoreCatalogItem[]>([]);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resumeAfterAuth, setResumeAfterAuth] = useState(false);
  const paymentHandledRef = useRef(false);

  useEffect(() => {
    const stored = getStoredBookingState();
    if (!stored?.draft) {
      return;
    }

    setDraft(stored.draft);
    setAddonQuantities(
      Object.fromEntries(stored.draft.addons.map((addon) => [addon.productId, addon.quantity])),
    );
  }, []);

  useEffect(() => {
    const propertyId = draft?.propertyId;
    if (!propertyId) {
      setIsLoadingCatalog(false);
      return;
    }

    let cancelled = false;

    async function loadCatalog() {
      if (!propertyId) {
        setIsLoadingCatalog(false);
        return;
      }

      setIsLoadingCatalog(true);

      try {
        const catalog = await getStoreCatalog(propertyId);
        if (cancelled) {
          return;
        }

        const filtered = catalog.filter(isPurchasableCatalogItem);
        setCatalogItems(filtered);

        setAddonQuantities((current) => {
          const next = { ...current };
          for (const item of filtered) {
            if (typeof next[item.id] !== "number") {
              next[item.id] = 0;
            }
          }
          return next;
        });
      } catch {
        if (!cancelled) {
          setCatalogItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCatalog(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [draft?.propertyId]);

  const updateAddonQuantity = useCallback(
    (itemId: string, nextQuantity: number) => {
      const clampedQuantity = Math.max(0, nextQuantity);

      setAddonQuantities((current) => ({
        ...current,
        [itemId]: clampedQuantity,
      }));

      setDraft((currentDraft) => {
        if (!currentDraft || catalogItems.length === 0) {
          return currentDraft;
        }

        const nextQuantities = {
          ...addonQuantities,
          [itemId]: clampedQuantity,
        };
        const nextDraft = createDraftWithAddons(currentDraft, catalogItems, nextQuantities);
        saveBookingDraft(nextDraft);
        return nextDraft;
      });
    },
    [addonQuantities, catalogItems],
  );

  const nights = useMemo(
    () => getNightCount(draft?.checkinDate, draft?.checkoutDate),
    [draft?.checkinDate, draft?.checkoutDate],
  );

  const roomSubtotal = useMemo(
    () =>
      (draft?.rooms ?? []).reduce((sum, room) => sum + room.basePrice * room.quantity * nights, 0),
    [draft?.rooms, nights],
  );

  const addonsSubtotal = useMemo(
    () =>
      (draft?.addons ?? []).reduce((sum, addon) => sum + addon.unitPrice * addon.quantity, 0),
    [draft?.addons],
  );

  const estimatedGrandTotal = roomSubtotal + addonsSubtotal;

  const handlePayment = useCallback(async () => {
    if (!draft) {
      return;
    }

    const token = getStoredGuestToken();
    if (!token || !isAuthenticated) {
      setResumeAfterAuth(true);
      openAuthModal("signin");
      return;
    }

    setIsPaying(true);
    setErrorMessage(null);

    try {
      const activeRooms = draft.rooms.filter((room) => room.quantity > 0);
      const activeAddons = draft.addons.filter((addon) => addon.quantity > 0);
      const storedState = getStoredBookingState();
      const pendingSnapshot = storedState?.pendingOrder?.signature === draft.signature
        ? storedState.pendingOrder
        : null;

      const orderSummary = pendingSnapshot
        ? {
            ezee_reservation_id: pendingSnapshot.order.ezeeReservationId,
            property_id: pendingSnapshot.order.propertyId,
            property_name: pendingSnapshot.order.propertyName,
            checkin_date: pendingSnapshot.order.checkinDate,
            checkout_date: pendingSnapshot.order.checkoutDate,
            total_guests: pendingSnapshot.order.totalGuests,
            no_of_nights: pendingSnapshot.order.noOfNights,
            rooms: [],
            addons: [],
            subtotal_rooms: pendingSnapshot.order.subtotalRooms,
            subtotal_addons: pendingSnapshot.order.subtotalAddons,
            grand_total: pendingSnapshot.order.grandTotal,
            addon_order_id: pendingSnapshot.order.addonOrderId,
            status: pendingSnapshot.order.status,
          }
        : await createGuestBookingOrder(token, {
            property_id: draft.propertyId,
            checkin_date: draft.checkinDate,
            checkout_date: draft.checkoutDate,
            rooms: activeRooms.map((room) => ({
              room_type_id: room.roomTypeId,
              quantity: room.quantity,
            })),
            addons: activeAddons.map((addon) => ({
              product_id: addon.productId,
              quantity: addon.quantity,
            })),
          });

      savePendingBookingOrder({
        signature: draft.signature,
        order: {
          ezeeReservationId: orderSummary.ezee_reservation_id,
          propertyId: orderSummary.property_id,
          propertyName: orderSummary.property_name,
          checkinDate: orderSummary.checkin_date,
          checkoutDate: orderSummary.checkout_date,
          totalGuests: orderSummary.total_guests,
          noOfNights: orderSummary.no_of_nights,
          subtotalRooms: orderSummary.subtotal_rooms,
          subtotalAddons: orderSummary.subtotal_addons,
          grandTotal: orderSummary.grand_total,
          addonOrderId: orderSummary.addon_order_id ?? null,
          status: orderSummary.status,
        },
      });

      const paymentOrder = await createBookingPaymentOrder(token, {
        ezee_reservation_id: orderSummary.ezee_reservation_id,
        grand_total: orderSummary.grand_total,
        ...(orderSummary.addon_order_id ? { addon_order_id: orderSummary.addon_order_id } : {}),
      });

      await loadRazorpayCheckout();
      if (!window.Razorpay) {
        throw new Error("Razorpay checkout did not initialise correctly.");
      }
      const Razorpay = window.Razorpay;

      paymentHandledRef.current = false;

      await new Promise<void>((resolve, reject) => {
        const markFailed = async (message: string) => {
          if (paymentHandledRef.current) {
            return;
          }

          paymentHandledRef.current = true;

          try {
            await failBookingPayment(token, paymentOrder.razorpay_order_id);
          } catch {
            // The backend owns rollback; if this call fails we still surface the primary error.
          }

          clearPendingBookingOrder();
          reject(new Error(message));
        };

        const razorpay = new Razorpay({
          key: paymentOrder.razorpay_key,
          amount: paymentOrder.amount_paise,
          currency: paymentOrder.currency,
          order_id: paymentOrder.razorpay_order_id,
          name: "Vibe House",
          description: `${orderSummary.property_name} booking`,
          prefill: {
            name: guest?.name ?? "",
            email: paymentOrder.guest?.email ?? guest?.email ?? "",
            contact: guest?.phone ?? "",
          },
          theme: {
            color: "#ff2e62",
          },
          notes: {
            ezee_reservation_id: orderSummary.ezee_reservation_id,
            property_id: orderSummary.property_id,
          },
          modal: {
            ondismiss: () => {
              void markFailed("Payment was cancelled before confirmation.");
            },
          },
          handler: async (response: RazorpaySuccessResponse) => {
            if (paymentHandledRef.current) {
              return;
            }

            paymentHandledRef.current = true;

            try {
              const verification = await verifyBookingPayment(token, response);
              clearPendingBookingOrder();
              clearBookingDraft();
              saveConfirmedBookingSnapshot({
                ezeeReservationId: orderSummary.ezee_reservation_id,
                propertyId: orderSummary.property_id,
                propertyName: orderSummary.property_name,
                roomTypeName: draft.rooms.map((room) => room.title).join(", "),
                roomSummary: draft.rooms
                  .filter((room) => room.quantity > 0)
                  .map((room) => `${room.title} x${room.quantity}`)
                  .join(", "),
                checkinDate: orderSummary.checkin_date,
                checkoutDate: orderSummary.checkout_date,
                amountPaid: verification.total,
                paymentId: verification.payment_id,
                createdAt: Date.now(),
              });
              router.push(`/bookings/${encodeURIComponent(orderSummary.ezee_reservation_id)}?fresh=1`);
              resolve();
            } catch (error) {
              clearPendingBookingOrder();
              reject(error instanceof Error ? error : new Error("Payment verification failed."));
            }
          },
        });

        razorpay.on("payment.failed", () => {
          void markFailed("Razorpay reported a payment failure. Please try again.");
        });

        razorpay.open();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start the payment flow.");
    } finally {
      setIsPaying(false);
    }
  }, [draft, guest, isAuthenticated, openAuthModal, router]);

  useEffect(() => {
    if (!resumeAfterAuth || !isAuthenticated) {
      return;
    }

    setResumeAfterAuth(false);
    void handlePayment();
  }, [handlePayment, isAuthenticated, resumeAfterAuth]);

  if (!draft) {
    return (
      <BookingPageShell
        badge="Booking Checkout"
        title="Your room selection is empty"
        description="Pick your dates and rooms on the property page first, then come back here to review and pay."
      >
        <BookingEmptyState
          title="No active booking draft"
          description="This checkout page works from the room selection you build on the property page. Once you choose rooms, the live booking summary will appear here."
        />
      </BookingPageShell>
    );
  }

  return (
    <BookingPageShell
      badge="Booking Checkout"
      title="Review your stay and pay via Razorpay"
      description="This flow validates live availability, creates the pending booking in the backend, and opens the Razorpay test checkout only after the cart passes server-side checks."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <BookingSummaryCard
            actions={
              <Button asChild className="w-full rounded-full">
                <Link href="/property">
                  Change rooms
                  <ArrowLeft className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            }
            checkIn={draft.checkinDate}
            checkOut={draft.checkoutDate}
            eyebrow="Stay Review"
            meta={
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Rooms selected</p>
                {(draft.rooms ?? []).map((room) => (
                  <div key={room.roomTypeId} className="flex items-start justify-between gap-4 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="font-semibold">{room.title}</p>
                      <p className="text-xs text-white/60">
                        {room.quantity} x {room.guestText.replace(/^x\s*/, "")} • {formatCurrency(room.basePrice)} per night
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(room.basePrice * room.quantity * nights)}</p>
                  </div>
                ))}
              </div>
            }
            title="Booking summary"
          >
            <div className="grid gap-4 rounded-[22px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--vh-cyan)]" />
                <div>
                  <p className="font-semibold text-white">Inventory is validated before payment</p>
                  <p className="text-sm text-white/66">
                    The backend re-checks availability and reserves addon stock before a Razorpay order is created.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="mt-1 h-4 w-4 shrink-0 text-[var(--vh-amber)]" />
                <div>
                  <p className="font-semibold text-white">Razorpay test mode</p>
                  <p className="text-sm text-white/66">
                    Use sandbox credentials in the checkout. Payment success is verified through the backend before confirmation.
                  </p>
                </div>
              </div>
            </div>
          </BookingSummaryCard>

          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="vh-chip w-fit">Optional Add-ons</p>
                <h2 className="mt-3 font-suez text-3xl uppercase tracking-[-0.04em] text-white">Grab extras before you pay</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">
                  These products and services come from the public store catalog. Only purchasable commodity and service items are shown here.
                </p>
              </div>
              {isLoadingCatalog ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading catalog
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {catalogItems.length > 0 ? (
                catalogItems.map((item, index) => {
                  const quantity = addonQuantities[item.id] ?? 0;
                  const tone = index % 3;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-[24px] border p-5 transition",
                        tone === 0 && "border-[rgba(255,46,98,0.28)] bg-[rgba(255,46,98,0.08)]",
                        tone === 1 && "border-[rgba(0,209,255,0.22)] bg-[rgba(0,209,255,0.06)]",
                        tone === 2 && "border-[rgba(255,204,102,0.24)] bg-[rgba(255,204,102,0.06)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/48">{item.category}</p>
                          <h3 className="mt-2 text-xl font-semibold text-white">{item.name}</h3>
                          <p className="mt-2 text-sm text-white/66">
                            {item.in_stock
                              ? item.available_stock === null
                                ? "Available to add"
                                : `${item.available_stock} in stock`
                              : "Currently unavailable"}
                          </p>
                        </div>
                        <div className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-bold text-[var(--vh-amber)]">
                          {formatCurrency(item.base_price)}
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 rounded-full border border-white/12 bg-[#0f172a] px-2 py-1">
                          <button
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={quantity <= 0}
                            onClick={() => updateAddonQuantity(item.id, quantity - 1)}
                            type="button"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold text-white">{quantity}</span>
                          <button
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={!item.in_stock}
                            onClick={() => updateAddonQuantity(item.id, quantity + 1)}
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-white/78">
                          {quantity > 0 ? formatCurrency(quantity * item.base_price) : "Not added"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="md:col-span-2 rounded-[20px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-white/68">
                  Catalog add-ons are unavailable right now. You can still complete the room booking without extras.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <p className="vh-chip w-fit">Guest Account</p>
            <h2 className="mt-3 font-suez text-3xl uppercase tracking-[-0.04em] text-white">Guest profile used for the booking</h2>

            {isAuthenticated ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Name</p>
                  <p className="mt-2 font-semibold text-white">{guest?.name || "Not available"}</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Email</p>
                  <p className="mt-2 font-semibold text-white">{guest?.email || "Not available"}</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Phone</p>
                  <p className="mt-2 font-semibold text-white">{guest?.phone || "Add later during KYC"}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[22px] border border-[rgba(255,46,98,0.22)] bg-[rgba(255,46,98,0.08)] p-5">
                <p className="font-semibold text-white">Sign in before payment</p>
                <p className="mt-2 text-sm leading-7 text-white/70">
                  The booking APIs require a guest JWT. Your room selection is already saved locally, so you can sign in now and continue without rebuilding the cart.
                </p>
                <Button className="mt-4 rounded-full" onClick={() => openAuthModal("signin")} type="button">
                  Sign in to continue
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[28px] border border-white/12 bg-[var(--vh-panel-strong)] p-6 shadow-[var(--vh-shadow-lg)]">
            <p className="vh-chip">
              <ShoppingBag className="h-3.5 w-3.5" />
              Payable now
            </p>
            <div className="mt-4 space-y-4 border-b border-white/10 pb-4">
              {draft.rooms.map((room) => (
                <div key={room.roomTypeId} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{room.title}</p>
                    <p className="text-xs text-white/55">
                      {room.quantity} x {nights} {nights === 1 ? "night" : "nights"}
                    </p>
                  </div>
                  <p className="font-semibold text-white">{formatCurrency(room.basePrice * room.quantity * nights)}</p>
                </div>
              ))}

              {(draft.addons ?? []).map((addon) => (
                <div key={addon.productId} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{addon.name}</p>
                    <p className="text-xs text-white/55">
                      {addon.quantity} x {addon.category.toLowerCase()}
                    </p>
                  </div>
                  <p className="font-semibold text-white">{formatCurrency(addon.unitPrice * addon.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3 text-sm text-white/76">
              <div className="flex items-center justify-between">
                <p>Rooms subtotal</p>
                <p className="font-semibold text-white">{formatCurrency(roomSubtotal)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p>Add-ons subtotal</p>
                <p className="font-semibold text-white">{formatCurrency(addonsSubtotal)}</p>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base">
                <p className="font-semibold text-white">Estimated total</p>
                <p className="font-bold text-[var(--vh-amber)]">{formatCurrency(estimatedGrandTotal)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[20px] border border-[rgba(0,209,255,0.2)] bg-[rgba(0,209,255,0.06)] p-4 text-sm text-white/72">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[var(--vh-cyan)]" />
                <p>
                  The backend computes the authoritative grand total during `create-order`. This estimate is only for review before Razorpay opens.
                </p>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-[18px] border border-[rgba(255,76,48,0.24)] bg-[rgba(255,76,48,0.1)] px-4 py-3 text-sm text-white/86">
                {errorMessage}
              </div>
            ) : null}

            <Button className="mt-6 h-12 w-full rounded-full text-base" disabled={isPaying} onClick={() => void handlePayment()} type="button">
              {isPaying ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Preparing payment
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Continue to Razorpay
                </>
              )}
            </Button>

            <p className="mt-4 text-center text-xs leading-6 text-white/52">
              By continuing, you agree to the booking flow, cancellation policy, and pre-arrival ID verification requirements documented for this property.
            </p>
          </div>
        </aside>
      </div>
    </BookingPageShell>
  );
}
