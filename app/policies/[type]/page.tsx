import Link from "next/link";
import { notFound } from "next/navigation";

import { PolicyToc } from "@/components/marketing/policy-toc";
import { FadeIn } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { policies, policySlugs } from "@/content/policies";
import { footerLinks, siteMeta } from "@/content/site";

type PolicyPageProps = {
  params: Promise<{ type: string }>;
};

export function generateStaticParams() {
  return policySlugs.map((type) => ({ type }));
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { type } = await params;
  const currentPolicy = policies[type];

  if (!currentPolicy) {
    notFound();
  }

  return (
    <>
      <section className="border-b-2 border-[var(--vh-border)] bg-gradient-to-br from-[var(--vh-surface)] to-[var(--vh-surface-2)] px-6 py-12">
        <div className="vh-container text-center">
          <h1 className="text-5xl font-bold uppercase tracking-[-2.4px] text-white">
            {currentPolicy.title}
          </h1>
          <p className="mt-4 text-sm text-white/60">Last Updated: {currentPolicy.lastUpdated}</p>
        </div>
      </section>

      <section className="vh-section">
        <div className="vh-container grid grid-cols-1 gap-8 lg:grid-cols-4">
          <PolicyToc sections={currentPolicy.sections} />

          <div className="lg:col-span-3">
            <Card className="p-8 md:p-12">
              <div className="max-w-[750px] space-y-12">
                {currentPolicy.sections.map((section) => (
                  <FadeIn key={section.id} className="scroll-mt-24" id={section.id}>
                    <h2 className="text-3xl font-bold uppercase text-white">{section.title}</h2>
                    <div className="mt-6 space-y-4">
                      {section.content.map((paragraph) => (
                        <p key={paragraph} className="text-base leading-7 text-white/90">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </FadeIn>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container max-w-screen-md">
          <div className="rounded-[12px] border-4 border-white bg-gradient-to-br from-[var(--vh-pink)] to-[var(--vh-pink-soft)] p-8 text-center shadow-[8px_8px_0px_0px_rgba(255,255,255,0.18)]">
            <h3 className="text-2xl font-bold uppercase text-white">Have Questions About Our Policies?</h3>
            <p className="mt-3 text-base italic text-white">The Vibe Crew is here to help.</p>
            <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <a href={siteMeta.contact.emailHref}>Email Us</a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href={`https://wa.me/919876543210`}>WhatsApp</a>
              </Button>
            </div>
            <div className="mt-8 border-t-2 border-white/25 pt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[1px] text-white/80">Other Policies</p>
              <div className="flex flex-wrap justify-center gap-3">
                {footerLinks.legal.map((item) => (
                  <Button asChild key={item.href} size="sm" variant="outline">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
