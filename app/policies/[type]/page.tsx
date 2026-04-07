import Link from "next/link";
import { notFound } from "next/navigation";

import { PolicyToc } from "@/components/marketing/policy-toc";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FadeIn } from "@/components/shared/motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
      <section className="vh-section pt-28 md:pt-32">
        <div className="vh-container text-center">
          <FadeIn>
            <p className="vh-kicker inline-flex rounded-full border border-white/15 bg-white/6 px-4 py-1.5 text-white">
              Policies
            </p>
            <h1 className="mt-5 text-5xl font-bold uppercase tracking-[-0.04em] text-white md:text-7xl">
              {currentPolicy.title}
            </h1>
            <p className="mt-4 text-sm text-white/60">Last Updated: {currentPolicy.lastUpdated}</p>
          </FadeIn>
        </div>
      </section>

      <section className="vh-section vh-section-alt">
        <div className="vh-container grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <SectionHeading align="left" title="Policies" />
            <Accordion className="mt-6 space-y-4" defaultValue={[currentPolicy.sections[0]?.id]} type="multiple">
              {currentPolicy.sections.map((section) => (
                <AccordionItem
                  key={section.id}
                  className="rounded-lg border border-white/10 bg-white/5 px-4"
                  id={section.id}
                  value={section.id}
                >
                  <AccordionTrigger className="text-base">{section.title}</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm leading-7">
                    {section.content.map((paragraph) => (
                      <p key={paragraph}>- {paragraph}</p>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <PolicyToc sections={currentPolicy.sections} />
          </div>
        </div>
      </section>

      <section className="vh-section">
        <div className="vh-container max-w-screen-md">
          <div className="text-center">
            <SectionHeading subtitle="Need help understanding a booking condition?" title="Have Questions?" />
            <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <a href={siteMeta.contact.emailHref}>Email Us</a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="https://wa.me/918884973328">WhatsApp</a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {footerLinks.legal.map((item) => (
                <Button asChild key={item.href} size="sm" variant="outline">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
