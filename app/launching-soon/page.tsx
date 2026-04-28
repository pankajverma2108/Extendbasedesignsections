import Link from "next/link";

type LaunchingSoonPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getPropertyName(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "Our next Koramangala spot";
  }

  return value ?? "Our next Koramangala spot";
}

export default async function LaunchingSoonPage({ searchParams }: LaunchingSoonPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const propertyName = getPropertyName(params?.property);

  return (
    <main className="min-h-screen bg-[#07070a] px-4 py-20 text-white">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-white/12 bg-[rgba(14,16,24,0.94)] p-6 sm:p-10">
        <p className="inline-flex rounded-full border border-[var(--vh-cyan)]/45 bg-[var(--vh-cyan)]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vh-cyan)]">
          Launching Soon
        </p>

        <h1 className="mt-4 text-balance font-['Suez_One'] text-3xl leading-tight sm:text-4xl">
          {propertyName}
        </h1>

        <p className="mt-4 max-w-2xl font-['Geologica'] text-base leading-7 text-white/82 sm:text-lg">
          We are setting this one up with fresh rooms, social common spaces, and daily hostel energy.
          Sign up now for early-bird offers, first access, and launch updates.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            className="vh-cta-button inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
            href={`mailto:thedailysocial01@gmail.com?subject=${encodeURIComponent(`Early bird signup: ${propertyName}`)}`}
          >
            Sign Up for Early-Bird Offers
          </a>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            href="/"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
