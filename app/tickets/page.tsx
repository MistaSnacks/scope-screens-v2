import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { BuyTickets } from "@/components/buy-tickets";
import { PartnersMarquee } from "@/components/partners-marquee";
import { ClosingBand } from "@/components/closing-band";
import { KineticText } from "@/components/motion/kinetic-text";
import { getPurchasableTargets } from "@/lib/wix-checkout";
import { getSiteContent } from "@/lib/site-content";
import { isPageHidden } from "@/lib/nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tickets · Scope Screenings",
  description:
    "Buy a ticket for the next show or grab a Season Pass, last Tuesday of the month, June through December.",
};

export default async function TicketsPage() {
  const [{ nextShow, seasonPass }, content] = await Promise.all([getPurchasableTargets(), getSiteContent()]);
  if (isPageHidden(content, "tickets")) notFound();
  const page = content.ticketsPage;
  return (
    <main className="min-h-screen bg-bg">
      <PageHero
        eyebrow={page?.eyebrow ?? "Chapter One"}
        title={page?.title ?? "The\nNext Show"}
        lede={page?.lede ?? "Last Tuesday of the month, June through December. Ten directors, ten films, one packed house in the Central District: doors at 7:00, lights down at 7:30. Go for the night, or go all season."}
        logo
      />
      <section className="border-t border-hairline bg-bg-alt px-5 py-24 md:shell-x">
        <SectionEyebrow label="Why a season pass" />
        <KineticText as="h2" className="pulp mt-5 font-display text-[2.75rem] uppercase leading-[0.95] md:text-[4rem]" text={page?.whyTitle ?? "One Pass, Every Night"} />
        <p className="mt-5 max-w-[60ch] font-credits text-[1.125rem] leading-relaxed text-fg/80">
          {page?.whyBody ?? "A season pass is the cheapest seat in the house and the only one that holds your spot for all seven nights, plus first claim on the after-parties and the front-row block."}
        </p>
      </section>
      <BuyTickets nextShow={nextShow} seasonPass={seasonPass} headless />
      <PartnersMarquee />
      <ClosingBand
        title={page?.closingTitle ?? "See You In The Dark"}
        body={page?.closingBody ?? "Doors at 6:30, screen at 7:30. Grab a pass and we’ll save you a seat."}
        href={page?.closingHref || "/schedule"}
        cta={page?.closingCta ?? "View The Schedule ›"}
      />
    </main>
  );
}
