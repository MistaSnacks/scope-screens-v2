# ALT V2 — Wix CMS Port Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** Plan A (`2026-06-24-alt-design-system-deslopify.md`) is complete — pages already use `PageHero`, `SectionEyebrow`, `ClosingBand`, and shared components. This plan wires CMS data into those clean components without changing their structure.

**Goal:** Give non-technical editors full Wix control of all ALT page copy, plus page-level and nav-item visibility toggles, with a fail-safe fallback to `lib/festival.ts` whenever Wix is unreachable.

**Architecture:** Port Main's anonymous-visitor-token transport layer verbatim, extend the `site-content.ts` aggregator with ALT-specific collections, and convert each page to an async server component that reads `getSiteContent()` and null-coalesces every field to its `festival.ts` constant. Page/nav visibility comes from a CMS `Nav` collection + per-page `hidden` flags consumed by the persistent nav and each route.

**Tech Stack:** Next.js 16 App Router (RSC, ISR `revalidate: 3600`), Wix Headless Data Collections via REST (`wix-data/v2/items/query`), anonymous OAuth visitor token. Wix-side collection creation via the Wix MCP tools. Verify with `npm run build`, `npm run lint`, `npm run test` (vitest).

## Global Constraints

- **Fail-safe contract:** every CMS read returns `null` on any miss (no token, fetch error, empty set). Every consumer null-coalesces to a `lib/festival.ts` constant. With `WIX_CLIENT_ID` unset, the site MUST render identically to the end of Plan A.
- **Off-limits:** do NOT route schedule dates or ticket purchasing through CMS. `lib/wix-events.ts` (live schedule) and `lib/wix-checkout.ts` (reservations/payment) are unchanged. CMS governs only the surrounding copy (eyebrows/titles/ledes/closing bands/tier descriptions).
- **Env:** only `WIX_CLIENT_ID` (already in `.env`, same value as Main: `d49ee4f0-0d17-4823-99c0-420ec5ca27ed`). No new env vars.
- **Wix site:** site id `5e0eaedc-6847-4c06-bb37-34cb6ff143b5`. New collections must have read permission set to **"Anyone"** (visitor-token readable). Reuse existing collections where they already exist on the site.
- **Media:** all image/video fields pass through `wixImageUrl()` / `wixVideoUrl()` and fall back to a local `/public` asset.
- Commit after every task. Branch `ALT`. Co-author trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Port the transport layer + media converters (with unit tests)

**Files:**
- Create: `lib/wix-token.ts`, `lib/wix-cms.ts`, `lib/wix-media.ts`, `lib/wix-video.ts` (copy from `main` via `git show main:<path>`)
- Create: `lib/wix-media.test.ts`

**Interfaces:**
- Produces: `getVisitorToken(): Promise<string|null>`; `queryCollection<T>(id, opts?): Promise<T[]|null>`; `getSingleton<T>(id): Promise<T|null>`; `wixImageUrl(v?): string|null`; `wixVideoUrl(v?): string|null`.

- [ ] **Step 1: Copy the four files from main verbatim**

```bash
git show main:lib/wix-token.ts > lib/wix-token.ts
git show main:lib/wix-cms.ts   > lib/wix-cms.ts
git show main:lib/wix-media.ts > lib/wix-media.ts
git show main:lib/wix-video.ts > lib/wix-video.ts
```

(If a path differs on main, run `git ls-tree -r main --name-only | grep wix` to locate it. The converters may live inside `lib/wix-cms.ts` on main — if so, keep them there and skip creating separate `wix-media.ts`/`wix-video.ts`, adjusting imports in later tasks accordingly.)

- [ ] **Step 2: Write the failing converter tests**

```ts
// lib/wix-media.test.ts
import { describe, it, expect } from "vitest";
import { wixImageUrl } from "./wix-media";
import { wixVideoUrl } from "./wix-video";

describe("wixImageUrl", () => {
  it("converts a wix:image URI to a static URL", () => {
    expect(wixImageUrl("wix:image://v1/abc123~mv2.jpg")).toBe(
      "https://static.wixstatic.com/media/abc123~mv2.jpg",
    );
  });
  it("passes http(s) URLs through untouched", () => {
    expect(wixImageUrl("https://x.com/a.jpg")).toBe("https://x.com/a.jpg");
  });
  it("returns null for empty/unrecognized input", () => {
    expect(wixImageUrl("")).toBeNull();
    expect(wixImageUrl(undefined)).toBeNull();
  });
});

describe("wixVideoUrl", () => {
  it("converts a wix:video URI to a 1080p mp4 URL", () => {
    expect(wixVideoUrl("wix:video://v1/vid987/")).toBe(
      "https://video.wixstatic.com/video/vid987/1080p/mp4/file.mp4",
    );
  });
  it("returns null for empty input", () => {
    expect(wixVideoUrl(undefined)).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to confirm they pass against the copied converters**

Run: `npm run test -- lib/wix-media.test.ts`
Expected: PASS. (If a regex on the real converter expects exact `~mv2` formatting, align the test's sample URI to the converter's regex — the converter is the source of truth; adjust the expected string to match the copied implementation.)

- [ ] **Step 4: Commit**

```bash
git add lib/wix-token.ts lib/wix-cms.ts lib/wix-media.ts lib/wix-video.ts lib/wix-media.test.ts
git commit -m "feat(cms): port Wix transport layer + media converters from main

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Create + seed the new Wix collections

**Files:** none in-repo (Wix-side). Use the Wix MCP tools (`mcp__wix__*`). This is an external, manual-ish task — do it with the Wix MCP and verify by querying.

**Interfaces:**
- Produces (Wix collections, read = "Anyone"):
  - **Per-page singletons** `AboutPage`, `SchedulePage`, `TicketsPage`, `SubmitPage`, `SupportPage` — fields: `eyebrow`(Text), `title`(Text), `lede`(Text), `closingTitle`(Text), `closingBody`(Text), `closingCta`(Text), `closingHref`(URL/Text), `hidden`(Boolean).
  - **`Nav`** — fields: `label`(Text), `href`(Text), `order`(Number), `hidden`(Boolean).
  - **`Houses`** — `name`,`neighborhood`,`blurb`(Text), `order`(Number).
  - **`Timeline`** — `year`(Text), `event`(Text), `order`(Number).
  - **`TicketTiers`** — `name`(Text), `price`(Text), `cadence`(Text), `perks`(Text, newline-separated), `featured`(Boolean), `order`(Number). (Copy/labels only — purchase wiring stays in code.)
  - **`SubmitCriteria`** — `n`(Text), `title`(Text), `blurb`(Text), `order`(Number).
  - **`SubmitSteps`** — `n`(Text), `title`(Text), `blurb`(Text), `order`(Number).
  - **`SubmitDeadlines`** — `name`(Text), `closes`(Text), `fee`(Text), `order`(Number).

- [ ] **Step 1: Confirm which collections already exist**

Use the Wix MCP to list collections on site `5e0eaedc-6847-4c06-bb37-34cb6ff143b5`. The reused set (`Hero`, `BuiltForAccess`, `Partners`, `Marquee`, `Socials`, `GivingTiers`, `Submissions`, `Support`, `Footer`, `SiteSettings`) should already exist. Only create the ones missing.

- [ ] **Step 2: Create the new collections + fields with the exact schema above.** Set read permission to "Anyone" on each.

- [ ] **Step 3: Seed each collection from the current `festival.ts` values** (so editors start from real content, not blanks). For each per-page singleton, copy the eyebrow/title/lede/closing strings that Plan A embedded in the page component. Leave every `hidden` unchecked (= shown). Seed `Nav` from the current nav order: Watch(/), Tickets(/tickets), Schedule(/schedule), Submit(/submit), About(/about), Support(/support).

- [ ] **Step 4: Verify a query returns data**

Add a one-off check (or use the MCP query tool): query `AboutPage` and `Nav` and confirm non-empty results with the expected fields.

- [ ] **Step 5: No repo commit** (Wix-side only). Note completion in the task tracker.

---

### Task 3: Extend the site-content aggregator + types

**Files:**
- Create: `lib/site-content.ts` (port main's, then extend)

**Interfaces:**
- Consumes: `queryCollection`, `getSingleton`.
- Produces: `getSiteContent(): Promise<SiteContent>` where `SiteContent` adds the ALT fields below to main's shape: `aboutPage`, `schedulePage`, `ticketsPage`, `submitPage`, `supportPage` (each `PageCopy | null`), `nav` (`NavItem[] | null`), `houses`, `timeline`, `ticketTiers`, `submitCriteria`, `submitSteps`, `submitDeadlines` (each `T[] | null`).

- [ ] **Step 1: Port main's aggregator**

```bash
git show main:lib/site-content.ts > lib/site-content.ts
```

- [ ] **Step 2: Add the ALT types**

Append to `lib/site-content.ts`:

```ts
export interface PageCopy {
  eyebrow?: string; title?: string; lede?: string;
  closingTitle?: string; closingBody?: string; closingCta?: string; closingHref?: string;
  hidden?: boolean;
}
export interface NavItem { label?: string; href?: string; order?: number; hidden?: boolean; }
export interface CmsHouse { name?: string; neighborhood?: string; blurb?: string; order?: number; }
export interface CmsTimeline { year?: string; event?: string; order?: number; }
export interface CmsTicketTier { name?: string; price?: string; cadence?: string; perks?: string; featured?: boolean; order?: number; }
export interface CmsNumbered { n?: string; title?: string; blurb?: string; order?: number; }
export interface CmsDeadline { name?: string; closes?: string; fee?: string; order?: number; }
```

- [ ] **Step 3: Read the new collections inside `getSiteContent` and add them to the returned object**

Inside the existing `Promise.all`, add reads (mirroring the existing `byOrder` sort pattern already in the file):

```ts
const [
  /* …existing reads… */
  aboutPage, schedulePage, ticketsPage, submitPage, supportPage,
  nav, houses, timeline, ticketTiers, submitCriteria, submitSteps, submitDeadlines,
] = await Promise.all([
  /* …existing… */
  getSingleton<PageCopy>("AboutPage"),
  getSingleton<PageCopy>("SchedulePage"),
  getSingleton<PageCopy>("TicketsPage"),
  getSingleton<PageCopy>("SubmitPage"),
  getSingleton<PageCopy>("SupportPage"),
  queryCollection<NavItem>("Nav", { sort: [{ fieldName: "order", order: "ASC" }] }),
  queryCollection<CmsHouse>("Houses", { sort: [{ fieldName: "order", order: "ASC" }] }),
  queryCollection<CmsTimeline>("Timeline", { sort: [{ fieldName: "order", order: "ASC" }] }),
  queryCollection<CmsTicketTier>("TicketTiers", { sort: [{ fieldName: "order", order: "ASC" }] }),
  queryCollection<CmsNumbered>("SubmitCriteria", { sort: [{ fieldName: "order", order: "ASC" }] }),
  queryCollection<CmsNumbered>("SubmitSteps", { sort: [{ fieldName: "order", order: "ASC" }] }),
  queryCollection<CmsDeadline>("SubmitDeadlines", { sort: [{ fieldName: "order", order: "ASC" }] }),
]);

return {
  /* …existing fields… */
  aboutPage, schedulePage, ticketsPage, submitPage, supportPage,
  nav, houses, timeline, ticketTiers, submitCriteria, submitSteps, submitDeadlines,
};
```

Add each new field to the `SiteContent` interface as `T | null` / `T[] | null`.

- [ ] **Step 4: Verify build + that fallback holds with no token**

Run: `WIX_CLIENT_ID= npm run build`
Expected: build succeeds; aggregator returns nulls (no throw).

- [ ] **Step 5: Commit**

```bash
git add lib/site-content.ts
git commit -m "feat(cms): extend site-content aggregator with ALT page + list collections

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: CMS-driven nav + page-visibility helper

**Files:**
- Create: `lib/nav.ts`
- Modify: the persistent nav component (find it: `grep -rln "NAV_ITEMS" app components` — likely `components/persistent-valance.tsx` or `components/site-nav.tsx`)

**Interfaces:**
- Consumes: `getSiteContent()`, `NavItem`, `festival.ts` `NAV_ITEMS`.
- Produces: `getNav(): Promise<{label:string;href:string}[]>` (CMS nav minus hidden, sorted; falls back to `NAV_ITEMS`); `isPageHidden(content, key): boolean` where `key ∈ "about"|"schedule"|"tickets"|"submit"|"support"`.

- [ ] **Step 1: Create `lib/nav.ts`**

```ts
// lib/nav.ts
import { getSiteContent, type SiteContent, type PageCopy } from "./site-content";
import { NAV_ITEMS } from "./festival";

export async function getNav(): Promise<{ label: string; href: string }[]> {
  const content = await getSiteContent();
  const cms = content.nav
    ?.filter((n) => n.hidden !== true && n.label && n.href)
    .map((n) => ({ label: n.label!, href: n.href! }));
  return cms && cms.length ? cms : NAV_ITEMS;
}

const PAGE_KEYS = {
  about: "aboutPage", schedule: "schedulePage", tickets: "ticketsPage",
  submit: "submitPage", support: "supportPage",
} as const;

export function isPageHidden(
  content: SiteContent,
  key: keyof typeof PAGE_KEYS,
): boolean {
  const page = content[PAGE_KEYS[key]] as PageCopy | null;
  return page?.hidden === true;
}
```

Note: confirm `NAV_ITEMS` in `lib/festival.ts` is (or is mapped to) `{label, href}[]`. If it is a string array, add a small local map from label → href so `getNav`'s fallback returns the same shape.

- [ ] **Step 2: Make the persistent nav async and source from `getNav()`**

In the nav component, replace the hardcoded `NAV_ITEMS` map with `const items = await getNav();` (make the component an async server component if it isn't already; if it's a client component, lift the data fetch to its parent and pass `items` as a prop).

- [ ] **Step 3: Verify build, lint, render (CMS-off and on)**

Run: `WIX_CLIENT_ID= npm run build && npm run lint`
Expected: nav falls back to `NAV_ITEMS`, renders unchanged.
Then with the real token, `npm run dev`: hide a `Nav` row in Wix → after revalidate, that item drops from the menu; reorder → menu reorders.

- [ ] **Step 4: Commit**

```bash
git add lib/nav.ts components/<nav-file>.tsx
git commit -m "feat(cms): CMS-driven nav + page-visibility helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Wire /about + /support copy to CMS

**Files:**
- Modify: `app/about/page.tsx`, `app/support/page.tsx`

**Interfaces:**
- Consumes: `getSiteContent`, `isPageHidden`, `wixImageUrl`, existing `festival.ts` constants (`FOUNDER`, `HOUSES`, `TIMELINE`, `GIVING_LEVELS`, `DONATE_URL`).

- [ ] **Step 1: Make each page an async server component and load content + visibility**

At the top of each default export:

```tsx
import { notFound } from "next/navigation";
const content = await getSiteContent();
if (isPageHidden(content, "about")) notFound(); // "support" on the support page
const page = content.aboutPage; // content.supportPage on support
```

- [ ] **Step 2: Replace the `PageHero` literal props with CMS-with-fallback**

```tsx
<PageHero
  eyebrow={page?.eyebrow ?? "About the Festival"}
  title={page?.title ?? "We Put The Fun Back In Film Fests"}
  lede={page?.lede ?? "…existing lede string…"}
  logo
/>
```

Do the same on /support (eyebrow/title/lede), and feed the give-card copy from `content.support` (the existing `Support` singleton: `funderBody`, `donateLabel`, `donateUrl`) with the current strings as fallback.

- [ ] **Step 3: Drive the repeating lists from CMS-or-festival**

About — Houses + Timeline:

```tsx
const houses = (content.houses ?? []).length
  ? content.houses!.map((h) => ({ name: h.name ?? "", neighborhood: h.neighborhood ?? "", blurb: h.blurb ?? "" }))
  : HOUSES;
const timeline = (content.timeline ?? []).length
  ? content.timeline!.map((t) => ({ year: t.year ?? "", event: t.event ?? "" }))
  : TIMELINE;
```

Map over `houses` / `timeline` instead of the raw `festival.ts` arrays.

Support — Giving tiers: drive from the existing `GivingTiers` collection if present, else `GIVING_LEVELS` (mirror the same `.length ? cms : festival` pattern).

- [ ] **Step 4: Closing band from CMS**

```tsx
<ClosingBand
  title={page?.closingTitle ?? "Keep The Screen Lit"}
  body={page?.closingBody ?? "…existing body…"}
  href={page?.closingHref ?? DONATE_URL}
  cta={page?.closingCta ?? "Donate Now ›"}
  variant="secondary"
/>
```

- [ ] **Step 5: Verify CMS-off parity + CMS-on edit**

Run: `WIX_CLIENT_ID= npm run build && npm run lint`
Then `npm run dev` with token: edit `AboutPage.title` in Wix → page title changes after revalidate; clear the field → falls back to the festival string. Set `AboutPage.hidden` → `/about` 404s.

- [ ] **Step 6: Commit**

```bash
git add app/about/page.tsx app/support/page.tsx
git commit -m "feat(cms): wire about + support copy/lists/visibility to CMS with fallback

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Wire /submit + /tickets + /schedule copy to CMS

**Files:**
- Modify: `app/submit/page.tsx`, `app/tickets/page.tsx`, `app/schedule/page.tsx`

**Interfaces:**
- Consumes: `getSiteContent`, `isPageHidden`, `festival.ts` (`SUBMIT_URL`, `SUBMIT_CRITERIA`, `SUBMIT_STEPS`, `SUBMISSION_ROUNDS`, `TICKET_TIERS`).

- [ ] **Step 1: /submit — async + visibility + copy**

```tsx
const content = await getSiteContent();
if (isPageHidden(content, "submit")) notFound();
const page = content.submitPage;
```

- `PageHero` eyebrow/title/lede ← `page?.* ?? <existing string>`.
- Criteria grid ← `(content.submitCriteria?.length ? content.submitCriteria : SUBMIT_CRITERIA)`; map fields `n/title/blurb`.
- Steps grid ← `(content.submitSteps?.length ? content.submitSteps : SUBMIT_STEPS)`.
- Deadlines table ← `(content.submitDeadlines?.length ? content.submitDeadlines : SUBMISSION_ROUNDS)`; map `name/closes/fee`.
- `ClosingBand` ← `page?.closing* ?? <existing>`.

- [ ] **Step 2: /tickets — async + visibility + copy (purchase wiring untouched)**

```tsx
const content = await getSiteContent();
if (isPageHidden(content, "tickets")) notFound();
const page = content.ticketsPage;
```

- `PageHero` + "why a season pass" section copy + `ClosingBand` ← `page?.* ?? <existing>`.
- If `BuyTickets` renders tier copy, drive only the **display copy** from `content.ticketTiers` (name/price/cadence/perks/featured) with `TICKET_TIERS` fallback — but keep all reservation/checkout calls exactly as they are.

- [ ] **Step 3: /schedule — async + visibility + copy (live feed untouched)**

```tsx
const content = await getSiteContent();
if (isPageHidden(content, "schedule")) notFound();
const page = content.schedulePage;
```

- `PageHero` + closing-band copy ← `page?.* ?? <existing>`. Leave `<ScheduleSection headless />` and its live Wix Events data exactly as-is.

- [ ] **Step 4: Verify CMS-off parity + CMS-on edits + visibility**

Run: `WIX_CLIENT_ID= npm run build && npm run lint`
Then with token: edit a `SubmitCriteria` row → criteria card updates; set `TicketsPage.hidden` → `/tickets` 404s AND its nav item is gone (Task 4 nav already filters; if nav is a separate `Nav` row, also hide that row). Confirm the **ticket purchase flow still works**.

- [ ] **Step 5: Commit**

```bash
git add app/submit/page.tsx app/tickets/page.tsx app/schedule/page.tsx
git commit -m "feat(cms): wire submit/tickets/schedule copy + visibility (live feeds untouched)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Wire the homepage hero + footer to CMS (reuse main's singletons)

**Files:**
- Modify: `app/page.tsx`, the footer/founder-band components if they hold copy.

**Interfaces:**
- Consumes: `getSiteContent`, `wixImageUrl`, `wixVideoUrl`, existing `Hero`, `BuiltForAccess`, `Footer`, `SiteSettings` singletons.

- [ ] **Step 1: Feed the hero from the `Hero` singleton with fallback** (mirror main's pattern exactly):

```tsx
const content = await getSiteContent();
const hero = content.hero;
<CurtainCreditsHero
  eyebrow={hero?.eyebrow}
  tagline={hero?.tagline}
  title={hero?.title ?? undefined}
  posterUrl={wixImageUrl(hero?.poster) ?? undefined}
  videoUrl={wixVideoUrl(hero?.video) ?? undefined}
/>
```

- [ ] **Step 2: Feed FounderBand from `BuiltForAccess`** and footer copy from `Footer`, each null-coalescing to `FOUNDER` / current footer strings.

- [ ] **Step 3: Verify CMS-off parity + CMS-on**

Run: `WIX_CLIENT_ID= npm run build && npm run lint`
Then with token: edit `Hero.title` in Wix → homepage hero title changes; clear → falls back.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/founder-band.tsx components/site-footer.tsx
git commit -m "feat(cms): wire homepage hero + founder band + footer to CMS singletons

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Full CMS-off / CMS-on verification pass

**Files:** none (verification only).

- [ ] **Step 1: CMS-off parity**

Run: `WIX_CLIENT_ID= npm run build && WIX_CLIENT_ID= npm run start` (or dev). Click through `/`, `/about`, `/schedule`, `/tickets`, `/submit`, `/support`. Every page MUST render identically to the end of Plan A (all copy from `festival.ts`), no errors, nav full.

- [ ] **Step 2: CMS-on behaviors**

With the real `WIX_CLIENT_ID`: (a) edit one field per page → change appears after revalidate; (b) set one page's `hidden` → route 404s and its nav item disappears; (c) reorder `Nav` → menu reorders; (d) ticket purchase + live schedule both still work.

- [ ] **Step 3: Tests**

Run: `npm run test`
Expected: converter tests pass.

- [ ] **Step 4: Commit (if any fixes were needed)** with message `fix(cms): verification-pass corrections`.

---

### Task 9: Editor guide

**Files:**
- Create: `docs/cms-editor-guide.md`

- [ ] **Step 1: Write a one-pager** listing every collection, which page/section each field controls, the media-field convention (`wix:image://` auto-converts), and the visibility rules (`hidden` checkbox per page; `Nav` rows control the menu). Mirror main's CMS guide if one exists (`git show main:docs/` to check).

- [ ] **Step 2: Commit**

```bash
git add docs/cms-editor-guide.md
git commit -m "docs(cms): ALT editor guide for Wix collections

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Notes (author)

- **Spec coverage:** transport layer ported unchanged (Task 1) ✓; reuse existing + add new collections, "mish-mash" (Task 2) ✓; all copy editable — per-page singletons + repeating-card collections (Tasks 2,3,5,6) ✓; page-level + nav-item toggles extending `archivesHidden` pattern (Tasks 2,4,5,6) ✓; same null-coalesce-to-festival fallback (every wiring task) ✓; off-limits live schedule + purchase untouched (Tasks 6 constraints) ✓; env unchanged (`WIX_CLIENT_ID`) ✓; CMS-off parity proven (Task 8) ✓.
- **Type consistency:** `PageCopy`, `NavItem`, `Cms*` types defined in Task 3 and consumed by Tasks 4–6; `getNav()` / `isPageHidden()` defined in Task 4 and consumed by Tasks 5–6; `getSiteContent()` field names (`aboutPage`, `submitCriteria`, …) consistent across tasks.
- **Open decisions resolved:** page-`hidden` lives on each per-page singleton (Task 2 schema), and nav is a dedicated `Nav` collection (Task 2) — matching the spec's stated leanings.
- **External dependency:** Task 2 requires Wix MCP access; if unavailable in the execution session, it must be done in a session with the Wix MCP connected before Tasks 5–8 can be fully verified CMS-on (CMS-off verification still works without it).
