# Motion System Implementation Plan (ALT first)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared motion foundation (Lenis smooth scroll + Framer Motion micro-motion + a GSAP bridge) and apply the **maximal showpiece** tier on `ALT`, building reusable primitives that `main` will later reuse at the restrained tier.

**Architecture:** One foundation under `components/motion/` + `lib/motion.ts`, identical across branches. A Lenis provider drives page-wide smooth scroll and bridges into GSAP's ticker/ScrollTrigger so the existing curtain hero is undisturbed. Framer Motion primitives (`<Reveal>`, `<Stagger>`, `<Hoverable>`) wrap existing sections. ALT adds parallax, scrubbed/pinned sequences, magnetic buttons, a cursor field, animated band reveals, and enter route transitions. Every primitive is inert under `prefers-reduced-motion`.

**Tech Stack:** Next 16 (App Router) · React 19 · Framer Motion (`motion`) · Lenis · GSAP 3 + `@gsap/react` · Tailwind 4 · Vitest + Testing Library (jsdom).

**Reduced-motion contract (applies to every task):** Each primitive must check `prefersReducedMotion()` from `lib/motion.ts` and render its content statically with no transform/opacity animation and no Lenis. Content is visible-by-default (never trapped hidden if JS/IO never fires).

---

## File Structure

```
lib/motion.ts                            # tokens: easings, durations, springs, reveal cfg, lenis opts, prefersReducedMotion()
components/motion/
  smooth-scroll-provider.tsx             # Lenis init + GSAP ticker/ScrollTrigger bridge + LenisContext + useLenis()
  reveal.tsx                             # <Reveal> fade+rise on scroll-in
  stagger.tsx                            # <Stagger> / <StaggerItem>
  hoverable.tsx                          # <Hoverable> lift/scale (+ magnetic prop, ALT)
  parallax.tsx                           # <Parallax> scroll-drift wrapper (ALT)
  cursor-field.tsx                       # cursor-aware glow (ALT, pointer-only)
  scroll-spy.ts                          # pickActiveSection() pure helper + useScrollSpy() hook (main nav; shared)
app/template.tsx                         # ALT enter route transition (Framer)
```
Existing sections are wrapped/annotated with primitives; the curtain hero
(`components/curtain-credits-hero.tsx`) is **not** rewritten — only the Lenis
bridge touches scrolling.

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Framer Motion + Lenis**

Run: `npm install motion lenis`
Expected: `package.json` dependencies gain `motion` and `lenis`; install exits 0.

- [ ] **Step 2: Verify the app still builds**

Run: `npm run build`
Expected: build completes with no new errors (deps present, unused for now).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add motion (Framer Motion) + lenis deps"
```

---

## Task 2: Motion tokens (`lib/motion.ts`)

**Files:**
- Create: `lib/motion.ts`
- Test: `lib/motion.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/motion.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { prefersReducedMotion, revealVariants, EASE, lenisOptions } from "./motion";

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduce") ? matches : false,
    media: q, addEventListener() {}, removeEventListener() {},
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("motion tokens", () => {
  it("EASE is a 4-number cubic-bezier", () => {
    expect(EASE).toHaveLength(4);
    EASE.forEach((n) => expect(typeof n).toBe("number"));
  });

  it("reports reduced-motion preference from matchMedia", () => {
    mockReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    mockReducedMotion(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("revealVariants hidden state is offset, visible state is settled", () => {
    expect(revealVariants.hidden.opacity).toBe(0);
    expect(revealVariants.hidden.y).toBeGreaterThan(0);
    expect(revealVariants.visible.opacity).toBe(1);
    expect(revealVariants.visible.y).toBe(0);
  });

  it("lenisOptions uses the shared easing duration", () => {
    expect(lenisOptions.duration).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/motion.test.ts`
Expected: FAIL — `Cannot find module './motion'`.

- [ ] **Step 3: Implement `lib/motion.ts`**

```ts
// lib/motion.ts
// Single source of truth for motion timing so every branch/section feels coherent.

/** Site signature ease (matches globals.css cubic-bezier(0.22,1,0.36,1)). */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = { fast: 0.35, base: 0.6, slow: 0.9 } as const;

/** Soft spring for hover/tap micro-interactions. */
export const SPRING = { type: "spring", stiffness: 320, damping: 26, mass: 0.6 } as const;

/** Default rise distance for reveals (px). */
export const REVEAL_Y = 20;

export const revealVariants = {
  hidden: { opacity: 0, y: REVEAL_Y },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
} as const;

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
} as const;

export const lenisOptions = {
  duration: 1.1,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
} as const;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/motion.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/motion.ts lib/motion.test.ts
git commit -m "feat(motion): shared motion tokens + reduced-motion helper"
```

---

## Task 3: Scroll-spy helper + hook (`components/motion/scroll-spy.ts`)

Pure logic is unit-tested; the hook wires it to IntersectionObserver. Used by
`main`'s single-page nav, built now as shared foundation.

**Files:**
- Create: `components/motion/scroll-spy.ts`
- Test: `components/motion/scroll-spy.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// components/motion/scroll-spy.test.ts
import { describe, it, expect } from "vitest";
import { pickActiveSection } from "./scroll-spy";

const entry = (id: string, ratio: number) =>
  ({ target: { id }, intersectionRatio: ratio, isIntersecting: ratio > 0 } as IntersectionObserverEntry);

describe("pickActiveSection", () => {
  it("returns the id with the highest intersection ratio", () => {
    expect(pickActiveSection([entry("about", 0.2), entry("tickets", 0.7)], "top")).toBe("tickets");
  });
  it("keeps the current id when nothing is intersecting", () => {
    expect(pickActiveSection([entry("about", 0), entry("tickets", 0)], "tickets")).toBe("tickets");
  });
  it("falls back to current id for an empty list", () => {
    expect(pickActiveSection([], "about")).toBe("about");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/motion/scroll-spy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/motion/scroll-spy.ts`**

```ts
// components/motion/scroll-spy.ts
"use client";
import { useEffect, useState } from "react";

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
  useEffect(() => {
    const nodes = ids
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
  }, [ids.join(",")]);
  return active;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/motion/scroll-spy.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/motion/scroll-spy.ts components/motion/scroll-spy.test.ts
git commit -m "feat(motion): scroll-spy helper + useScrollSpy hook"
```

---

## Task 4: Smooth-scroll provider + GSAP bridge

**Files:**
- Create: `components/motion/smooth-scroll-provider.tsx`
- Modify: `app/layout.tsx` (wrap children)

- [ ] **Step 1: Implement the provider**

```tsx
// components/motion/smooth-scroll-provider.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenisOptions, prefersReducedMotion } from "@/lib/motion";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const raf = useRef<((time: number) => void) | null>(null);

  useEffect(() => {
    // Reduced motion: native scroll, no Lenis, no bridge.
    if (prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);
    const instance = new Lenis(lenisOptions);
    setLenis(instance);

    // Bridge Lenis -> GSAP so any ScrollTrigger-driven effect stays in sync,
    // and drive Lenis from GSAP's single ticker.
    instance.on("scroll", ScrollTrigger.update);
    raf.current = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf.current);
    gsap.ticker.lagSmoothing(0);

    return () => {
      if (raf.current) gsap.ticker.remove(raf.current);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
```

- [ ] **Step 2: Wrap children in `app/layout.tsx`**

Add import near the other component imports:
```tsx
import { SmoothScrollProvider } from "@/components/motion/smooth-scroll-provider";
```
Wrap the existing children/provider tree (inside `<ThemeProvider>`):
```tsx
<ThemeProvider>
  <GrainOverlay />
  <PersistentValance />
  <SiteNav />
  <SmoothScrollProvider>
    <CheckoutProvider>{children}</CheckoutProvider>
  </SmoothScrollProvider>
  <SiteFooter />
</ThemeProvider>
```

- [ ] **Step 3: Build + typecheck**

Run: `npm run build`
Expected: compiles; no type errors from `lenis`/`gsap/ScrollTrigger` imports.

- [ ] **Step 4: Hero parity manual check (acceptance gate)**

Run: `npm run dev`, open `/`.
Verify, on desktop AND mobile emulation:
- Curtain hero opens → holds → closes on scroll exactly as before.
- Scroll feels smoothed, no stutter at the hero pin range.
- DevTools → Rendering → emulate `prefers-reduced-motion: reduce`: scrolling is native, hero shows its reduced-motion still, no console errors.

If the hero desyncs, disable Lenis over the hero range (gate `smoothWheel`)
before continuing — do not proceed until parity holds.

- [ ] **Step 5: Commit**

```bash
git add components/motion/smooth-scroll-provider.tsx app/layout.tsx
git commit -m "feat(motion): Lenis smooth scroll + GSAP ticker/ScrollTrigger bridge"
```

---

## Task 5: `<Reveal>` and `<Stagger>` primitives

**Files:**
- Create: `components/motion/reveal.tsx`
- Create: `components/motion/stagger.tsx`

- [ ] **Step 1: Implement `<Reveal>`**

```tsx
// components/motion/reveal.tsx
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { DURATION, EASE, REVEAL_Y, prefersReducedMotion } from "@/lib/motion";

export function Reveal({
  children,
  delay = 0,
  y = REVEAL_Y,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  if (prefersReducedMotion()) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: DURATION.base, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Implement `<Stagger>` / `<StaggerItem>`**

```tsx
// components/motion/stagger.tsx
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { DURATION, EASE, REVEAL_Y, staggerContainer, prefersReducedMotion } from "@/lib/motion";

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  if (prefersReducedMotion()) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: REVEAL_Y },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
};

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  if (prefersReducedMotion()) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Smoke-build**

Run: `npm run build`
Expected: compiles (primitives unused so far is fine).

- [ ] **Step 4: Commit**

```bash
git add components/motion/reveal.tsx components/motion/stagger.tsx
git commit -m "feat(motion): Reveal + Stagger scroll-in primitives"
```

---

## Task 6: `<Hoverable>` (with magnetic) + `<Parallax>` + cursor field

**Files:**
- Create: `components/motion/hoverable.tsx`
- Create: `components/motion/parallax.tsx`
- Create: `components/motion/cursor-field.tsx`

- [ ] **Step 1: Implement `<Hoverable>`**

```tsx
// components/motion/hoverable.tsx
"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { SPRING, prefersReducedMotion } from "@/lib/motion";

export function Hoverable({
  children,
  className,
  lift = -4,
  magnetic = false,
  strength = 0.25,
}: {
  children: ReactNode;
  className?: string;
  lift?: number;
  magnetic?: boolean;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useSpring(useMotionValue(0), SPRING);
  const my = useSpring(useMotionValue(0), SPRING);

  if (prefersReducedMotion()) return <div className={className}>{children}</div>;

  const onMove = (e: React.MouseEvent) => {
    if (!magnetic || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={magnetic ? { x: mx, y: my } : undefined}
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileHover={{ y: lift }}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Implement `<Parallax>` (ALT)**

```tsx
// components/motion/parallax.tsx
"use client";

import { motion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** Drifts children by `distance` px across their scroll-through. */
export function Parallax({
  children,
  distance = 60,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  if (prefersReducedMotion()) return <div className={className}>{children}</div>;
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `cursor-field.tsx` (ALT, pointer-only)**

```tsx
// components/motion/cursor-field.tsx
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
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[40] hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full lg:block"
      style={{
        left: x, top: y,
        background: "radial-gradient(circle, color-mix(in srgb, var(--color-rust) 18%, transparent) 0%, transparent 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
```

- [ ] **Step 4: Smoke-build**

Run: `npm run build`
Expected: compiles.

- [ ] **Step 5: Commit**

```bash
git add components/motion/hoverable.tsx components/motion/parallax.tsx components/motion/cursor-field.tsx
git commit -m "feat(motion): Hoverable (magnetic), Parallax, CursorField primitives"
```

---

## Task 7: Apply restrained tier — section reveals + stagger

Wrap section content so headings/paragraphs rise in and lists stagger. **Do not
move markup**; wrap existing blocks. Pattern per section:

```tsx
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

// heading/intro block:
<Reveal>{/* existing heading + paragraph JSX */}</Reveal>

// repeated list (rows/cards):
<Stagger className="<existing list classes>">
  {items.map((it) => (
    <StaggerItem key={it.id}>{/* existing row/card JSX */}</StaggerItem>
  ))}
</Stagger>
```

- [ ] **Step 1: Apply to homepage section intros** — `app/page.tsx`: wrap each
  chapter `<div className="flex flex-col items-center gap-4 text-center">…</div>`
  intro block (Chapter Three "Scope Screenings Magic", Chapter Four "The
  Archives") in `<Reveal>`.

- [ ] **Step 2: Apply to content components' heading/intro blocks** — wrap the
  top heading+intro JSX of each in `<Reveal>`:
  - `components/what-is.tsx`
  - `components/founder-band.tsx`
  - `components/submissions.tsx`
  - `components/schedule-section.tsx`
  - `components/support-press.tsx`

- [ ] **Step 3: Apply `<Stagger>` to list-like groups:**
  - `components/schedule-section.tsx` — the schedule rows list.
  - `components/buy-tickets.tsx` — the ticket option cards.
  - `components/site-footer.tsx` — footer link columns.
  - `components/filmstrip.tsx` — the archive grid items.

- [ ] **Step 4: Build + manual check**

Run: `npm run build`, then `npm run dev`.
Expected: section intros fade+rise once on scroll-in; lists stagger; no layout
shift; reduced-motion emulation shows everything static and visible.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/what-is.tsx components/founder-band.tsx components/submissions.tsx components/schedule-section.tsx components/support-press.tsx components/buy-tickets.tsx components/site-footer.tsx components/filmstrip.tsx
git commit -m "feat(motion): apply Reveal + Stagger across sections (restrained tier)"
```

---

## Task 8: Apply hovers — cards, CTAs, links

- [ ] **Step 1: Wrap interactive cards/CTAs in `<Hoverable>`** (non-magnetic for
  the restrained baseline):
  - `components/buy-tickets.tsx` — each ticket card → `<Hoverable>`.
  - `components/schedule-section.tsx` — each schedule row → `<Hoverable lift={-2}>`.
  - `components/filmstrip.tsx` — each film tile → `<Hoverable>`.

- [ ] **Step 2: Build + manual check**

Run: `npm run build`, then `npm run dev`.
Expected: cards lift softly on hover, settle on leave; tap scales slightly;
reduced-motion shows no movement.

- [ ] **Step 3: Commit**

```bash
git add components/buy-tickets.tsx components/schedule-section.tsx components/filmstrip.tsx
git commit -m "feat(motion): hover micro-interactions on cards + rows"
```

---

## Task 9: Route smooth-scroll — wire `scroll-control.tsx` to Lenis

`scroll-control.tsx` currently jumps with `window.scrollTo`. Route it through
Lenis when available so jumps share the page easing.

**Files:**
- Modify: `components/scroll-control.tsx`

- [ ] **Step 1: Use the Lenis hook for jumps**

Add import:
```tsx
import { useLenis } from "@/components/motion/smooth-scroll-provider";
```
In the component, get `const lenis = useLenis();` and replace the `go` handler:
```tsx
const go = () => {
  const top = past ? 0 : heroOpenTarget();
  if (lenis && !prefersReducedMotion()) lenis.scrollTo(top);
  else window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
};
```
(Note: "Return to top" now also routes through Lenis — `top = 0` when `past`.)

- [ ] **Step 2: Build + manual check**

Run: `npm run build`, then `npm run dev`.
Expected: the scroll cue button jumps with smooth Lenis easing; reduced-motion
falls back to native; no regression to the hero open target.

- [ ] **Step 3: Commit**

```bash
git add components/scroll-control.tsx
git commit -m "feat(motion): route scroll cue through Lenis scrollTo"
```

---

## Task 10: ALT showpiece — parallax on imagery

- [ ] **Step 1: Wrap imagery groups in `<Parallax>`** (tune `distance` 40–80):
  - `components/moments-reel.tsx` — reel image group.
  - `components/filmstrip.tsx` — strip imagery (subtle, `distance={40}`).
  - `components/founder-band.tsx` — portrait/visual.
  - `components/partners-marquee.tsx` — keep CSS marquee; add light parallax to
    the band container only if it reads well.

- [ ] **Step 2: Build + manual check**

Run: `npm run build`, then `npm run dev`.
Expected: imagery drifts gently against scroll; no clipping at section edges;
mobile not janky; reduced-motion static.

- [ ] **Step 3: Commit**

```bash
git add components/moments-reel.tsx components/filmstrip.tsx components/founder-band.tsx components/partners-marquee.tsx
git commit -m "feat(motion/ALT): parallax drift on imagery"
```

---

## Task 11: ALT showpiece — animated band reveals + magnetic CTAs + cursor field

**Files:**
- Modify: `app/globals.css` (band reveal base state — optional helper class)
- Modify: `components/site-nav.tsx`, `components/buy-tickets.tsx` (magnetic CTAs)
- Modify: `app/layout.tsx` (mount `CursorField`)

- [ ] **Step 1: Animated band reveals** — wrap the `.band-up` / `.band-down`
  section intro content (homepage chapter sections) in `<Reveal y={32}>` so the
  angled bands rise in with more travel than the restrained default.

- [ ] **Step 2: Magnetic primary CTAs** — wrap the "Get Tickets" CTA in
  `components/site-nav.tsx` and the primary buy buttons in
  `components/buy-tickets.tsx` with `<Hoverable magnetic strength={0.3}>`.

- [ ] **Step 3: Mount the cursor field (ALT only)** — in `app/layout.tsx` add:
```tsx
import { CursorField } from "@/components/motion/cursor-field";
```
and render `<CursorField />` just inside `<body>` (after the theme script).

- [ ] **Step 4: Build + manual check**

Run: `npm run build`, then `npm run dev`.
Expected: bands animate in; CTAs pull toward cursor and snap back; a soft rust
glow trails the cursor on desktop, absent on touch/reduced-motion.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/site-nav.tsx components/buy-tickets.tsx app/layout.tsx components/motion/cursor-field.tsx
git commit -m "feat(motion/ALT): band reveals, magnetic CTAs, cursor field"
```

---

## Task 12: ALT showpiece — enter route transitions

App Router fires enter (not exit) reliably; use `template.tsx` (re-mounts per
navigation) with a Framer enter animation. Keep it short and on-theme.

**Files:**
- Create: `app/template.tsx`

- [ ] **Step 1: Implement the transition template**

```tsx
// app/template.tsx
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";

export default function Template({ children }: { children: ReactNode }) {
  if (prefersReducedMotion()) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Build + manual check**

Run: `npm run build`, then `npm run dev`.
Navigate `/ → /about → /submit → /support → /schedule`.
Expected: each route fades+rises in on arrival; no flash of unstyled content;
reduced-motion shows hard cuts; the fixed nav/hero are unaffected.

- [ ] **Step 3: Commit**

```bash
git add app/template.tsx
git commit -m "feat(motion/ALT): enter route transitions via template"
```

---

## Task 13: Full verification pass + run test suite

- [ ] **Step 1: Run the whole suite**

Run: `npm test`
Expected: all tests pass, including `lib/motion.test.ts` and
`components/motion/scroll-spy.test.ts`.

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 3: Manual acceptance matrix** (`npm run dev`)
  - Curtain hero parity holds (the Task 4 gate) — desktop + mobile.
  - Reveals/stagger fire once, no trapped-hidden content with JS on.
  - Hovers + magnetic CTAs + cursor field behave; absent on touch.
  - Parallax has no edge clipping; mobile smooth.
  - Route transitions on all ALT routes.
  - `prefers-reduced-motion: reduce`: everything inert, native scroll, content
    fully visible, zero console errors.

- [ ] **Step 4: Final commit (if any tuning applied)**

```bash
git add -A
git commit -m "test(motion): full verification pass for ALT motion tier"
```

---

## Follow-up (separate plan): port restrained subset to `main`

Not built here. When porting: cherry-pick `lib/motion.ts` + `components/motion/`
foundation, apply Tasks 5/7/8/9 only, **skip** Tasks 10–12 (no parallax/
magnetic/cursor/route transitions). Replace ALT's route transitions with the
single-page nav enhancement: wire `useScrollSpy` (Task 3) into
`components/site-nav.tsx` to highlight the active section, and route nav anchor
clicks through Lenis `scrollTo`. `main` keeps hard cuts between (non-existent)
routes.

---

## Self-Review

- **Spec coverage:** Lenis+Framer+GSAP stack (T1,4) ✓ · Lenis↔hero bridge + parity gate (T4) ✓ · foundation primitives Reveal/Stagger/Hoverable/Parallax/CursorField/scroll-spy (T2,3,5,6) ✓ · reduced-motion contract (every task) ✓ · restrained tier reveals/stagger/hovers (T7,8) ✓ · nav: ALT route transitions (T12) + main scroll-spy port (follow-up) ✓ · ALT extras parallax/band reveals/magnetic/cursor (T10,11) ✓ · per-branch dial honored (ALT here, main follow-up) ✓.
- **Placeholders:** none — all code blocks complete.
- **Type consistency:** `prefersReducedMotion`, `EASE`, `DURATION`, `SPRING`, `revealVariants`, `staggerContainer`, `lenisOptions` from `lib/motion.ts` used consistently; `pickActiveSection`/`useScrollSpy` signatures match across test + hook + follow-up; `useLenis` exported by the provider and consumed in T9.
