import "server-only";
// Shared season-schedule rows: the static SCREENINGS skeleton with any live Wix
// event merged in by month (so a night flips to reservable once it exists in
// Wix). Extracted from ScheduleSection so the homepage schedule and the event
// page's "Upcoming Shows" table render from one source.
import { getLiveSchedule, type ScheduleRow } from "./wix-events";
import { SCREENINGS, reserveUrl } from "./festival";

export type { ScheduleRow };

export async function getScheduleRows(): Promise<ScheduleRow[]> {
  const live = (await getLiveSchedule()) ?? [];
  const liveByMonth = new Map(live.map((r) => [r.month, r]));

  const rows: ScheduleRow[] = SCREENINGS.map(
    (s) =>
      liveByMonth.get(s.month) ?? {
        month: s.month,
        day: s.day,
        title: s.title,
        long: s.long,
        href: reserveUrl(s),
        slug: s.slug,
        reservable: s.status === "open",
      }
  );
  // Any live event outside the planned skeleton gets appended.
  for (const r of live) {
    if (!SCREENINGS.some((s) => s.month === r.month)) rows.push(r);
  }
  return rows;
}
