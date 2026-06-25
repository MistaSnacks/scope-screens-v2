import type { Metadata } from "next";
import { GIVING_LEVELS, DONATE_URL } from "@/lib/festival";
import { PartnersMarquee } from "@/components/partners-marquee";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Hoverable } from "@/components/motion/hoverable";
import { KineticText } from "@/components/motion/kinetic-text";
import { PageHero } from "@/components/page-hero";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { ClosingBand } from "@/components/closing-band";

export const metadata: Metadata = {
  title: "Support — Scope Screenings",
  description:
    "Three hundred seats, ten directors, every last Tuesday — none of it is free. Keep the screen lit.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* (a) Hero + give card */}
      <PageHero
        eyebrow="Funders & philanthropy"
        title="Keep It Running"
        lede="Three hundred seats, ten directors, every last Tuesday — none of it is free. Your support keeps the screen lit, the venue booked, and the doors open to filmmakers who’d never get this shot otherwise."
        logo
        card={
          <div className="card">
            <span className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.2em] text-label">
              Give Today
            </span>
            <p className="mt-4 font-credits text-[1rem] leading-relaxed text-muted">
              Every dollar goes straight to access — venue, gear, and filmmaker
              stipends.
            </p>
            <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6 w-full">
              Donate Now ›
            </a>
            <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              Tax-deductible via Shunpike 501(c)(3)
            </p>
          </div>
        }
      />

      {/* (b) "Pick Your Level" — 4 tiers */}
      <section className="border-t border-hairline bg-bg-alt px-5 py-24 md:shell-x">
        <Reveal>
          <SectionEyebrow label="Giving levels" />
          <KineticText
            as="h2"
            className="pulp mt-5 font-display text-[2.75rem] uppercase leading-[0.95] md:text-[4rem]"
            text="Pick Your Level"
          />
        </Reveal>
        <Stagger className="mt-12 grid gap-5 md:grid-cols-4">
          {GIVING_LEVELS.map((g) => (
            <StaggerItem
              key={g.name}
              className={`flex h-full flex-col rounded-lg border bg-card p-6 ${
                g.featured ? "border-rust ring-1 ring-rust" : "border-hairline"
              }`}
            >
              <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-label">
                {g.name}
              </span>
              <p className="mt-3 font-display text-[2.125rem] leading-none text-fg">
                {g.amount}
                <span className="font-body text-[0.8125rem] font-normal text-muted">
                  {" "}
                  / {g.cadence}
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {g.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex gap-2 font-credits text-[0.875rem] leading-snug text-muted"
                  >
                    <span className="text-curtain">•</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link mt-5"
              >
                Give ›
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* (c) 501(c)(3) note */}
      <section className="bg-bg-alt px-5 pb-24 md:shell-x">
        <Reveal className="flex flex-col gap-4 rounded-lg bg-card p-7 md:flex-row md:items-center md:gap-8">
          <span className="font-marquee text-[1.75rem] leading-none text-rust md:shrink-0">
            501(C)(3)
          </span>
          <p className="font-credits text-[1rem] leading-relaxed text-muted">
            Scope Screenings is a fiscally sponsored project of Shunpike, a
            registered 501(c)(3) nonprofit. Every contribution is
            tax-deductible to the fullest extent of the law, and your receipt
            comes straight from Shunpike.
          </p>
        </Reveal>
      </section>

      {/* (d) "Two Ways To Back Us" */}
      <section className="border-t border-hairline bg-bg px-5 py-24 md:shell-x">
        <Reveal>
          <SectionEyebrow label="Partner with us" />
          <KineticText
            as="h2"
            className="pulp mt-5 font-display text-[2.75rem] uppercase leading-[0.95] md:text-[4rem]"
            text="Two Ways To Back Us"
          />
        </Reveal>
        <Stagger className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Card 1 — Funders */}
          <StaggerItem>
            <Hoverable className="h-full rounded-lg border border-hairline bg-card p-8">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-label">
              Funders &amp; foundations
            </span>
            <h3 className="mt-3 font-display text-[1.625rem] uppercase text-fg">
              Fund the Mission
            </h3>
            <p className="mt-3 font-credits text-[1rem] leading-relaxed text-muted">
              Grants and major gifts that power access and equity work. We keep
              funder support proudly distinct from commercial sponsorship — your
              name sits with the mission, not the marketing.
            </p>
            <a
              href="mailto:hello@scopescreenings.com"
              className="btn-link mt-5 inline-block"
            >
              Talk to us ›
            </a>
            </Hoverable>
          </StaggerItem>

          {/* Card 2 — Sponsors */}
          <StaggerItem>
            <Hoverable className="h-full rounded-lg border border-hairline bg-card p-8">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-label">
              Brands &amp; sponsors
            </span>
            <h3 className="mt-3 font-display text-[1.625rem] uppercase text-fg">
              Put Your Brand On It
            </h3>
            <p className="mt-3 font-credits text-[1rem] leading-relaxed text-muted">
              Title, Major, and Supporting tiers with on-screen billing, on-site
              presence, and a packed, creative-led PNW audience. We&rsquo;ll
              build a package that actually fits your brand.
            </p>
            <a
              href="mailto:hello@scopescreenings.com"
              className="btn-link mt-5 inline-block"
            >
              Get the deck ›
            </a>
            </Hoverable>
          </StaggerItem>
        </Stagger>
      </section>

      {/* (e) Partners + closing CTA */}
      <PartnersMarquee />

      {/* Closing band */}
      <ClosingBand
        title="Keep The Screen Lit"
        body="Any amount keeps a filmmaker’s work on a big screen in front of a full house. Give once, give monthly, or back the whole season."
        href={DONATE_URL}
        cta="Donate Now ›"
        variant="secondary"
      />
    </main>
  );
}
