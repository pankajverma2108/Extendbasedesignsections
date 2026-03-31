import { PreArrivalPage } from "@/components/booking/pre-arrival-page";

type PreArrivalRouteProps = {
  params: Promise<{
    eri: string;
  }>;
};

export default async function PreArrivalRoute({ params }: PreArrivalRouteProps) {
  const { eri } = await params;

  return <PreArrivalPage ezeeReservationId={decodeURIComponent(eri)} />;
}
