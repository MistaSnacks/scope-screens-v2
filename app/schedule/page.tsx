import { PageHero } from "@/components/page-hero";
import { ScheduleSection } from "@/components/schedule-section";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { PartnersMarquee } from "@/components/partners-marquee";
import { ClosingBand } from "@/components/closing-band";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule — Scope Screenings",
  description: "Seven nights a season — the last Tuesday of every month, June through December.",
};

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHero
        eyebrow="The Season"
        title={"Seven\nNights"}
        lede="One night a month, last Tuesday, June through December. Doors 6:30, lights down 7:30."
        logo
      />
      <ScheduleSection headless />
      <section className="border-t border-hairline bg-bg px-5 py-24 md:shell-x">
        <SectionEyebrow label="In good company" centered />
        <PartnersMarquee />
      </section>
      <ClosingBand
        title="Get Your Seat"
        body="Seven nights, ten directors a night, one room that leans all the way in. Lock your spot before the house fills."
        href="/tickets"
        cta="Buy Tickets ›"
      />
    </main>
  );
}
