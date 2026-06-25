# ALT V2 — Design System + Deslopify Implementation Plan (Plan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish shared design primitives and apply them across every ALT sub-page so the V2 multipage build looks intentional and consistent, with hero design assets carried onto their respective pages.

**Architecture:** Add a small set of shared utilities (`globals.css`) and reusable components (`SectionEyebrow`, `PageHero`, `ClosingBand`). Migrate `/about`, `/submit`, `/support`, `/schedule`, `/tickets` onto them, removing duplicated markup and normalizing spacing, buttons, eyebrows, and the partner marquee. Frontend-only; no data layer changes.

**Tech Stack:** Next.js 16 (App Router, React 19), Tailwind CSS v4 (`@utility` / `@theme`), Framer Motion (`motion`), GSAP, curtains.js. Verify with `npm run build`, `npm run lint`, `npm run test` (vitest), and `npm run dev` for visual checks.

## Global Constraints

- Tailwind v4: custom utilities are declared with `@utility name { ... }` in `app/globals.css` (see existing `@utility shell-x`). Do NOT add a `tailwind.config.js`.
- Brand color tokens never flip themes; only semantic tokens flip under `:root[data-theme="house"]`. Use semantic tokens (`bg-card`, `text-fg`, `text-muted`, `border-hairline`, `text-label`) in components so both Movie Mode and House Lights render correctly.
- Display headings use `<KineticText>` with class `pulp font-display ... uppercase`. Eyebrows use `font-mono ... uppercase tracking-[0.3em] text-label`. Body/ledes use `font-credits`. Keep these conventions.
- Do NOT touch `lib/wix-checkout.ts`, `lib/wix-events.ts`, or the `BuyTickets` purchase wiring beyond shared shadow/grain styling.
- Spotlight/cursor-glow stays homepage-hero only — do not add it to sub-pages.
- Commit after every task. Branch is `ALT`.
- Co-author trailer on every commit:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Shared utilities in globals.css (buttons, shadow, card, gaps)

**Files:**
- Modify: `app/globals.css` (append a new utilities block before the final comment line)

**Interfaces:**
- Produces: CSS utility classes `.btn-primary`, `.btn-secondary`, `.btn-link`, `.shadow-prop`, `.card`, and gap tokens `--gap-tight`, `--gap-card`, `--gap-section` (consumed by all later tasks).

- [ ] **Step 1: Add the utilities**

Append to `app/globals.css` (just before the final `/* card surface token */` line):

```css
/* ------------------------------------------------------------------ */
/*  Shared component utilities — single source for buttons, the prop   */
/*  shadow, the raised card, and the section gap rhythm. Added in the   */
/*  ALT V2 deslopify pass so pages stop hand-tuning these per-instance.  */
/* ------------------------------------------------------------------ */

/* Primary CTA — concession red, cream label. */
@utility btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--color-curtain);
  color: var(--color-cream);
  padding: 0.875rem 1.75rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  transition: background-color 0.2s ease;
}
@utility btn-primary {
  &:hover { background-color: var(--color-curtain-bright); }
}

/* Secondary CTA — marquee gold, ink label. */
@utility btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--color-rust);
  color: var(--color-ink);
  padding: 0.875rem 1.75rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  transition: opacity 0.2s ease;
}
@utility btn-secondary {
  &:hover { opacity: 0.9; }
}

/* Tertiary inline link CTA. */
@utility btn-link {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-curtain);
  transition: color 0.2s ease;
}
@utility btn-link {
  &:hover { color: var(--color-rust); }
}

/* One shadow for the rotated physical props (ticket, lanyard, clapperboard). */
@utility shadow-prop {
  filter: drop-shadow(0 24px 48px rgba(0, 0, 0, 0.48));
}

/* Standard raised card surface. */
@utility card {
  border-radius: 0.5rem;
  border: 1px solid var(--color-hairline);
  background-color: var(--color-card);
  padding: 1.75rem;
}

/* Section gap rhythm tokens — use via inline style or arbitrary gap. */
:root {
  --gap-tight: 1.5rem;   /* dense rows / 4-up tier cards */
  --gap-card: 2.5rem;    /* 3-up card grids */
  --gap-section: 3.5rem; /* between a heading block and its content */
}
```

- [ ] **Step 2: Verify the build compiles the utilities**

Run: `npm run build`
Expected: build succeeds with no CSS/PostCSS errors. (If `@utility` with nested `&:hover` errors on this Tailwind version, split the hover into the same `@utility` block using a plain nested selector as shown; the two-block form above is already the safe form.)

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): shared button/shadow/card/gap utilities for ALT V2

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: SectionEyebrow component

**Files:**
- Create: `components/section-eyebrow.tsx`

**Interfaces:**
- Produces: `<SectionEyebrow label="..." centered? />` — the rule+label eyebrow used by every section. `centered` renders the symmetric (rule-label-rule) variant for intentional centered bands; default is the asymmetric left-rule.

- [ ] **Step 1: Create the component**

```tsx
// components/section-eyebrow.tsx
import { Reveal } from "@/components/motion/reveal";

export function SectionEyebrow({
  label,
  centered = false,
}: {
  label: string;
  centered?: boolean;
}) {
  return (
    <Reveal
      className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}
    >
      <span className="h-px w-10 bg-curtain" />
      <span className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.3em] text-label">
        {label}
      </span>
      {centered ? <span className="h-px w-10 bg-curtain" /> : null}
    </Reveal>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: build succeeds (component is unused so far; this just confirms it compiles).

- [ ] **Step 3: Commit**

```bash
git add components/section-eyebrow.tsx
git commit -m "feat(ui): SectionEyebrow component (left-rule + centered variants)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: PageHero component (replaces PageHeader, absorbs custom hero blocks)

**Files:**
- Create: `components/page-hero.tsx`

**Interfaces:**
- Consumes: `SectionEyebrow` (Task 2), `KineticText`, `Reveal`.
- Produces: `<PageHero eyebrow title lede? card? media? logo? />` where `card?: ReactNode` is the optional sidebar slot, `media?: { poster?: string }` renders the reel poster accent, `logo?: boolean` renders the popcorn logo anchor above the eyebrow.

- [ ] **Step 1: Create the component**

```tsx
// components/page-hero.tsx
import type { ReactNode } from "react";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { KineticText } from "@/components/motion/kinetic-text";
import { SectionEyebrow } from "@/components/section-eyebrow";

export function PageHero({
  eyebrow,
  title,
  lede,
  card,
  media,
  logo = false,
}: {
  eyebrow: string;
  /** Use "\n" for line breaks. */
  title: string;
  lede?: string;
  card?: ReactNode;
  media?: { poster?: string };
  logo?: boolean;
}) {
  return (
    <header className="px-5 pt-[7.5rem] md:shell-x md:pt-[9.375rem]">
      <div className="md:flex md:items-start md:justify-between md:gap-12">
        <Reveal className={card ? "md:max-w-[60%]" : undefined}>
          {logo ? (
            <Image
              src="/popcorn-logo.png"
              alt=""
              width={64}
              height={64}
              className="mb-5 h-12 w-auto md:h-14"
              priority
            />
          ) : null}
          <SectionEyebrow label={eyebrow} />
          <KineticText
            as="h1"
            className={`pulp mt-5 font-display text-[4rem] uppercase leading-[0.9] ${
              card ? "md:text-[5.5rem]" : "md:text-[6rem]"
            }`}
            text={title}
          />
          {lede ? (
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-[44ch] font-credits text-[1.25rem] leading-relaxed text-fg/75 md:text-[1.375rem]">
                {lede}
              </p>
            </Reveal>
          ) : null}
          {media?.poster ? (
            <Reveal delay={0.18} className="mt-8 overflow-hidden rounded-lg border border-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.poster} alt="" className="w-full" />
            </Reveal>
          ) : null}
        </Reveal>
        {card ? (
          <Reveal as="aside" delay={0.12} className="mt-10 w-full md:mt-2 md:w-[21.25rem] md:shrink-0">
            {card}
          </Reveal>
        ) : null}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/page-hero.tsx
git commit -m "feat(ui): unified PageHero (eyebrow/title/lede + optional card, media, logo)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: ClosingBand component

**Files:**
- Create: `components/closing-band.tsx`

**Interfaces:**
- Consumes: `KineticText`, `Hoverable`.
- Produces: `<ClosingBand title body href cta variant? />` where `variant` is `"primary" | "secondary"` (defaults `"primary"`) and picks `.btn-primary` vs `.btn-secondary`.

- [ ] **Step 1: Create the component**

```tsx
// components/closing-band.tsx
import { KineticText } from "@/components/motion/kinetic-text";
import { Hoverable } from "@/components/motion/hoverable";

export function ClosingBand({
  title,
  body,
  href,
  cta,
  variant = "primary",
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <section className="border-t border-hairline bg-bg-deep px-5 py-28 text-center md:shell-x">
      <KineticText
        as="h2"
        className="pulp font-display text-[3rem] uppercase leading-[0.95] md:text-[4.5rem]"
        text={title}
      />
      <p className="mx-auto mt-5 max-w-[48ch] font-credits text-[1.125rem] text-fg/75">
        {body}
      </p>
      <Hoverable magnetic strength={0.35} className="mt-8 inline-block">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={variant === "secondary" ? "btn-secondary" : "btn-primary"}
        >
          {cta}
        </a>
      </Hoverable>
    </section>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/closing-band.tsx
git commit -m "feat(ui): reusable ClosingBand CTA section

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Migrate /support to shared components

**Files:**
- Modify: `app/support/page.tsx` (currently 237 lines — read it fully before editing)

**Interfaces:**
- Consumes: `PageHero` (Task 3), `SectionEyebrow` (Task 2), `ClosingBand` (Task 4), `.btn-secondary`, `.btn-link`, `.card` (Task 1).

- [ ] **Step 1: Replace the inline hero (lines 18–63) with PageHero + a card**

Swap the `{/* (a) Hero + give card */}` `<section>` for:

```tsx
<PageHero
  eyebrow="Funders & philanthropy"
  title="Keep It Running"
  lede="Three hundred seats, ten directors, every last Tuesday — none of it is free. Your support keeps the screen lit, the venue booked, and the doors open to filmmakers who’d never get this shot otherwise."
  logo
  card={
    <div className="card">
      <span className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.2em] text-label">
        Give Today
      </span>
      <p className="mt-4 font-credits text-[1rem] leading-relaxed text-muted">
        Every dollar goes straight to access — venue, gear, and filmmaker
        stipends.
      </p>
      <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6 w-full">
        Donate Now ›
      </a>
      <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
        Tax-deductible via Shunpike 501(c)(3)
      </p>
    </div>
  }
/>
```

- [ ] **Step 2: Replace every inline section eyebrow with `<SectionEyebrow>`**

In sections (b), (d): replace the `<div className="flex items-center gap-3">…</div>` eyebrow block with `<SectionEyebrow label="Giving levels" />` / `<SectionEyebrow label="Partner with us" />`.

In section (e) (the partner block, lines 203–209) replace the symmetric eyebrow with `<SectionEyebrow label="Our funders & partners" centered />` (keeps it centered but via the shared component — this fixes the one-off symmetric markup).

- [ ] **Step 3: Migrate buttons to utilities**

- Tier card "Give ›" links (line 109–116) → `className="btn-link mt-5"`.
- "Talk to us ›" / "Get the deck ›" mailto links → `className="btn-link mt-5 inline-block"`.

- [ ] **Step 4: Replace the closing band (lines 213–234) with `<ClosingBand>`**

```tsx
<ClosingBand
  title="Keep The Screen Lit"
  body="Any amount keeps a filmmaker’s work on a big screen in front of a full house. Give once, give monthly, or back the whole season."
  href={DONATE_URL}
  cta="Donate Now ›"
  variant="secondary"
/>
```

- [ ] **Step 5: Update imports**

Top of file — remove now-unused `KineticText`/`Reveal`/`Hoverable` only if no longer referenced; add:

```tsx
import { PageHero } from "@/components/page-hero";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { ClosingBand } from "@/components/closing-band";
```

- [ ] **Step 6: Verify build, lint, and render**

Run: `npm run build && npm run lint`
Expected: both pass, no unused-import warnings.
Then `npm run dev`, open `/support`, confirm: logo above eyebrow, give card uses `.card`, gold donate button, centered partner eyebrow, closing band renders. Toggle theme (House Lights) and confirm colors flip correctly.

- [ ] **Step 7: Commit**

```bash
git add app/support/page.tsx
git commit -m "refactor(support): migrate to PageHero/SectionEyebrow/ClosingBand + button utils

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Migrate /submit to shared components + add partner marquee

**Files:**
- Modify: `app/submit/page.tsx` (currently 237 lines — read it fully before editing)

**Interfaces:**
- Consumes: `PageHero`, `SectionEyebrow`, `ClosingBand`, `PartnersMarquee` (existing `components/partners-marquee.tsx`), `.btn-primary`, `.card`.

- [ ] **Step 1: Replace the inline hero (lines 22–85) with PageHero + the open-call card**

```tsx
<PageHero
  eyebrow="Open call · via FilmFreeway"
  title="Submit Your Film"
  lede="We’re built to put underrepresented filmmakers on a big screen in front of a packed, loving house. Twenty minutes or less, any genre. If it’s bold and it’s yours, send it."
  logo
  card={
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.2em] text-label">Open Call</span>
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted">2026 Season</span>
      </div>
      <p className="mt-5 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted">Regular deadline</p>
      <p className="font-display text-[2.75rem] uppercase leading-none text-fg">Aug 31</p>
      <div className="mt-5 flex gap-8 border-t border-hairline pt-4">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">Entry from</p>
          <p className="font-display text-[1.25rem] text-fg">$15</p>
        </div>
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">Runtime</p>
          <p className="font-display text-[1.25rem] text-fg">20 min or less</p>
        </div>
      </div>
      <a href={SUBMIT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 w-full">
        Submit on FilmFreeway ›
      </a>
    </div>
  }
/>
```

Note: the next section currently has `mt-16` (line 88) to clear the old hero; keep it.

- [ ] **Step 2: Replace section eyebrows (b/c/d) with `<SectionEyebrow label="…" />`**

Labels: "What we look for", "Deadlines & fees", "How to enter".

- [ ] **Step 3: Add the partner marquee before the closing band**

After section (d) `</section>` and before the closing band, insert:

```tsx
<section className="border-t border-hairline bg-bg px-5 py-24 md:shell-x">
  <SectionEyebrow label="Our festival partners" centered />
  <PartnersMarquee />
</section>
```

- [ ] **Step 4: Replace the closing band (lines 213–234) with `<ClosingBand>`**

```tsx
<ClosingBand
  title="Got A Film? Send It."
  body="Submissions run on FilmFreeway. It takes about ten minutes — and we read every single one."
  href={SUBMIT_URL}
  cta="Submit on FilmFreeway ›"
/>
```

- [ ] **Step 5: Update imports** (add PageHero, SectionEyebrow, ClosingBand, PartnersMarquee; drop now-unused ones).

- [ ] **Step 6: Verify build, lint, render**

Run: `npm run build && npm run lint`
Then `npm run dev`, open `/submit`: logo, primary-red FilmFreeway button, consistent eyebrows, partner marquee present, closing band. Check House Lights theme.

- [ ] **Step 7: Commit**

```bash
git add app/submit/page.tsx
git commit -m "refactor(submit): PageHero + shared eyebrow/band/buttons + partner marquee

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Migrate /about to shared components

**Files:**
- Modify: `app/about/page.tsx` (read fully before editing)

**Interfaces:**
- Consumes: `PageHero`, `SectionEyebrow`, gap tokens.

- [ ] **Step 1: Replace `<PageHeader …/>` with `<PageHero … logo />`**

Keep the existing eyebrow/title/lede text; add `logo`.

- [ ] **Step 2: Replace inline section eyebrows with `<SectionEyebrow label="…" />`** (the "What Is", "How We Got Here", "The Houses" sections).

- [ ] **Step 3: Normalize the Houses grid gap**

Set the houses grid to `gap-[var(--gap-card)]` (was `gap-6`) so it matches the 3-up rhythm used elsewhere.

- [ ] **Step 4: Update imports** (drop `PageHeader`, add `PageHero` + `SectionEyebrow`).

- [ ] **Step 5: Verify build, lint, render**

Run: `npm run build && npm run lint`
Then `npm run dev`, open `/about`: logo in header, consistent eyebrows, FounderBand/Timeline/Houses/PartnersMarquee intact.

- [ ] **Step 6: Commit**

```bash
git add app/about/page.tsx
git commit -m "refactor(about): migrate to PageHero + SectionEyebrow + gap rhythm

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Flesh out /schedule (it's a stub today)

**Files:**
- Modify: `app/schedule/page.tsx` (read fully — currently header + `<ScheduleSection headless />` only)

**Interfaces:**
- Consumes: `PageHero`, `SectionEyebrow`, `PartnersMarquee`, `ClosingBand`. Keeps `<ScheduleSection headless />` and the live schedule untouched.

- [ ] **Step 1: Replace `<PageHeader/>` with `<PageHero … logo />`** (keep existing eyebrow/title/lede).

- [ ] **Step 2: After `<ScheduleSection headless />`, add a partner marquee section**

```tsx
<section className="border-t border-hairline bg-bg px-5 py-24 md:shell-x">
  <SectionEyebrow label="In good company" centered />
  <PartnersMarquee />
</section>
```

- [ ] **Step 3: Add a closing band that points at tickets**

```tsx
<ClosingBand
  title="Get Your Seat"
  body="Seven nights, ten directors a night, one room that leans all the way in. Lock your spot before the house fills."
  href="/tickets"
  cta="Buy Tickets ›"
/>
```

Note: this `href` is internal — `ClosingBand` opens links in a new tab via `target="_blank"`; that's acceptable, but if an in-app nav is preferred, swap the anchor for a Next `<Link>` in `ClosingBand` when `href` starts with `/`. (Optional refinement; default behavior is fine.)

- [ ] **Step 4: Update imports; verify build, lint, render**

Run: `npm run build && npm run lint`
Then `npm run dev`, open `/schedule`: header with logo, schedule list, partner marquee, closing band — no longer a stub.

- [ ] **Step 5: Commit**

```bash
git add app/schedule/page.tsx
git commit -m "feat(schedule): flesh out page with PageHero, partners, closing band

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Flesh out /tickets + share prop shadow/grain

**Files:**
- Modify: `app/tickets/page.tsx` (read fully — currently header + `<BuyTickets headless />`)
- Modify: `components/buy-tickets.tsx` (read fully — swap the three hand-tuned drop-shadows for `.shadow-prop`; do NOT change purchase wiring)

**Interfaces:**
- Consumes: `PageHero`, `SectionEyebrow`, `PartnersMarquee`, `ClosingBand`, `.shadow-prop`.

- [ ] **Step 1: Replace `<PageHeader/>` with `<PageHero … logo />`** on the tickets page (keep existing text).

- [ ] **Step 2: Add a "why a season pass" supporting section** between the header and `<BuyTickets headless />`:

```tsx
<section className="border-t border-hairline bg-bg-alt px-5 py-24 md:shell-x">
  <SectionEyebrow label="Why a season pass" />
  <KineticText as="h2" className="pulp mt-5 font-display text-[2.75rem] uppercase leading-[0.95] md:text-[4rem]" text="One Pass, Every Night" />
  <p className="mt-5 max-w-[60ch] font-credits text-[1.125rem] leading-relaxed text-fg/80">
    A season pass is the cheapest seat in the house and the only one that holds your spot for all seven nights — plus first claim on the after-parties and the front-row block.
  </p>
</section>
```
(Add `KineticText` to imports.)

- [ ] **Step 3: After `<BuyTickets headless />`, add partner marquee + closing band**

```tsx
<section className="border-t border-hairline bg-bg px-5 py-24 md:shell-x">
  <SectionEyebrow label="Presented with" centered />
  <PartnersMarquee />
</section>
<ClosingBand
  title="See You In The Dark"
  body="Doors at 6:30, screen at 7:30. Grab a pass and we’ll save you a seat."
  href="/schedule"
  cta="View The Schedule ›"
/>
```

- [ ] **Step 4: Share the prop shadow in buy-tickets.tsx**

In `components/buy-tickets.tsx`, replace each hand-tuned `[filter:drop-shadow(...)]` on the ticket and lanyard wrappers with `shadow-prop`. Leave the existing grain overlay on the ticket; if the lanyard lacks grain, that's fine — do not add new markup beyond the shadow swap.

- [ ] **Step 5: Verify build, lint, render**

Run: `npm run build && npm run lint`
Then `npm run dev`, open `/tickets`: header with logo, "why a season pass" section, ticket + lanyard with the shared shadow, partner marquee, closing band. Confirm the **Buy Tickets / reserve flow still works** (click through to checkout) — purchase wiring must be unchanged.

- [ ] **Step 6: Commit**

```bash
git add app/tickets/page.tsx components/buy-tickets.tsx
git commit -m "feat(tickets): flesh out page + share prop shadow utility

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Remove PageHeader and final sweep

**Files:**
- Delete: `components/page-header.tsx`
- Verify: `grep -rn "PageHeader" app components` returns nothing.

- [ ] **Step 1: Confirm no remaining references**

Run: `grep -rn "page-header\|PageHeader" app components`
Expected: no results. If any remain, migrate them to `PageHero` first.

- [ ] **Step 2: Delete the file**

```bash
git rm components/page-header.tsx
```

- [ ] **Step 3: Full verification**

Run: `npm run build && npm run lint && npm run test`
Expected: all pass.
Then `npm run dev` and click through `/`, `/about`, `/schedule`, `/tickets`, `/submit`, `/support` in both Movie Mode and House Lights — confirm consistent eyebrows, buttons, logo presence, partner marquee, and closing bands; no console errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(ui): remove PageHeader (superseded by PageHero)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Notes (author)

- **Spec coverage:** buttons/shadows/cards/gaps (Task 1) ✓; PageHero replacing PageHeader + custom heroes (Task 3, used Tasks 5–9) ✓; one eyebrow rule + fix /support symmetric (Tasks 2, 5) ✓; logo+Aachen on every page (PageHero `logo`, existing `font-display`) ✓; reel poster slot (PageHero `media`) ✓ available; grain/prop-shadow shared (Task 9) ✓; partner marquee identical across all five pages (Tasks 5–9 all use `<PartnersMarquee />` + `SectionEyebrow centered`) ✓; flesh out stub /schedule & /tickets (Tasks 8, 9) ✓; spotlight stays hero-only (not added) ✓.
- **Off-limits:** purchase/live-schedule wiring untouched; only `.shadow-prop` swap in buy-tickets (Task 9) ✓.
- **Carry-over to Plan B:** the literal copy embedded in these components becomes the `festival.ts` fallback when CMS is wired — Plan B replaces hardcoded strings with `cms ?? festival` without changing structure.
