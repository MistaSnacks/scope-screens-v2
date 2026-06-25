import { PageHero } from "@/components/page-hero";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { BuyTickets } from "@/components/buy-tickets";
import { PartnersMarquee } from "@/components/partners-marquee";
import { ClosingBand } from "@/components/closing-band";
import { KineticText } from "@/components/motion/kinetic-text";
import { getPurchasableTargets } from "@/lib/wix-checkout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tickets — Scope Screenings",
  description:
    "Buy a ticket for the next show or grab a Season Pass — last Tuesday of the month, June through December.",
};

export default async function TicketsPage() {
  const { nextShow, seasonPass } = await getPurchasableTargets();
  return (
    <main className="min-h-screen bg-bg">
      <PageHero
        eyebrow="Chapter One"
        title={"The\nNext Show"}
        lede="Last Tuesday of the month, June through December. Ten directors, ten films, one packed house in the Central District — doors at 7:00, lights down at 7:30. Go for the night, or go all season."
        logo
      />
      <section className="border-t border-hairline bg-bg-alt px-5 py-24 md:shell-x">
        <SectionEyebrow label="Why a season pass" />
        <KineticText as="h2" className="pulp mt-5 font-display text-[2.75rem] uppercase leading-[0.95] md:text-[4rem]" text="One Pass, Every Night" />
        <p className="mt-5 max-w-[60ch] font-credits text-[1.125rem] leading-relaxed text-fg/80">
          A season pass is the cheapest seat in the house and the only one that holds your spot for all seven nights — plus first claim on the after-parties and the front-row block.
        </p>
      </section>
      <BuyTickets nextShow={nextShow} seasonPass={seasonPass} headless />
      <section className="border-t border-hairline bg-bg px-5 py-24 md:shell-x">
        <SectionEyebrow label="Presented with" centered />
        <PartnersMarquee />
      </section>
      <ClosingBand
        title="See You In The Dark"
        body="Doors at 6:30, screen at 7:30. Grab a pass and we'll save you a seat."
        href="/schedule"
        cta="View The Schedule ›"
      />
    </main>
  );
}
