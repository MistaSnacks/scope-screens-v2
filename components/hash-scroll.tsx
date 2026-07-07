"use client";

import { useEffect } from "react";

/** Next.js App Router does NOT scroll to a #hash target when you ARRIVE from a
    different route — e.g. tapping a homepage section link (Tickets / Schedule /
    Submit / About / Support) from /events/[slug] navigates home but drops you at
    the top. This scrolls to the target on mount.

    The homepage hero pins via ScrollTrigger, which inserts a pin spacer that
    shifts every section's offset over the first moment after load, so a single
    early scroll lands in the wrong place. Re-scroll at a few checkpoints until
    the layout settles. scroll-margin-top on the sections keeps the landing clear
    of the fixed nav. */
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const scroll = () => document.getElementById(id)?.scrollIntoView({ block: "start" });
    const timers = [0, 150, 400, 800, 1300, 2000].map((t) => window.setTimeout(scroll, t));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);
  return null;
}
