"use client";
import { useEffect, useMemo, useState } from "react";

/** Pure: choose the most-visible section id, else keep current. */
export function pickActiveSection(
  entries: IntersectionObserverEntry[],
  current: string,
): string {
  let best = current;
  let bestRatio = 0;
  for (const e of entries) {
    if (e.isIntersecting && e.intersectionRatio > bestRatio) {
      bestRatio = e.intersectionRatio;
      best = (e.target as HTMLElement).id;
    }
  }
  return best;
}

/** Track which of the given section ids is most in view. */
export function useScrollSpy(ids: string[], initial: string): string {
  const [active, setActive] = useState(initial);
  const idsKey = useMemo(() => ids.join(","), [ids]);

  useEffect(() => {
    const sectionIds = idsKey.split(",").filter(Boolean);
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;
    const seen = new Map<string, IntersectionObserverEntry>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set((e.target as HTMLElement).id, e));
        setActive((cur) => pickActiveSection([...seen.values()], cur));
      },
      { threshold: [0.15, 0.5, 0.85], rootMargin: "-45% 0px -45% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [idsKey]);
  return active;
}
