# Event Details Page (`/events/[slug]`) — Design

**Date:** 2026-07-06 · **Approved by:** Cam ("lets try it")
**Client ask (Shailee):** "Need buy tickets to take to a simple event page with all details."
**Cam's scoping:** every buy action (including Season Pass) routes to an event page; styling must match the site.

## Route & data

- New dynamic server route `app/events/[slug]/page.tsx`. Always on — no SiteSettings hide toggle (commerce core).
- New `getEventBySlug(slug)` in `lib/wix-checkout.ts`: Events v3 query, `filter: {slug: {$eq}}`,
  `fields: ["DETAILS", "TEXTS", "REGISTRATION"]`, anonymous visitor token (same as siblings).
- Returns: `eventId`, `slug`, `title`, `shortDescription`, `aboutHtml` (detailedDescription),
  `imageUrl` (mainImage), `venueName`, `address` (formattedAddress), `mapsUrl` (from geocode/address),
  `dateLong` + `startTime` (dateAndTimeSettings.formatted), `startDateIso`, `saleOpen` (registration.status).
- Unknown slug / Wix miss → `null` → `notFound()`. No new CMS collections: Wix Events is the single source;
  the client edits everything there.

## Composition & styling

Design system identical to the other pages: `PageHero` (eyebrow = "Tuesday · July 28, 2026 · Doors 7:00",
title = event title with the "Scope Screenings:" prefix stripped — same regex as the schedule, lede = short
description, popcorn logo), Aachen/Libre/mono, curtain–rust–cream. Wix main image as a tilted lobby card
(`shadow-prop`, slight rotate). Details band: date · venue + address (Google Maps link) · doors/screen.
`detailedDescription` HTML rendered as styled prose. Then `PartnersMarquee` + `ClosingBand` (→ /#schedule).

## Checkout, inline

Extract the modal's flow (tier fetch → quantities → reserve → payment redirect, incl. error states) into a
shared client component `components/checkout/checkout-panel.tsx`. The event page embeds it in a "Get your
tickets" card; `CheckoutModal` becomes a thin wrapper around the same panel (existing modal tests keep
passing). Sold-out/off-sale → existing "no tickets available" state + link back to `/#schedule`.

## Season Pass variant

Same route (the pass is a Wix event). Detected by pass title (same `/season pass/i` test as
`getPurchasableTargets`) → skip the date/venue band; render "Admits: Bearer · All 7 Nights · Jun–Dec"
plus the season lineup (from `getLiveSchedule`), then the same inline checkout (GA $99 / VIP $500).

## Entry points

- Ticket card, gold "BUY TICKETS · <date>" button, lanyard, "BUY SEASON PASS · $99" → `Link` to `/events/[slug]`.
- Schedule "Reserve →" → internal `/events/[slug]` (was lexscopefilms.com).
- Hero on-screen CTA + nav "GET TICKETS" keep scrolling to `/#tickets` (the chooser section).
- When no live target/slug exists, buttons keep today's external-fallback behavior.

## SEO

`generateMetadata` from event title + shortDescription + mainImage (OG image).

## Testing

Unit: `getEventBySlug` mapping (object-shaped fields, pass detection, null paths); checkout-panel reuse
(modal tests unchanged and green). Manual: dev-server screenshots desktop + mobile for styling parity.
