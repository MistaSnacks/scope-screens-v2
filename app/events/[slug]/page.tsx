import { cache } from "react";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { PartnersMarquee } from "@/components/partners-marquee";
import { UpcomingShows } from "@/components/upcoming-shows";
import { CheckoutPanel } from "@/components/checkout/checkout-panel";
import { Reveal } from "@/components/motion/reveal";
import { getEventBySlug, type EventDetails } from "@/lib/wix-checkout";
import { getScheduleRows } from "@/lib/schedule";
import { VENUE, SEASON_PASS } from "@/lib/festival";
import type { Metadata } from "next";

// Metadata + page both need the event; dedupe the Wix query per request.
const getEvent = cache(getEventBySlug);

// 35mm sprocket perforations — same unexposed-leader colour + 40px pitch as the
// Moments reel, so the event marquee reads as one frame off the same filmstrip.
const PERF_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='30'%3E%3Crect x='9' y='9' width='22' height='12' rx='2' fill='%23e7e0cf'/%3E%3C/svg%3E\")";

function Perfs() {
  return (
    <div
      aria-hidden
      className="h-[1.875rem] shrink-0 bg-center bg-repeat-x"
      style={{ backgroundImage: PERF_BG, backgroundSize: "40px 30px" }}
    />
  );
}

/** The client's Wix "main image" is a fixed yellow Season-4 graphic, so instead
    of piping it in we frame the transparent wordmark as a single film frame —
    sprockets top + bottom, ink ground, a soft projector glow. Same prop tilt +
    shadow the ticket and lanyard use. */
function EventMarquee({ label }: { label: string }) {
  return (
    <div className="-rotate-[1.5deg] overflow-hidden rounded-md bg-ink shadow-prop ring-1 ring-cream/10">
      <Perfs />
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-ink px-8">
        {/* projector spill so the wordmark sits in light, not on flat black */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(115% 80% at 50% 44%, rgba(179,58,44,0.26), transparent 60%)" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/popcorn-logo.png"
          alt="Scope Screenings"
          className="relative h-auto w-[82%] max-w-[17.5rem] drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)]"
        />
        <span className="absolute right-4 top-4 rounded-[0.1875rem] bg-[#0b0a09b3] px-[0.5625rem] py-[0.3125rem] font-mono text-[0.625rem] uppercase tracking-[0.16em] text-cream">
          {label}
        </span>
      </div>
      <Perfs />
    </div>
  );
}

// Display title: same prefix-strip the schedule uses, so "Scope Screenings:
// Opening Night" reads as "Opening Night" under the Scope page chrome.
function displayTitle(e: EventDetails): string {
  if (e.isSeasonPass) return "Season\nPass";
  return e.title.replace(/^\s*scope screenings:?\s*/i, "").trim() || "Scope Screenings";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event · Scope Screenings" };
  // No openGraph.images override → event links inherit the site's branded
  // open-curtain OG image (app/opengraph-image.jpg), same as the homepage,
  // instead of the client's yellow Wix event graphic.
  return {
    title: `${displayTitle(event).replace("\n", " ")} · Scope Screenings`,
    description: event.shortDescription || undefined,
  };
}

function DetailRow({ k, v, href }: { k: string; v: string; href?: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-hairline py-4 first:border-t-0 first:pt-0">
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-label">{k}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[1.0625rem] font-bold leading-snug text-fg underline decoration-rust decoration-2 underline-offset-4 hover:text-rust"
        >
          {v}
        </a>
      ) : (
        <span className="font-body text-[1.0625rem] font-bold leading-snug text-fg">{v}</span>
      )}
    </div>
  );
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  // Collapsible season list at the foot of every event page — same seven
  // nights as the homepage schedule, minus the show you're already on.
  const scheduleRows = (await getScheduleRows()).filter((r) => r.slug !== event.slug);

  const eyebrow = event.isSeasonPass
    ? `Season No. 05 · Jun–Dec · All ${SEASON_PASS.nights} Nights`
    : [event.dateLong, event.startTime].filter(Boolean).join(" · ") || "Scope Screenings";

  return (
    <main className="min-h-screen bg-bg">
      <PageHero
        eyebrow={eyebrow}
        title={displayTitle(event)}
        lede={event.shortDescription || undefined}
        logo
        card={
          <div className="card">
            <span className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.2em] text-label">
              Get Your Tickets
            </span>
            <div className="mt-5 flex flex-col gap-5">
              <CheckoutPanel
                target={{ eventId: event.eventId, eventSlug: event.slug, title: event.title }}
              />
            </div>
          </div>
        }
      />

      {/* Details band — poster + the facts (or the season lineup for the pass). */}
      <section className="mt-16 border-t border-hairline bg-bg-alt px-5 py-20 md:shell-x md:mt-20">
        <div className="mx-auto flex max-w-[78.75rem] flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          <Reveal className="w-full max-w-[26rem] shrink-0">
            <EventMarquee label={event.isSeasonPass ? "All Access" : "Season 05"} />
          </Reveal>

          <div className="flex flex-1 flex-col gap-10">
            <Reveal className="flex flex-col">
              {event.isSeasonPass ? (
                <>
                  <DetailRow k="Admits" v={`Bearer · All ${SEASON_PASS.nights} Nights`} />
                  <DetailRow k="Season" v="No. 05 · June – December" />
                  <DetailRow
                    k="Venue"
                    v={`${VENUE.name} · ${VENUE.address} · ${VENUE.city}`}
                  />
                </>
              ) : (
                <>
                  {event.dateLong ? (
                    <DetailRow
                      k="Date"
                      v={[event.dateLong, event.startTime].filter(Boolean).join(" · ")}
                    />
                  ) : null}
                  {event.venueName || event.address ? (
                    <DetailRow
                      k="Venue"
                      v={[event.venueName, event.address].filter(Boolean).join(" · ")}
                      href={event.mapsUrl ?? undefined}
                    />
                  ) : null}
                </>
              )}
            </Reveal>

            {event.aboutHtml ? (
              <Reveal delay={0.08}>
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-label">
                  About the night
                </span>
                <div
                  className="mt-4 max-w-[62ch] font-credits text-[1.0625rem] leading-relaxed text-fg/80 [&_a]:text-rust [&_a]:underline [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-[1.5rem] [&_h2]:uppercase [&_h2]:text-fg [&_li]:mt-1 [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: event.aboutHtml }}
                />
              </Reveal>
            ) : null}

          </div>
        </div>
      </section>

      <PartnersMarquee />

      <UpcomingShows rows={scheduleRows} />
    </main>
  );
}
