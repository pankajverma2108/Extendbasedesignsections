import { Suspense } from "react";

import { GoogleAuthErrorContent } from "./google-auth-error-content";

function GoogleAuthErrorFallback() {
  return (
    <section className="vh-section py-20 pt-28 md:pt-32">
      <div className="vh-container">
        <div className="mx-auto max-w-[560px] rounded-[14px] border border-[#ff2e62]/45 bg-[#2a1118] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
          <h1 className="text-3xl font-bold uppercase tracking-[1px] text-white">Login Could Not Be Completed</h1>
          <p className="mt-3 text-white/80">Loading the sign-in error details...</p>
        </div>
      </div>
    </section>
  );
}

export default function GoogleAuthErrorPage() {
  return (
    <Suspense fallback={<GoogleAuthErrorFallback />}>
      <GoogleAuthErrorContent />
    </Suspense>
  );
}
