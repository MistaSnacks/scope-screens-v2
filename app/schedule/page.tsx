import { PageHeader } from "@/components/page-header";
import { ScheduleSection } from "@/components/schedule-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule — Scope Screenings",
  description: "Seven nights a season — the last Tuesday of every month, June through December.",
};

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHeader
        eyebrow="The Season"
        title={"Seven\nNights"}
        lede="One night a month, last Tuesday, June through December. Doors 6:30, lights down 7:30."
      />
      <ScheduleSection headless />
    </main>
  );
}
