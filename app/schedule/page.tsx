import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { ScheduleSection } from "@/components/schedule-section";
import { PartnersMarquee } from "@/components/partners-marquee";
import { ClosingBand } from "@/components/closing-band";
import { getSiteContent } from "@/lib/site-content";
import { isPageHidden } from "@/lib/nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule · Scope Screenings",
  description: "Seven nights a season: the last Tuesday of every month, June through December.",
};

export default async function SchedulePage() {
  const content = await getSiteContent();
  if (isPageHidden(content, "schedule")) notFound();
  const page = content.schedulePage;
  return (
    <main className="min-h-screen bg-bg">
      <PageHero
        eyebrow={page?.eyebrow ?? "The Season"}
        title={page?.title ?? "Seven\nNights"}
        lede={page?.lede ?? "One night a month, last Tuesday, June through December. Doors 6:30, lights down 7:30."}
        logo
      />
      <ScheduleSection headless />
      <PartnersMarquee />
      <ClosingBand
        title={page?.closingTitle ?? "Get Your Seat"}
        body={page?.closingBody ?? "Seven nights, ten directors a night, one room that leans all the way in. Lock your spot before the house fills."}
        href={page?.closingHref || "/tickets"}
        cta={page?.closingCta ?? "Buy Tickets ›"}
      />
    </main>
  );
}
