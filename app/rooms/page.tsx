import { RoomsPlp } from "@/components/marketing/rooms-plp";

type RoomsPageProps = {
  searchParams?: Promise<{
    checkin?: string;
    checkout?: string;
  }>;
};

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const params = await searchParams;

  return (
    <RoomsPlp
      initialCheckIn={params?.checkin}
      initialCheckOut={params?.checkout}
    />
  );
}
