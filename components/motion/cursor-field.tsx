"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** A soft rust glow that trails the cursor. Pointer devices only. */
export function CursorField() {
  const x = useSpring(useMotionValue(-100), { stiffness: 220, damping: 30 });
  const y = useSpring(useMotionValue(-100), { stiffness: 220, damping: 30 });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // `any-pointer: fine` is true whenever a mouse/trackpad is present — unlike
    // `pointer: coarse`, which ChromeOS reports as the primary pointer on
    // touchscreen Chromebooks even while the trackpad is in use (hiding the glow).
    if (!window.matchMedia("(any-pointer: fine)").matches) return;
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  if (typeof window !== "undefined" && !window.matchMedia?.("(any-pointer: fine)").matches) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[40] hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full lg:block"
      style={{
        left: x, top: y,
        // Normal compositing (no mix-blend-mode). A blend layer parked under the
        // cursor hotspot is the prime trigger for Chromium's hardware cursor
        // vanishing on GPU-composited pages (notably ChromeOS); over the near-
        // black ink ground this reads the same as the old `screen` blend.
        background: "radial-gradient(circle, color-mix(in srgb, var(--color-rust) 22%, transparent) 0%, transparent 70%)",
      }}
    />
  );
}
