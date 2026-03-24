import { Property } from "@/components/marketing/property";

type PropertyPageProps = {
  searchParams?: Promise<{
    checkin?: string;
    checkout?: string;
  }>;
};

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const params = await searchParams;

  return (
    <Property
      initialCheckIn={params?.checkin}
      initialCheckOut={params?.checkout}
    />
  );
}
