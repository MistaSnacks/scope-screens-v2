# Uniform Desktop Scaling — Design

**Date:** 2026-06-16
**Branches:** ALT (primary), then replicated to `main`
**Status:** Approved, pending spec review

## Problem

The site renders in two layouts: a mobile/tablet base layout and a desktop
layout that engages at the Tailwind `md:` breakpoint (768px). The desktop layout
is built almost entirely from **hard-coded pixel values** (429 arbitrary
`[…px]` utilities across ~25 files) plus **144 `md:` overrides**.

Because those desktop values are fixed pixels, the desktop design does **not
scale** with the window:

- On a 2560px monitor the layout is the same physical size as on a 1280px laptop,
  just surrounded by more empty margin.
- It "snaps" between the base and `md:` layouts.

The desired behavior: **one desktop design that scales like a zoom** — the same
look at every desktop width, larger or smaller with the window, **capped** on very
large displays. Mobile and tablet keep their own (distinct) behavior, unchanged.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Scale ceiling | Scale, then **cap** on very wide monitors |
| Desktop scaling engages at | **≥ 1024px** (tablet 768–1024 keeps current behavior) |
| Technique | **Fluid root font-size + convert px → rem** |

## Approach

### 1. Scaling engine (single knob)

A single fluid root `font-size`, gated to the desktop range:

```css
/* Uniform desktop scaling: above 1024px the whole design rides one fluid
   root font-size, scaling like a zoom (capped) instead of snapping. Below
   1024px the root stays at the browser default → mobile/tablet unchanged. */
@media (min-width: 1024px) {
  :root {
    font-size: clamp(11.38px, 1.1111vw, 19.2px);
  }
}
```

- **Reference design width: 1440px.** The desktop layout was authored to look
  correct around this width, so 1440px ⇒ scale 1.0 ⇒ root 16px.
- `1.1111vw` = `100vw / 1440 × 16px`, so root font-size — and therefore every
  rem-based dimension — scales linearly with viewport width.
- **Lower bound 11.38px** = the value at 1024px (`1024/1440 × 16`). Acts as the
  floor; only meaningful right at the boundary since the rule is gated to ≥1024.
- **Cap 19.2px** = the value at 1728px (`1.2 × 16`). Above ~1728px the root font
  stops growing → the design stops zooming, margins grow, content centers. This
  is the "scale, then cap" behavior.
- All three numbers (reference width, cap width, floor) are tunable in this one
  rule.

### 2. Make the design ride the knob (px → rem codemod)

Tailwind's standard utilities (`p-6`, `gap-4`, `max-w-3xl`, `text-lg`) already
emit `rem`, so they scale automatically once the root font is fluid. The holdouts
are the **429 arbitrary pixel utilities** (`text-[56px]`, `px-[90px]`,
`scroll-mt-[120px]`, `h-[44px]`, …). A scripted codemod converts each to rem by
dividing by 16:

- `text-[56px]` → `text-[3.5rem]`
- `px-[90px]` → `px-[5.625rem]`
- `scroll-mt-[120px]` → `scroll-mt-[7.5rem]`

**Critical safety property:** at root 16px, `3.5rem` is *exactly* `56px`. The
conversion is therefore **behavior-neutral everywhere the root font is 16px** —
i.e. below 1024px (mobile/tablet) the rendered output is pixel-identical to
today. The conversion only changes anything where the root font scales (≥1024px),
which is precisely the desktop range we are fixing.

**Codemod scope and exclusions:**

- **Scope:** arbitrary `[<number>px]` tokens inside `className` strings in
  `app/**/*.tsx` and `components/**/*.tsx`. (This is exactly the set the audit
  grep `\[[0-9]+px\]` matched — all Tailwind utilities.)
- **Exclude — border widths:** `border-[Npx]`, `border-{x,y,t,b,l,r}-[Npx]`,
  ring/outline widths. Scaling sub-pixel borders looks odd and risks disappearing
  hairlines; leave them fixed for crispness.
- **Exclude — values ≤ 2px:** hairlines and 1–2px details stay crisp.
- The author reviews the full codemod diff before committing.

### 3. Deliberately left untouched

- **Hero** (`components/curtain-credits-hero.module.css`,
  `curtain-credits-hero.tsx`): already fluid via `vw`/`clamp`, uses no `rem`, and
  self-caps at 1320px. Its GSAP + WebGL (curtainsjs) logic measures real rendered
  pixels (`getBoundingClientRect`, `innerWidth`), which root-font scaling does not
  affect. Leave entirely as-is.
- **`--band-skew`** and other `clamp()`/`vw` values in `globals.css`: already
  fluid. Untouched.
- These naturally fall outside the codemod scope (they live in CSS, not in
  `className` arbitrary `[…px]` tokens).

### 4. Both branches

Implement and verify on **ALT** first. Then run the identical globals.css edit and
the identical codemod on **`main`** (fewer files, same patterns, same approach).
Treat each branch's codemod diff as a separate review.

## Verification

- **Pixel-identity below the boundary:** using the existing `.shots/` Playwright
  capture scripts, confirm **375px and 800px** renders are pixel-identical before
  vs. after the change.
- **Uniform scaling above the boundary:** capture **1024 / 1440 / 1920 / 2560**
  and confirm the design scales uniformly and stops growing past ~1728px.
- `npm run build` passes.
- `npm test` passes.

## Tradeoffs / Notes

- There is a visual step at exactly 1024px. This is the tablet→desktop *layout*
  boundary (intended to differ) and it replaces today's cramped 768–1024 desktop
  rendering with a clean fit-to-window.
- Using a `px`-based fluid root font-size means the browser's user font-size
  preference no longer scales the desktop layout. Acceptable for this design
  (the viewport-proportional zoom is the explicit goal).
- Hero scales via `vw` while body content scales via the root font; both grow
  with width, so they stay visually coherent across the desktop range.

## Out of scope

- Redesigning the tablet (768–1024) layout.
- Any change to the hero's scaling behavior.
- Changing breakpoints (`md:` stays at 768px).
