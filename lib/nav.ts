// lib/nav.ts — CMS-driven nav + page visibility, with festival.ts fallback.
import { getSiteContent, type SiteContent } from "./site-content";
import { NAV_ITEMS } from "./festival";
import { navHrefFor } from "./nav-href";

export type NavLink = { label: string; href: string };

export async function getNav(): Promise<NavLink[]> {
  const content = await getSiteContent();
  const cms = content.nav
    ?.filter((n) => n.hidden !== true && n.label && n.href)
    .map((n) => ({ label: n.label as string, href: rerouteHidden(content, n.href as string) }));
  if (cms && cms.length) return cms;
  return NAV_ITEMS.map((label) => ({ label, href: rerouteHidden(content, navHrefFor(label)) }));
}

export type PageKey = "about" | "schedule" | "tickets" | "submit" | "support";

// Every page on/off switch lives on the single SiteSettings singleton, keyed
// <page>Hidden — so editors flip all of them from one form in the CMS.
const PAGE_HIDDEN_FIELD: Record<PageKey, "aboutHidden" | "scheduleHidden" | "ticketsHidden" | "submitHidden" | "supportHidden"> = {
  about: "aboutHidden",
  schedule: "scheduleHidden",
  tickets: "ticketsHidden",
  submit: "submitHidden",
  support: "supportHidden",
};

// True only when SiteSettings explicitly toggles this page off.
export function isPageHidden(content: SiteContent, key: PageKey): boolean {
  return content.siteSettings?.[PAGE_HIDDEN_FIELD[key]] === true;
}

// The Press & Media kit (homepage support section) on/off, also on SiteSettings.
export function isPressKitHidden(content: SiteContent): boolean {
  return content.siteSettings?.pressKitHidden === true;
}

// The homepage "The Archives" (Chapter Four) section on/off.
export function isArchivesHidden(content: SiteContent): boolean {
  return content.siteSettings?.archivesHidden === true;
}

// The footer sign-off + newsletter signup band on/off.
export function isNewsletterHidden(content: SiteContent): boolean {
  return content.siteSettings?.newsletterHidden === true;
}

// Standalone page route -> its matching home-page section anchor. Each of these
// sections lives on the homepage (see app/page.tsx ids), so when an editor
// toggles a page OFF in the CMS we can still send the nav item somewhere real.
const ROUTE_TO_PAGE: Record<string, PageKey> = {
  "/tickets": "tickets",
  "/schedule": "schedule",
  "/submit": "submit",
  "/about": "about",
  "/support": "support",
};

// If a nav link points at a page that's toggled off in the CMS, send it to the
// equivalent section on the homepage instead of the now-404 standalone route.
export function rerouteHidden(content: SiteContent, href: string): string {
  const key = ROUTE_TO_PAGE[href];
  return key && isPageHidden(content, key) ? `/#${key}` : href;
}
