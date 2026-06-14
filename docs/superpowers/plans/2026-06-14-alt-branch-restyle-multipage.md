# ALT Branch — Artboard Restyle + Multi-Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the `ALT` branch, port the visual styling of Paper artboards `70Y-0` (light) + `8JY-0` (dark) into the existing theme system, and convert the single-page site into a multi-page site with dedicated routes for every nav item except Watch — without changing section order, the valance/nav design, or fonts.

**Architecture:** Persistent chrome (valance, nav, footer, grain) moves into the root layout so every route renders it identically. The homepage stays the full one-pager (hero is home-only). Four new App Router pages (`/schedule`, `/submit`, `/about`, `/support`) reuse existing section components and add page-specific blocks built from the dedicated Paper artboards. Styling reuses the existing `:root[data-theme]` token system; the artboards' signature gold + red accent bands are added to the films + founder sections in both modes.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, Tailwind CSS v4 (`@theme` tokens in `app/globals.css`), TypeScript, Vitest. Paper MCP for artboard reference screenshots.

---

## Reference artboards (for screenshot verification during build)

| Page | Light artboard | Dark artboard |
|---|---|---|
| Home `/` | `70Y-0` | `8JY-0` |
| About `/about` | (dark only) `1JG-0` | `1JG-0` |
| Submit `/submit` | (dark only) `1F5-0` | `1F5-0` |
| Support `/support` | (dark only) `3F6-0` | `3F6-0` |

The dedicated page artboards are authored in dark/Movie Mode only. Build the page, then theme-flip it using the existing semantic tokens (don't hard-code dark hex — use `bg-bg`, `text-fg`, `text-muted`, `border-hairline`, `text-label`, `.pulp` for headings, `bg-curtain`/`bg-rust` for bands). Verify both modes look right.

## Conventions (read before any task)

- **Semantic tokens flip; brand tokens don't.** Grounds/text/borders use `bg-bg` `bg-bg-alt` `bg-card` `text-fg` `text-muted` `border-hairline` `text-label` `text-heading`. Brand constants `bg-curtain` (red) `bg-rust` (gold) `text-cream` `text-ink` never flip — use them for the accent bands and always pair with explicit text color (`text-cream` on red, `text-ink` on gold).
- **Display headings** use `className="pulp font-display ..."` (gold/red fill + extrude, already theme-aware).
- **Eyebrows** match the existing `ChapterLabel` pattern: `font-mono text-[12px] uppercase tracking-[0.3em] text-label` with a `h-px w-10 bg-curtain` rule.
- **Fonts:** only `font-display` `font-marquee` `font-credits`/`font-serif` `font-body` `font-mono`. No new fonts.
- **No chrome in pages.** After Task 1, NO page renders `PersistentValance`, `SiteNav`, or `SiteFooter` — those are global.
- **Sub-page top spacer:** every non-home page wraps content so the first element clears the fixed valance+nav. Use a leading `<div className="h-[120px] md:h-[132px]" aria-hidden />` or `pt-[120px] md:pt-[132px]` on the page root.
- **Commit after every task.** Conventional commit messages, ending with the Co-Authored-By trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Verification baseline for every task:** `npm run build` (typecheck+compile) and `npm run lint` must pass; `npm test` (vitest) must stay green. Pure-visual tasks add a Paper artboard screenshot + a dev-server screenshot comparison instead of unit tests (this is presentational code; the only unit test added is the nav-active helper in Task 2).

---

## File structure

**Created:**
- `app/schedule/page.tsx` — Schedule route
- `app/submit/page.tsx` — Submit route
- `app/about/page.tsx` — About route
- `app/support/page.tsx` — Support route
- `components/page-header.tsx` — shared sub-page header (eyebrow + display heading + lede + top spacer)
- `lib/festival.test.ts` — (only if needed) shape guard for new constants — optional, skip if trivial
- `components/site-nav.test.ts` — unit test for `navActiveFor`

**Modified:**
- `app/layout.tsx` — mount global chrome (valance, nav, footer)
- `app/page.tsx` — remove chrome; add gold/red bands; keep order
- `components/site-nav.tsx` — route links + `navActiveFor(pathname)` + `usePathname`
- `components/curtain-credits-hero.tsx` — retarget `CREDITS` to routes
- `lib/festival.ts` — add `HOUSES`, `TIMELINE`, `SUBMISSION_ROUNDS`, `SUBMIT_CRITERIA`, `SUBMIT_STEPS`, `GIVING_LEVELS`, `SUPPORT_STATS`, `ABOUT_STATS` typed constants

---

## Task 1: Move persistent chrome into the root layout

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Add chrome to the layout**

In `app/layout.tsx`, import the chrome and mount it inside `ThemeProvider` (valance + nav need the theme context; footer is a server component but renders fine here). Result body:

```tsx
import { PersistentValance } from "@/components/persistent-valance";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
// ...existing imports...

      <body className="min-h-screen bg-bg text-fg">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <GrainOverlay />
          <PersistentValance />
          <SiteNav />
          <CheckoutProvider>{children}</CheckoutProvider>
          <SiteFooter />
        </ThemeProvider>
      </body>
```

- [ ] **Step 2: Remove chrome from the homepage**

In `app/page.tsx`, delete the `PersistentValance`, `SiteNav`, and `SiteFooter` imports and their JSX usages (lines mounting `<PersistentValance />`, `<SiteNav active="Watch" />`, and the trailing `<SiteFooter />`). Keep `<ScrollControl />`, `<CurtainCreditsHero />`, `<Marquee />` and all content sections.

- [ ] **Step 3: Verify build + lint + tests**

Run: `npm run build && npm run lint && npm test`
Expected: all pass, no unused-import errors.

- [ ] **Step 4: Visual check**

Run `npm run dev`, open `/`. Expected: valance + nav + footer still present and unchanged; hero unaffected.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "refactor: hoist valance/nav/footer into root layout for multi-page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Convert nav to route links + path-based active state

**Files:**
- Modify: `components/site-nav.tsx`
- Modify: `components/curtain-credits-hero.tsx`
- Test: `components/site-nav.test.ts`

- [ ] **Step 1: Write the failing test for the active helper**

Create `components/site-nav.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { navHrefFor, navActiveFor } from "./site-nav";

describe("nav routing helpers", () => {
  it("maps Watch to home and others to slugs", () => {
    expect(navHrefFor("Watch")).toBe("/");
    expect(navHrefFor("Schedule")).toBe("/schedule");
    expect(navHrefFor("Support")).toBe("/support");
  });
  it("derives active item from pathname", () => {
    expect(navActiveFor("/")).toBe("Watch");
    expect(navActiveFor("/schedule")).toBe("Schedule");
    expect(navActiveFor("/about")).toBe("About");
    expect(navActiveFor("/unknown")).toBe("Watch");
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `npm test -- site-nav`
Expected: FAIL (`navHrefFor`/`navActiveFor` not exported).

- [ ] **Step 3: Implement the helpers + route links in `site-nav.tsx`**

Add exported pure helpers and switch the component to `usePathname()` (drop the `active` prop). Use Next `Link`. Keep all existing classes/markup/structure identical — only the `href` source and active derivation change.

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/festival";
import { ThemeToggle } from "./theme-toggle";

export function navHrefFor(item: string) {
  return item === "Watch" ? "/" : `/${item.toLowerCase()}`;
}
export function navActiveFor(pathname: string): string {
  const hit = NAV_ITEMS.find((i) => navHrefFor(i) === pathname);
  return hit ?? "Watch";
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const active = navActiveFor(usePathname());
  // ...unchanged markup, but replace every <a href={hrefFor(item)}> with
  //    <Link href={navHrefFor(item)} ...> and the logo <a href="/"> with <Link href="/">.
  //    The "Get Tickets" pill stays href="/#tickets" (anchors the home tickets section).
}
```

Replace the local `hrefFor` and the `{ active = "Watch" }` prop. The "Get Tickets" pill becomes `<Link href="/#tickets">`.

- [ ] **Step 4: Retarget the hero credits menu**

In `components/curtain-credits-hero.tsx`, update the `CREDITS` array hrefs to routes: Buy Tickets→`/#tickets`, Submit Your Film→`/submit`, The Films→`/schedule`, Become a Funder→`/support`, Press & Media→`/support`, About the Festival→`/about`. (Keep labels/styling; only hrefs change. Use `<Link>` if these are anchors — leave the existing element type, just fix the href values.)

- [ ] **Step 5: Run tests + build + lint**

Run: `npm test -- site-nav && npm run build && npm run lint`
Expected: nav test PASS; build/lint pass.

- [ ] **Step 6: Commit**

```bash
git add components/site-nav.tsx components/site-nav.test.ts components/curtain-credits-hero.tsx
git commit -m "feat: nav routes to pages with path-based active state

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Add page data constants to `lib/festival.ts`

**Files:**
- Modify: `lib/festival.ts`

- [ ] **Step 1: Append typed constants**

Add at the end of `lib/festival.ts`. Copy values from the artboards (verbatim where shown):

```ts
// --- About page ---
export const ABOUT_STATS = [
  { n: "Last Tue", l: "Monthly · June–December" },
  { n: "~300", l: "In the room each night" },
  { n: "10", l: "Directors a night" },
  { n: "≤20 min", l: "Every film, every genre" },
] as const;

export interface TimelineEntry { year: string; title: string; blurb: string; }
export const TIMELINE: TimelineEntry[] = [
  { year: "2022", title: "It starts in June", blurb: "Lex Scope launches Scope Screenings in Seattle — one night, a handful of directors, and a simple idea: get overlooked filmmakers onto a real screen, in front of a real crowd." },
  { year: "2023–24", title: "Word gets out", blurb: "Monthly screenings start packing the Langston Hughes Institute. The lineup grows to 200+ films from 150+ filmmakers across 20+ nights and six-plus theaters around the city." },
  { year: "2025", title: "A seat at the table", blurb: "Lex Scope is appointed to the Seattle Film Commission — carrying the same fight for access into the rooms where the city's film policy gets made." },
  { year: "2026", title: "Where we are now", blurb: "Seven nights a season, June through December, still the last Tuesday of every month — and still putting the fun back in film fests." },
];

export interface House { name: string; eyebrow: string; address: string; blurb: string; }
export const HOUSES: House[] = [
  { name: "Langston Hughes Institute", eyebrow: "Home venue", address: "104 17th Ave S, Seattle 98144", blurb: "Our monthly home in the Central District." },
  { name: "Majestic Bay Theatres", eyebrow: "Also screens at", address: "2044 NW Market St, Ballard", blurb: "Special nights and season finales on the big house screen." },
  { name: "SIFF Cinema Egyptian", eyebrow: "Also screens at", address: "805 E Pine St, Capitol Hill", blurb: "A historic landmark house for our marquee screenings." },
];

// --- Submit page ---
export interface SubmissionRound { name: string; closes: string; fee: string; }
export const SUBMISSION_ROUNDS: SubmissionRound[] = [
  { name: "Early Bird", closes: "Closes June 30, 2026", fee: "$15" },
  { name: "Regular", closes: "Closes August 31, 2026", fee: "$25" },
  { name: "Late", closes: "Closes September 30, 2026", fee: "$35" },
  { name: "Extended", closes: "Closes October 15, 2026", fee: "$40" },
];
export const SUBMIT_CRITERIA = [
  { n: "01", title: "A point of view", blurb: "We'll take a rough film with a real voice over a polished one with nothing to say. Show us how you see." },
  { n: "02", title: "Twenty minutes, max", blurb: "Shorts, music videos, trailers, docs, animation, experiments, skits. Any genre — just make every minute count." },
  { n: "03", title: "Made by you", blurb: "We prioritize PNW and underrepresented filmmakers. First-timers and new names are exactly who we're here for." },
] as const;
export const SUBMIT_STEPS = [
  { n: "1", title: "Cut it to twenty", blurb: "Lock your film at twenty minutes or under and export a screener link or file you're proud of." },
  { n: "2", title: "Enter on FilmFreeway", blurb: "Add your title, synopsis, stills, and bio, then pay the entry fee — or request a waiver, no questions." },
  { n: "3", title: "Watch your inbox", blurb: "We watch every submission and reply to every filmmaker — programmed or not. Selections screen that season." },
] as const;

// --- Support page ---
export const SUPPORT_STATS = [
  { n: "$0", l: "Cost barrier", blurb: "Fee waivers keep submissions open to everyone. Your gift covers the gap." },
  { n: "300+", l: "Seats a night", blurb: "A full house every month means real audiences for first-time filmmakers." },
  { n: "100%", l: "To the work", blurb: "Every dollar goes to venue, gear, and filmmaker stipends — not overhead." },
] as const;
export interface GivingLevel { name: string; amount: string; cadence: string; perks: string[]; featured?: boolean; }
export const GIVING_LEVELS: GivingLevel[] = [
  { name: "Friend", amount: "$50", cadence: "once", perks: ["Name on the season funder wall", "Our eternal gratitude"] },
  { name: "Patron", amount: "$250", cadence: "once", perks: ["Two season passes, on us", "Name on the funder wall"] },
  { name: "Producer", amount: "$1,000", cadence: "once", perks: ["Reserved VIP table for four", "Logo on screen before each show"] },
  { name: "Title Partner", amount: "Custom", cadence: "season", perks: ["Presenting billing all season", "A named night + custom activation"], featured: true },
];
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run build`
Expected: PASS (new constants compile, no existing usage broken).

- [ ] **Step 3: Commit**

```bash
git add lib/festival.ts
git commit -m "feat: add About/Submit/Support page data constants

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Shared sub-page header component

**Files:**
- Create: `components/page-header.tsx`

- [ ] **Step 1: Create the component**

```tsx
export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
}) {
  return (
    <header className="px-5 pt-[120px] md:px-[90px] md:pt-[150px]">
      <div className="flex items-center gap-3">
        <span className="h-px w-10 bg-curtain" />
        <span className="font-mono text-[12px] font-bold uppercase tracking-[0.3em] text-label">
          {eyebrow}
        </span>
      </div>
      <h1 className="pulp mt-5 font-display text-[64px] uppercase leading-[0.9] md:text-[96px]">
        {title}
      </h1>
      {lede ? (
        <p className="mt-5 max-w-[42ch] font-credits text-[20px] leading-relaxed text-fg/75 md:text-[22px]">
          {lede}
        </p>
      ) : null}
    </header>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/page-header.tsx
git commit -m "feat: shared sub-page header (eyebrow + display heading + lede)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Homepage restyle — gold + red accent bands (both modes)

**Files:**
- Modify: `app/page.tsx`
- Reference artboards: `70Y-0` (light), `8JY-0` (dark)

- [ ] **Step 1: Red band on the founder section**

In `app/page.tsx`, the "Chapter Two — Built For Access" `<section>` currently uses neutral ground. Change its wrapper to the red brand band and flip text to cream, matching the artboard:
- Section wrapper: `bg-curtain text-cream` (replace the `border-t border-cream/10` neutral treatment; keep the flex layout + padding).
- Eyebrow rule + label: keep readable on red (`text-cream`, rule `bg-cream/40`).
- Founder credential frame: keep the existing gold-framed credential (it reads on red).
- Stats `text-rust` → keep gold numbers; labels `text-cream/70`.
- Heading: the `.pulp` heading on red should read white — set this heading to `text-cream` with `text-shadow` to the ink edge (override `.pulp` inline: `style={{ color: "var(--color-cream)", textShadow: "0.045em 0.06em 0 var(--color-ink)" }}` or add a `pulp-on-red` utility in `globals.css`). Verify against artboard.

- [ ] **Step 2: Add the `pulp-on-red` helper to globals.css**

In `app/globals.css`, after `.pulp`:

```css
/* Display heading sitting on the red brand band — white fill, ink extrude. */
.pulp-on-red {
  color: var(--color-cream);
  text-shadow: 0.045em 0.06em 0 var(--color-ink);
}
```

Use `className="pulp-on-red font-display ..."` for the founder heading instead of `pulp`.

- [ ] **Step 3: Gold band on the films/Archives section**

The "Chapter Four — The Archives" `<section id="films">` currently uses `bg-bg-alt`. Change to the gold brand band matching the artboard "THE PROGRAM":
- Section wrapper: `bg-rust text-ink` (replace `bg-bg-alt`; keep `id="films"`, `scroll-mt`, padding).
- Eyebrow + heading: ink on gold — heading uses `.pulp` overridden to ink fill, or add `.pulp-on-gold`:

```css
/* Display heading on the gold brand band — ink fill, oxblood extrude. */
.pulp-on-gold {
  color: var(--color-ink);
  text-shadow: 0.045em 0.06em 0 var(--color-curtain-deep);
}
```
- Lede/copy: `text-ink/70`. The "Browse all 200+ films" link: `text-ink` with `border-ink`, hover `text-curtain`.
- `Filmstrip` itself is a dark rail (`bg-ink`) and sits nicely inside the gold band — leave the component as-is.

- [ ] **Step 4: Token tightening to match artboards**

Compare `/` against `70Y-0` (House Lights mode) and `8JY-0` (Movie Mode). If the cream ground / muted tones differ, adjust `--color-bg` / `--color-muted` / `--color-hairline` in `app/globals.css` to match. (Current light bg `#f2ebd9` already matches the artboard cream — only adjust if the screenshot comparison shows drift.) Do NOT change fonts or section order.

- [ ] **Step 5: Verify both modes**

Run: `npm run build && npm run lint`. Then `npm run dev`, open `/`, toggle theme. Screenshot both modes; compare against `70Y-0` and `8JY-0` via Paper `get_screenshot`. Checklist: gold band on films, red band on founder, headings legible on bands, everything else flips cleanly.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: gold + red accent bands on homepage matching artboards

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `/schedule` page

**Files:**
- Create: `app/schedule/page.tsx`

The existing `ScheduleSection` is an async server component that fetches live Wix data and renders the "Seven Nights" calendar. Wrap it in a standalone page with the shared header + top spacer. No footer/nav (global).

- [ ] **Step 1: Create the page**

```tsx
import { PageHeader } from "@/components/page-header";
import { ScheduleSection } from "@/components/schedule-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule — Scope Screenings",
  description: "Seven nights a season — the last Tuesday of every month, June through December.",
};

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHeader
        eyebrow="The Season"
        title={<>Seven<br />Nights</>}
        lede="One night a month, last Tuesday, June through December. Doors 6:30, lights down 7:30."
      />
      <ScheduleSection />
    </main>
  );
}
```

If `ScheduleSection` renders its own heading that now duplicates the page header, pass a prop or trim — inspect the component first; prefer adding an optional `headless` prop to `ScheduleSection` (default false) that hides its internal heading lockup when rendered on the page. Keep the homepage usage unchanged.

- [ ] **Step 2: Verify**

Run: `npm run build && npm run lint && npm test`. Open `/schedule` in both modes. Confirm content clears the valance+nav, schedule rows render, Filmstrip's `/schedule` links now resolve.

- [ ] **Step 3: Commit**

```bash
git add app/schedule/page.tsx components/schedule-section.tsx
git commit -m "feat: standalone /schedule page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `/about` page  (reference artboard `1JG-0`)

**Files:**
- Create: `app/about/page.tsx`

Build the page section-by-section per the artboard. Data from `lib/festival.ts`: `FOUNDER`, `ABOUT_STATS`, `TIMELINE`, `HOUSES`. Reuse `PartnersMarquee`. Use semantic tokens so it flips; the founder block uses the **red band** (`bg-curtain text-cream`, `pulp-on-red`) like the homepage.

- [ ] **Step 1: Scaffold + header**

```tsx
import { PageHeader } from "@/components/page-header";
import { PartnersMarquee } from "@/components/partners-marquee";
import { FOUNDER, ABOUT_STATS, TIMELINE, HOUSES } from "@/lib/festival";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Scope Screenings",
  description: "Seattle's underground film festival — a live, monthly short-film night built for the filmmakers the industry tends to overlook.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg">
      <PageHeader
        eyebrow="About the Festival"
        title={<>We Put The Fun<br />Back In Film Fests</>}
        lede="Scope Screenings is Seattle's underground film festival — a live, monthly short-film night built for the filmmakers the industry tends to overlook. Tropical, wavy energy meets the illest shorts in the PNW."
      />
      {/* sections below */}
    </main>
  );
}
```

- [ ] **Step 2: "What is Scope Screenings" + stat row**

Two-column band on `bg-bg-alt`: left eyebrow "The short version" + `.pulp` heading "What Is Scope Screenings"; right two editorial `font-credits` paragraphs (founded June 2022, last Tuesday, Langston Hughes, 10 directors, ~300 people; mission to uplift Black/brown/tan creators). Below, a 4-up stat row from `ABOUT_STATS` — big `font-marquee text-rust` numbers, `font-mono` labels. (Match artboard `1JG-0` second section.)

- [ ] **Step 3: "Built For Access" founder block (red band)**

Reuse the homepage founder treatment: red band (`bg-curtain text-cream`), founder photo `/founder-lex.jpg` in the sprocket/credential frame on the left, "Built For Access" `pulp-on-red` heading, `FOUNDER_QUOTE`, name/title, and the 200+/150+/20+/6+ stat row (gold numbers). Lift the JSX pattern from `app/page.tsx` Chapter Two.

- [ ] **Step 4: Partners + "How We Got Here" timeline**

`<PartnersMarquee />`, then a `bg-bg` section: eyebrow "The story" + `.pulp` "How We Got Here", then `TIMELINE` rows — each row a big gold `font-marquee` year in a fixed-width left lane (`w-[160px] flexShrink:0`), bold `font-body` title + `font-credits` blurb on the right, divided by `border-hairline`. (Vertical-lane alignment: year column fixed width.)

- [ ] **Step 5: "The Houses" venues**

`bg-bg-alt` section: eyebrow "Where it happens" + `.pulp` "The Houses", then a 3-col grid of `bg-card border-hairline` cards from `HOUSES` — each: `font-mono text-label` eyebrow, `font-display` name, `font-body text-muted` address + blurb.

- [ ] **Step 6: Verify against artboard**

Run: `npm run build && npm run lint`. Open `/about` in both modes. `get_screenshot` of `1JG-0`; compare section order, copy, hierarchy, spacing. Run the get_guide Review Checkpoints mentally (spacing/type/contrast/alignment). Fix drift.

- [ ] **Step 7: Commit**

```bash
git add app/about/page.tsx
git commit -m "feat: /about page from artboard 1JG-0

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `/submit` page  (reference artboard `1F5-0`)

**Files:**
- Create: `app/submit/page.tsx`

Data: `SUBMISSION_ROUNDS`, `SUBMIT_CRITERIA`, `SUBMIT_STEPS`, `SUBMIT_URL`, `nextSubmissionDeadline`. All semantic-token themed (no band needed — the artboard is neutral grounds + red/gold accents).

- [ ] **Step 1: Scaffold + header + open-call card**

Header: eyebrow "Open call · via FilmFreeway", title "Submit Your Film", lede ("We're built to put underrepresented filmmakers on a big screen…"). Beside/below it, an open-call card (`bg-card border-hairline`): "OPEN CALL / 2026 SEASON", "Regular deadline" `font-display` "Aug 31", entry-from `$15` + runtime "20 min or less", and a `bg-curtain text-cream` "Submit on FilmFreeway ›" button → `SUBMIT_URL`.

- [ ] **Step 2: "What We're After" 3-up**

`bg-bg` section: eyebrow "What we look for" + `.pulp` "What We're After" + lede, then 3 columns from `SUBMIT_CRITERIA` — red `font-marquee` number, `font-display` title, `font-credits` blurb. Fixed-width number lane for alignment.

- [ ] **Step 3: "Mark Your Calendar" deadlines table**

`bg-bg-alt` section: eyebrow "Deadlines & fees" + `.pulp` "Mark Your Calendar", then a table from `SUBMISSION_ROUNDS` with columns ROUND / CLOSES / ENTRY FEE (right-aligned, gold fee on the first row to highlight early bird), `border-hairline` row rules + a waiver note ("Fee waivers are available — just reach out…") with a `bg-rust` square bullet.

- [ ] **Step 4: "Three Steps In" + final CTA**

`bg-bg` 3-up from `SUBMIT_STEPS` (big red `font-marquee` numerals). Then a centered closing band: `.pulp` "Got A Film? Send It." + subtext + `bg-curtain text-cream` "Submit on FilmFreeway ›" button.

- [ ] **Step 5: Verify against artboard**

Run: `npm run build && npm run lint`. Open `/submit` both modes; `get_screenshot` of `1F5-0`; compare. Fix drift.

- [ ] **Step 6: Commit**

```bash
git add app/submit/page.tsx
git commit -m "feat: /submit page from artboard 1F5-0

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: `/support` page  (reference artboard `3F6-0`)

**Files:**
- Create: `app/support/page.tsx`

Data: `SUPPORT_STATS`, `GIVING_LEVELS`, plus reuse `SupportPress` content/`PartnersMarquee`. Neutral grounds + gold "GIVE TODAY" / "DONATE NOW" accents per artboard.

- [ ] **Step 1: Scaffold + header + give card**

Header: eyebrow "Funders & philanthropy", title "Keep It Running", lede ("Three hundred seats, ten directors, every last Tuesday — none of it is free…"). Beside it a `bg-card border-hairline` give card: "GIVE TODAY", copy, `bg-rust text-ink` "Donate Now ›" button, "Tax-deductible via Shunpike 501(c)(3)" footnote.

- [ ] **Step 2: "Where It Goes" stats**

`bg-bg` section: eyebrow "Why give" + `.pulp` "Where It Goes" + lede, then 3-up from `SUPPORT_STATS` (gold `font-marquee` `$0`/`300+`/`100%`, `font-mono` label, `font-credits` blurb).

- [ ] **Step 3: "Pick Your Level" tiers**

`bg-bg-alt` section: eyebrow "Giving levels" + `.pulp` "Pick Your Level", then a 4-col grid from `GIVING_LEVELS` — each `bg-card border-hairline` card with `font-mono text-label` tier name, big `font-display` amount + `/cadence`, bulleted perks, and a `text-curtain` "Give ›" link. The `featured` tier (Title Partner) gets a `ring-1 ring-rust` highlight. Below: a `bg-card` 501(c)(3) note row.

- [ ] **Step 4: "Two Ways To Back Us" + partners + closing CTA**

Two-col (`bg-bg`): "Fund the Mission" / "Put Your Brand On It" cards (eyebrow + `font-display` title + `font-credits` blurb + `text-curtain` link). Then `<PartnersMarquee />` under eyebrow "Our funders & partners". Then centered closing band: `.pulp` "Keep The Screen Lit" + subtext + `bg-rust text-ink` "Donate Now ›".

- [ ] **Step 5: Verify against artboard**

Run: `npm run build && npm run lint`. Open `/support` both modes; `get_screenshot` of `3F6-0`; compare. Fix drift.

- [ ] **Step 6: Commit**

```bash
git add app/support/page.tsx
git commit -m "feat: /support page from artboard 3F6-0

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Final integration verification

**Files:** none (verification only)

- [ ] **Step 1: Full gate**

Run: `npm run build && npm run lint && npm test`
Expected: all green.

- [ ] **Step 2: Cross-route walk-through**

`npm run dev`. For each of `/`, `/schedule`, `/submit`, `/about`, `/support`:
- Valance + nav + footer render identically; nav active state correct.
- Toggle theme — both Movie Mode and House Lights look right; gold/red bands present where specified.
- Sub-page content clears the fixed chrome (no overlap under valance/nav).
- Internal links resolve: nav, hero credits, Filmstrip→/schedule, CTAs.

- [ ] **Step 3: Final commit (if any fixes)**

```bash
git add -A
git commit -m "chore: final integration fixes for ALT multi-page restyle

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review notes (author)

- **Spec coverage:** shared chrome (T1), nav routing (T2), data (T3), header (T4), homepage bands/restyle (T5), `/schedule` (T6), `/about` (T7), `/submit` (T8), `/support` (T9), verification (T10). All spec sections mapped.
- **Parallelism:** T6–T9 are independent files and can be built by parallel subagents after T1–T5 land. T1→T2→T5 are sequential (chrome → nav → homepage). T3/T4 can land anytime before T6–T9.
- **Risk:** hero coupling — T1 keeps hero/ScrollControl home-only, untouched. Theme flip on dedicated pages relies on semantic tokens, not hard-coded dark hex — enforced in Conventions.
