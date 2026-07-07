import Link from "next/link";
import type { ScheduleRow } from "@/lib/wix-events";

/** The season list at the foot of an event page — the same seven nights the
    homepage schedule shows. Always open (small footprint); each night carries a
    prominent Reserve button so visitors can buy early for any show. */
export function UpcomingShows({
  rows,
  title = "Upcoming Shows",
}: {
  rows: ScheduleRow[];
  title?: string;
}) {
  if (!rows.length) return null;

  return (
    <section className="border-t border-hairline bg-bg-alt px-5 py-14 md:shell-x">
      <div className="mx-auto max-w-[62rem]">
        <div className="flex items-baseline gap-3">
          <span className="pulp font-display text-[2rem] uppercase leading-none md:text-[2.75rem]">
            {title}
          </span>
          <span className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-smoke">
            {rows.length} nights
          </span>
        </div>

        <ul className="mt-6 flex flex-col">
          {rows.map((s, i) => (
            <li
              key={`${s.month}-${s.day}-${i}`}
              className={`flex items-center gap-4 py-4 md:gap-5 ${i > 0 ? "border-t border-cream/10" : ""}`}
            >
              <div className="flex w-[4rem] shrink-0 flex-col md:w-[4.5rem]">
                <span className="font-marquee text-[0.8125rem] uppercase tracking-[0.04em] text-rust">
                  {s.month}
                </span>
                <span className="font-display text-[1.75rem] leading-[0.85] text-fg">{s.day}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-display text-[1.125rem] uppercase leading-none text-fg">
                  {s.title}
                </span>
                <span className="mt-1 font-body text-[0.6875rem] uppercase tracking-[0.12em] text-smoke">
                  {s.long}
                </span>
              </div>
              <div className="shrink-0">
                {s.reservable ? (
                  s.slug ? (
                    <Link
                      href={`/events/${s.slug}`}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-rust bg-rust px-4 py-2.5 font-body text-[0.75rem] font-extrabold uppercase tracking-[0.06em] text-ink transition-transform hover:-translate-y-0.5"
                    >
                      Reserve ›
                    </Link>
                  ) : (
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-rust bg-rust px-4 py-2.5 font-body text-[0.75rem] font-extrabold uppercase tracking-[0.06em] text-ink transition-transform hover:-translate-y-0.5"
                    >
                      Reserve ›
                    </a>
                  )
                ) : (
                  <span className="font-body text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-smoke">
                    On sale soon
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
