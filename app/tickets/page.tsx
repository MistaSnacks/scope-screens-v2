import { PageHeader } from "@/components/page-header";
import { BuyTickets } from "@/components/buy-tickets";
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
      <PageHeader
        eyebrow="Chapter One"
        title={"The\nNext Show"}
        lede="Last Tuesday of the month, June through December. Ten directors, ten films, one packed house in the Central District — doors at 7:00, lights down at 7:30. Go for the night, or go all season."
      />
      <BuyTickets nextShow={nextShow} seasonPass={seasonPass} headless />
    </main>
  );
}
