import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="vh-section min-h-screen pt-28 md:pt-32">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-10">
        <div className="space-y-6">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-[linear-gradient(90deg,#ff2e62,#facc15,#00d1ff)]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-40 rounded-full bg-white/10" />
            <Skeleton className="h-16 w-full max-w-3xl rounded-[18px] bg-white/10" />
            <Skeleton className="h-6 w-full max-w-2xl rounded-full bg-white/8" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[440px] rounded-[28px] bg-white/8" />
            <Skeleton className="h-[440px] rounded-[28px] bg-white/8" />
          </div>
        </div>
      </div>
    </section>
  );
}
