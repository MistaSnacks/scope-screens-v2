"use client";

import type { TicketTier } from "@/lib/wix-checkout";

// Wix returns sale windows in UTC; the deadline the audience cares about is
// venue-local (Seattle), so an 11:50 PM PDT cutoff reads as its own day, not
// the next one in UTC.
const VENUE_TZ = "America/Los_Angeles";
function formatSaleEnd(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { timeZone: VENUE_TZ, month: "short", day: "numeric" }).format(d);
}

export function TicketPicker({
  tiers,
  quantities,
  onChange,
}: {
  tiers: TicketTier[];
  quantities: Record<string, number>;
  onChange: (tierId: string, quantity: number) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {tiers.map((tier) => {
        const qty = quantities[tier.id] ?? 0;
        const saleEnds = tier.saleEndsAt ? formatSaleEnd(tier.saleEndsAt) : null;
        return (
          <li
            key={tier.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-faint bg-cream/5 px-4 py-3"
          >
            <div className="flex flex-col">
              <span className="font-body text-[0.9375rem] font-bold text-fg">{tier.name}</span>
              <span className="font-mono text-[0.75rem] text-smoke">{tier.priceLabel}</span>
              {saleEnds && (
                <span className="font-mono text-[0.6875rem] tracking-[0.04em] text-rust/90">Sale ends {saleEnds}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={`Decrease ${tier.name}`}
                disabled={qty === 0}
                onClick={() => onChange(tier.id, Math.max(0, qty - 1))}
                className="h-8 w-8 rounded-full border border-faint font-body text-lg leading-none text-fg disabled:opacity-30"
              >
                −
              </button>
              <span className="w-6 text-center font-body text-[1rem] font-bold tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label={`Increase ${tier.name}`}
                disabled={qty >= tier.limit}
                onClick={() => onChange(tier.id, Math.min(tier.limit, qty + 1))}
                className="h-8 w-8 rounded-full border border-faint font-body text-lg leading-none text-fg disabled:opacity-30"
              >
                +
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
