import { nextScreening } from "@/lib/festival";
import { getSiteContent } from "@/lib/site-content";

export async function Marquee() {
  // CMS "Marquee" phrases drive the ticker; festival.ts is the fallback.
  const content = await getSiteContent();
  const next = nextScreening();
  const cms = content.marquee
    ?.map((m) => m.phrase)
    .filter((p): p is string => Boolean(p));
  const ITEMS = cms?.length
    ? cms
    : [
        "NOW SHOWING",
        `${next.label} · LANGSTON HUGHES INSTITUTE`,
        "DOORS 6:30 / SCREEN 7:30",
        "10 DIRECTORS, ONE NIGHT",
        "TROPICAL WAVY ENERGY",
      ];
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="relative overflow-hidden border-y-2 border-rust bg-curtain">
      <div
        className="flex w-max items-center gap-7 whitespace-nowrap py-2.5"
        style={{ animation: "marquee 50s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-7">
            <span className="font-marquee text-[1.25rem] uppercase tracking-[0.03em] text-brass">
              {item}
            </span>
            <span className="text-rust" aria-hidden>
              ★
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
