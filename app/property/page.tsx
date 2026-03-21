import { RoomsPlp } from "@/components/marketing/rooms-plp";

type PropertyPageProps = {
  searchParams?: Promise<{
    checkin?: string;
    checkout?: string;
  }>;
};

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const params = await searchParams;

  return (
    <RoomsPlp
      initialCheckIn={params?.checkin}
      initialCheckOut={params?.checkout}
    />
  );
}
