import { redirect } from "next/navigation";

type RoomsPageProps = {
  searchParams?: Promise<{
    checkin?: string;
    checkout?: string;
  }>;
};

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params?.checkin) {
    query.set("checkin", params.checkin);
  }

  if (params?.checkout) {
    query.set("checkout", params.checkout);
  }

  redirect(query.toString() ? `/property?${query.toString()}` : "/property");
}
