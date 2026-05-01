"use client";

import { Button } from "@/components/ui/button";

export default function GuestError({ reset }: { reset: () => void }) {
  return (
    <section className="min-h-screen bg-[#07070a] pb-20 pt-28 text-white">
      <div className="mx-auto w-full max-w-3xl px-4 text-center md:px-6">
        <div className="rounded-[24px] border border-dashed border-white/24 bg-white/[0.035] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] md:p-8">
          <h1 className="font-suez text-[34px] uppercase leading-none tracking-[-0.03em] text-white">Guest hub did not load</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/68">Refresh this route and keep the current stay context intact.</p>
          <Button className="mt-6 h-10 rounded-[14px] bg-[#c92420] px-5 text-white hover:bg-[#a91d1a]" onClick={reset} type="button">
            Try again
          </Button>
        </div>
      </div>
    </section>
  );
}
