# Motion System — Design Spec

**Date:** 2026-06-15
**Branches:** `ALT` (build first), `main` (port restrained subset after)
**Status:** Approved direction, pending spec review

## Goal

Make the Scope Screenings site feel **alive** — subtle movement, fluidity, and
micro-interactions at "top quality" — without disturbing the existing curtain
hero or the cinematic/pulp art direction.

Two intensity tiers, deliberately divergent per branch:

- **`main` → Restrained & tasteful.** Production-safe, editorial. Smooth scroll,
  gentle reveals, soft hovers, light stagger. The site *breathes*.
- **`ALT` → Maximal showpiece.** Everything on `main` PLUS parallax,
  scroll-scrubbed/pinned sequences, magnetic buttons, animated band reveals,
  cursor-aware touches, and route transitions.

This overrides the original "same animations on both branches" idea — main and
ALT now diverge on a single **intensity dial**, by design.

## Library stack (use all three)

| Library | Role | Notes |
|---|---|---|
| **Lenis** | Page-wide smooth scroll + scroll-driven fluidity | New dep. Drives parallax & the nav scroll-to. |
| **Framer Motion** (`motion`) | Declarative component micro-motion: reveals, hover/tap, stagger, layout, page transitions | New dep. The workhorse for everything component-level. |
| **GSAP + `@gsap/react`** | The existing curtain hero timeline; ALT scroll-scrubbed/pinned sequences | Already installed. Hero is **not** rewritten. |

Combined footprint ≈ 50–60KB gzipped — acceptable for a cinematic festival site
where feel is the product.

### The one real integration risk: Lenis ↔ pinned curtain hero

The hero opens the curtain off raw `window.scrollY`
(`components/curtain-credits-hero.tsx`, `components/scroll-control.tsx`). Lenis
can virtualize scroll position and desync that math. Mitigation — bridge Lenis
into GSAP's ScrollTrigger and the GSAP ticker:

```js
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

…and route `scroll-control.tsx`'s jump target through Lenis's `scrollTo` rather
than `window.scrollTo`. **Acceptance check:** the curtain hero opens/holds/closes
identically before and after Lenis is added, on desktop and mobile, with and
without `prefers-reduced-motion`.

## Shared motion foundation (identical on both branches)

A new `components/motion/` module + `lib/motion.ts`. Both branches import the
*same* primitives; only the **configuration** and **which primitives are used**
differ. This keeps the foundation from drifting between branches.

### 1. `SmoothScrollProvider`
Wraps the app in `app/layout.tsx`. Initializes Lenis, runs the GSAP ticker
bridge, exposes a `useLenis()` hook. **No-ops entirely when
`prefers-reduced-motion: reduce`** (native scroll instead). Disabled on the
hero's pinned range if it conflicts (tuned during build).

### 2. `<Reveal>`
The backbone of "alive." Wraps any block; fades + rises (~16–24px) into view on
first scroll-in via Framer's `whileInView` + `viewport={{ once: true }}`.
Props: `delay`, `y`, `as`. Honors reduced-motion (renders static, no transform).

### 3. `<Stagger>` / `<StaggerItem>`
Container that staggers children's reveals (schedule rows, ticket cards, footer
links, archive grid). Built on Framer variants with `staggerChildren`.

### 4. `<Hoverable>` interaction wrapper(s)
Micro-interactions for cards, links, CTAs: lift (`y: -4`), subtle scale, shadow
bloom, underline sweep. Spring-based, tuned soft. Used by both tiers; ALT adds
magnetic behavior on top (see below).

### 5. `lib/motion.ts` — tokens & shared config
Single source of truth: easing curves (reuse the site's
`cubic-bezier(0.22, 1, 0.36, 1)`), durations, spring configs, reveal distances,
Lenis options. Both branches read from here so timing feels coherent.

### Accessibility (applies to all primitives)
- Every primitive checks `prefers-reduced-motion`. `globals.css` already kills
  transitions/animations under that query (lines ~210–219) — primitives must
  also skip transforms/Lenis, not just CSS.
- Reveals never hide content from no-JS / SSR: initial state is visible-by-
  default with motion layered on, so content is never trapped hidden.
- Focus order and keyboard nav unaffected; magnetic/cursor effects are
  pointer-only enhancements.

## Per-branch dial

### `main` — Restrained subset
- `SmoothScrollProvider` (Lenis) site-wide.
- `<Reveal>` on section headings, chapter labels, paragraphs, body blocks.
- `<Stagger>` on lists (schedule, tickets, footer, archive).
- `<Hoverable>` soft lifts on cards / buttons / links.
- **Nav motion (single-page):** nav items are in-page anchors (`#tickets`,
  `#about`, …). Enhance with:
  - Lenis `scrollTo(target, { easing })` for buttery animated section jumps.
  - **Scroll-spy**: highlight the active section in the nav as it enters view
    (IntersectionObserver → sets `active`). Replaces today's manual `active`
    prop.
  - Optional thin scroll-progress indicator.
- **No** parallax, pinning, scrubbing, magnetic, cursor effects, or route
  transitions.

### `ALT` — Maximal showpiece (superset)
Everything in `main`, plus:
- **Parallax / scroll-drift** on imagery — moments reel, filmstrip, founder
  band, partner marquee (Framer `useScroll` + `useTransform`, or Lenis-driven).
- **Scroll-scrubbed / pinned sequences** — e.g. animated chapter-band reveals,
  archive/filmstrip pinned scrub (GSAP ScrollTrigger, bridged to Lenis).
- **Magnetic buttons** — primary CTAs (Get Tickets, chapter CTAs) pull toward
  the cursor; layered onto `<Hoverable>`.
- **Cursor-aware touches** — subtle custom cursor / hover field on interactive
  art (kept tasteful, pointer-only, off on touch).
- **Animated section-band reveals** — the angled `.band-up` / `.band-down`
  bands animate in rather than appearing static.
- **Route transitions (multi-page):** ALT has real routes (`/about`, `/submit`,
  `/support`, `/schedule`) via `usePathname()`. Add Framer
  `AnimatePresence` + a transition layout wrapper for fluid enter/exit between
  routes (cinematic wipe/fade consistent with the curtain motif). `main` keeps
  hard cuts — it has no routes.

## File / structure plan

```
lib/motion.ts                         # tokens, easings, springs, Lenis opts
components/motion/
  smooth-scroll-provider.tsx          # Lenis + GSAP ticker bridge + useLenis()
  reveal.tsx                          # <Reveal>
  stagger.tsx                         # <Stagger> / <StaggerItem>
  hoverable.tsx                       # hover/lift wrappers (+ magnetic on ALT)
  page-transition.tsx                 # ALT only — AnimatePresence wrapper
  cursor-field.tsx                    # ALT only — cursor-aware effect
  use-scroll-spy.ts                   # main nav active-section tracking
```
Existing components (`what-is`, `schedule-section`, `submissions`,
`support-press`, `founder-band`, `filmstrip`, `moments-reel`, `buy-tickets`,
`site-footer`, `site-nav`) get wrapped/annotated with primitives — minimal
internal rewrites. The curtain hero stays as-is except for the Lenis bridge.

## Build order

1. **ALT first** (current branch) — it exercises every primitive.
   1. Add deps (`motion`, `lenis`). Build `lib/motion.ts` + foundation.
   2. Wire `SmoothScrollProvider`; verify the curtain hero is untouched
      (acceptance check above).
   3. Layer restrained tier everywhere (reveals, stagger, hovers, nav scroll-spy
      is N/A on ALT — ALT nav is routes; instead add route transitions).
   4. Layer showpiece extras (parallax, scrub/pin, magnetic, cursor, band
      reveals, route transitions).
   5. Review on real pages; tune timing in `lib/motion.ts`.
2. **Port to `main`** — cherry-pick the foundation + restrained subset; swap
   route-transition work for the single-page nav scroll-spy + Lenis `scrollTo`.
   Confirm the dial: no showpiece extras on `main`.

## Testing & verification
- Unit: `use-scroll-spy` active-section logic; `lib/motion` reduced-motion
  branch returns inert config. (Vitest, matching existing `site-nav.test.ts`.)
- Manual: curtain hero parity (the acceptance check), reduced-motion pass
  (everything inert, no trapped-hidden content), mobile (no jank, Lenis off or
  tuned), keyboard nav unaffected.
- Performance: watch for layout thrash from parallax; prefer transform/opacity
  only; cap concurrent scroll listeners.

## Out of scope (YAGNI)
- Reworking the curtain hero internals.
- Page transitions on `main` (single-page — not applicable).
- Heavy WebGL/3D, scroll-jacking beyond Lenis smoothing.
