// lib/nav.ts — CMS-driven nav + page visibility, with festival.ts fallback.
import { getSiteContent, type SiteContent } from "./site-content";
import { NAV_ITEMS } from "./festival";
import { navHrefFor } from "./nav-href";

export type NavLink = { label: string; href: string };

export async function getNav(): Promise<NavLink[]> {
  const content = await getSiteContent();
  const cms = content.nav
    ?.filter((n) => n.hidden !== true && n.label && n.href)
    .map((n) => ({ label: n.label as string, href: n.href as string }));
  if (cms && cms.length) return cms;
  return NAV_ITEMS.map((label) => ({ label, href: navHrefFor(label) }));
}

const PAGE_SINGLETON = {
  about: "aboutPage",
  schedule: "schedulePage",
  tickets: "ticketsPage",
  submit: "submitPage",
  support: "supportPage",
} as const;
export type PageKey = keyof typeof PAGE_SINGLETON;

// True only when the page's CMS singleton explicitly sets hidden = true.
export function isPageHidden(content: SiteContent, key: PageKey): boolean {
  const page = content[PAGE_SINGLETON[key]] as { hidden?: boolean } | null;
  return page?.hidden === true;
}
