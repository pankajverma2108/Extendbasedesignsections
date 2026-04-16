import { BookingDetailPage } from "@/components/booking/booking-detail-page";

type BookingDetailRouteProps = {
  params: Promise<{
    eri: string;
  }>;
};

export default async function BookingDetailRoute({ params }: BookingDetailRouteProps) {
  const { eri } = await params;

  return <BookingDetailPage ezeeReservationId={decodeURIComponent(eri)} />;
}
