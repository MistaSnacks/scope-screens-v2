# ALT (V2) Polish + CMS Port — Design

**Date:** 2026-06-24
**Branch:** `ALT` (the multipage "V2" build, now chosen over the `main` SPA)
**Status:** Approved design — pending implementation plan

---

## 1. Context

The festival site at `/Users/admin/SS` exists in two builds:

- **`main`** — a single-page app (SPA) with a scroll-pinned hero and section anchors. It has a **complete Wix headless CMS** so non-technical editors can change copy/media/links per section (`lib/site-content.ts`, `lib/wix-cms.ts`, `lib/wix-token.ts`, `lib/wix-media.ts`, `lib/wix-video.ts`).
- **`ALT`** — a multipage build (Next.js App Router) with real routes: `/`, `/about`, `/schedule`, `/tickets`, `/submit`, `/support`, plus `/privacy`, `/terms`, `/thank-you`. **All content is hard-coded in `lib/festival.ts`. There is no CMS on ALT.**

The user has decided to ship the **ALT multipage build as V2**. This spec covers the polish + CMS work needed to get it launch-ready.

The work is three workstreams, sequenced so components are cleaned **before** CMS data is wired into them (CMS-first would force a re-wire after the refactor):

1. **Part 1 — Shared design system.** Establish the missing shared primitives (buttons, shadows, cards, gap rhythm, a unified `PageHero`).
2. **Part 2 — Deslopify + carry hero assets onto every sub-page.** Apply Part 1; make pages consistent; bring hero design assets (popcorn logo, Aachen, reel poster, grain, ticket/lanyard treatment, partner marquee) onto their respective pages.
3. **Part 3 — CMS port (Main → ALT).** Full editor control of all copy, with page-level and nav-item visibility toggles. Same fail-safe fallback to `festival.ts` that `main` uses.

### Goals

- ALT pages look intentional and consistent, not templated/AI-generated.
- Design assets that define the hero appear coherently on their respective pages.
- Every piece of copy is editable in Wix by a non-technical editor.
- Whole pages and their nav items can be toggled on/off from the CMS.
- If Wix is unreachable, the site renders identically from `festival.ts` (no breakage).

### Non-goals / constraints

- **Do not touch the live ticketing or schedule purchase flow.** `lib/wix-checkout.ts` and `lib/wix-events.ts` (Wix Events reservations, payment redirects, live schedule feed) stay as-is. The CMS governs surrounding **copy** (eyebrows, titles, ledes, tier descriptions, closing bands) — never the live event data or checkout wiring.
- No new third-party dependencies.
- Spotlight/cursor-glow stays a homepage-hero-only flourish (it would read as noise on text sub-pages). Everything else from the hero is fair game per page.
- No unrelated refactors outside these three parts.

---

## 2. Part 1 — Shared design system

The audit found the same visual element re-implemented with slightly different values across pages. Establish shared primitives first, in `app/globals.css` plus a small number of components.

### 1.1 Button utilities (`globals.css`)

Today one CTA uses `font-mono`, another `font-body`; padding ranges `px-4 py-3` → `px-7 py-3.5`; hover is variously `hover:bg-curtain-bright`, `hover:scale-[1.03]`, `hover:opacity-90`. Replace with three utilities:

- `.btn-primary` — curtain red, cream text (primary actions: Buy Tickets, Submit).
- `.btn-secondary` — rust/gold, ink text (Donate / support actions).
- `.btn-link` — tertiary inline link style (`text-curtain hover:text-rust`).

Each fixes font, padding, tracking, and a single hover behavior. All existing CTAs migrate to these.

### 1.2 Shadow + card tokens (`globals.css`)

The "physical" rotated objects each hand-tune a drop-shadow (ticket `0_28px_55px`, lanyard `0_24px_42px`, clapperboard `0_22px_45px`). Introduce:

- `.shadow-prop` — one shared drop-shadow for rotated physical props.
- `.card` — standard raised card (`border-hairline`, `bg-card`, standardized padding). Replaces the ad-hoc `p-6`/`p-7`/`p-8` mix.

### 1.3 Section rhythm tokens

Grid/flex gaps currently range `gap-5`→`gap-14` with no rule. Define a documented gap scale (e.g. `--gap-tight`, `--gap-card`, `--gap-section`) and apply it so card grids and section columns share a rhythm. Document the intended value per context (3-up cards, 4-up cards, section columns).

### 1.4 `PageHero` component (`components/page-hero.tsx`)

Supersedes `PageHeader` and absorbs the duplicated inline hero blocks in `/submit` and `/support` (≈95% identical copy-paste today). One component, props:

- `eyebrow: string`, `title: string`, `lede?: string`
- `card?: ReactNode` — optional sidebar slot (the open-call card on `/submit`, the give-today card on `/support`).
- `media?: { poster?: string; video?: string }` — optional reel poster/video accent.
- `logo?: boolean` — render the popcorn logo as a header anchor.

This is the single place the **popcorn logo, Aachen display type, and optional reel poster** land consistently on every page. `PageHeader` is removed once all pages migrate.

### 1.5 One eyebrow rule

Section eyebrows use the asymmetrical left-rule (`h-px w-10 bg-curtain` + label) everywhere **except** intentional centered band sections. Fix `/support`'s one-off symmetric eyebrow on the partner section.

---

## 3. Part 2 — Deslopify + carry hero assets

Apply Part 1 to every sub-page. Per-page changes:

| Page | Changes |
|---|---|
| **`/about`** | Migrate to `<PageHero logo>`; normalize section gaps to the rhythm scale; keep FounderBand, Timeline, Houses, PartnersMarquee. |
| **`/schedule`** | Currently header + list only (reads as a stub). Add a closing CTA band and the shared **PartnersMarquee**; logo accent. Live schedule feed unchanged. |
| **`/tickets`** | Also a stub today. Add a short "why a season pass" supporting section + closing band + **PartnersMarquee**. Ticket/lanyard props adopt the shared `.shadow-prop`/grain treatment so they read identically wherever reused. Purchase wiring unchanged. |
| **`/submit`** | Replace inline hero with `<PageHero card={openCall} logo>`; normalize the alternating-bg section rhythm; add **PartnersMarquee** (FilmFreeway / festival partners); grain on the prop card. |
| **`/support`** | Replace inline hero with `<PageHero card={give} logo>`; fix the symmetric eyebrow; normalize tier/card gaps. |

**Shared-asset outcomes (the user's explicit asks):**

- **Popcorn logo + Aachen** — present/used consistently on every page via `PageHero` and existing component usage.
- **Reel video / poster** — available as an optional `PageHero` media accent on relevant pages (e.g. tickets, about). Not forced where it doesn't serve.
- **Grain overlay** — applied to the prop/hero cards as a signature texture (today only on the ticket card).
- **Ticket + lanyard treatment** — shared shadow/grain tokens so the prop styling is identical wherever it appears.
- **Partner marquee** — structurally identical across all five sub-pages: same component, same eyebrow treatment, page-vs-band variant chosen consistently.
- **Spotlight** — intentionally remains homepage-hero only.

---

## 4. Part 3 — CMS port (Main → ALT)

Full editor control: **all copy editable**, plus **page-level and nav-item visibility toggles**.

### 4.1 Copy the transport layer unchanged

From `main`, copy verbatim (anonymous visitor OAuth token, same `WIX_CLIENT_ID`, 1-hour ISR revalidate):

- `lib/wix-token.ts` — `getVisitorToken()`
- `lib/wix-cms.ts` — `queryCollection<T>()`, `getSingleton<T>()`
- `lib/wix-media.ts` — `wixImageUrl()`
- `lib/wix-video.ts` — `wixVideoUrl()`

### 4.2 Aggregator

Port `lib/site-content.ts` (React `cache()` dedupe, parallel fetch, every read fails to `null`). Extend it with the ALT-specific collections below.

### 4.3 Reuse existing collections (no Wix-side change)

These already exist on the Wix site and map cleanly to ALT:
`Hero`, `BuiltForAccess` (→ FounderBand), `Partners`, `Marquee`, `Socials`, `GivingTiers`, `Submissions`, `Support`, `Footer`, `SiteSettings`.

### 4.4 New collections (full copy control of ALT page bodies)

ALT has page content with no home in Main's schema. Add collections so **all copy is editable**:

- **Per-page header singletons** — `AboutPage`, `SchedulePage`, `TicketsPage`, `SubmitPage`, `SupportPage` — each with `eyebrow`, `title`, `lede`, and that page's closing-band copy.
- **Repeating-card collections** — `Houses`, `Timeline` (about); `TicketTiers` (tier name/price/perks copy only — not purchase wiring); `SubmitCriteria`, `SubmitSteps`, `SubmitDeadlines`.

Each is sorted by an `order` field, mirrors the existing collection contract, and falls back to `festival.ts` when empty.

> Note: `ScheduleNights` is **not** a new collection — schedule dates come from the live Wix Events feed (`lib/wix-events.ts`), which is off-limits. The CMS only governs the schedule page's header/closing copy.

### 4.5 Page + nav visibility toggles

Extend the existing `SiteSettings`-toggle pattern (today: `archivesHidden`) to whole pages and nav items:

- Add a boolean `hidden` field per page (e.g. on each per-page singleton, or page-keyed flags on `SiteSettings`). When `hidden === true`: the page's nav item is removed **and** the route returns `notFound()` (or redirects home).
- The persistent nav (`NAV_ITEMS` today in `festival.ts`) is sourced from CMS: each nav item carries a `label`, `href`, `order`, and `hidden` flag. Editors can rename, reorder, and hide nav items.
- Default/unset = shown (same convention as `archivesHidden`).

### 4.6 Wiring + fallback contract

Each page is an async server component that calls `getSiteContent()` and consumes its fields with the **identical null-coalesce-to-`festival.ts` pattern** Main uses, e.g.:

```ts
const founderName = access?.founderName ?? FOUNDER.name;
const founderPhoto = wixImageUrl(access?.photo) ?? "/founder-lex.jpg";
```

Media always passes through `wixImageUrl()` / `wixVideoUrl()` and falls back to the local public asset. If the visitor token or any read fails, the page renders entirely from `festival.ts`.

### 4.7 Env

- `WIX_CLIENT_ID` — already in `.env`, same value as Main. No other Wix env vars.

---

## 5. Sequencing

1. **Part 1** — shared primitives in `globals.css` + `PageHero`. No visual regressions; verify each existing page still renders.
2. **Part 2** — migrate pages to the primitives, deslopify, carry assets. Verify each page.
3. **Part 3** — copy transport layer, extend aggregator, create/seed new Wix collections, add toggles, wire pages with fallbacks. Verify CMS-on and CMS-off (token absent) both render.

Parts 1→2 are frontend-only and independently shippable. Part 3 layers data onto the now-clean components.

---

## 6. Verification

- **Per page (Parts 1–2):** renders without error; buttons/cards/eyebrows use shared utilities; partner marquee identical across pages; logo/Aachen/grain present where specified.
- **CMS-off (Part 3):** with `WIX_CLIENT_ID` unset, every page renders identically to pre-CMS (festival.ts fallback proven).
- **CMS-on:** editing a field in Wix changes the rendered page after revalidation; hiding a page removes its nav item and 404s/redirects the route; reordering nav reorders the menu.
- **Off-limits check:** ticket purchase and live schedule flows behave exactly as before.

---

## 7. Open items for the implementation plan

- Exact gap-scale token values and which context uses which.
- Whether page-`hidden` lives on each per-page singleton or as page-keyed flags on `SiteSettings` (lean toward per-page singleton for editor clarity).
- Whether nav items are a new `Nav` collection vs. derived from per-page singletons (lean toward a dedicated `Nav` collection so order/label/hidden live in one place).
- Creating + seeding the new Wix collections (via Wix MCP) and setting read permission to "Anyone".
