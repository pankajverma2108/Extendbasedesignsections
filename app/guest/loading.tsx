import { Skeleton } from "@/components/ui/skeleton";

export default function GuestLoading() {
  return (
    <section className="min-h-screen bg-[#07070a] pb-28 pt-24 text-white md:pb-16 md:pt-28">
      <div className="mx-auto w-full max-w-6xl space-y-7 px-4 md:px-6">
        <Skeleton className="h-8 w-32 rounded-full bg-white/10" />
        <Skeleton className="h-16 w-full max-w-xl rounded-[18px] bg-white/10" />
        <Skeleton className="h-20 rounded-[22px] bg-white/8" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-44 rounded-[20px] bg-white/8" />
          <Skeleton className="h-44 rounded-[20px] bg-white/8" />
          <Skeleton className="h-44 rounded-[20px] bg-white/8" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-[22px] bg-white/8" />
          <Skeleton className="h-64 rounded-[22px] bg-white/8" />
          <Skeleton className="h-64 rounded-[22px] bg-white/8" />
        </div>
      </div>
    </section>
  );
}
