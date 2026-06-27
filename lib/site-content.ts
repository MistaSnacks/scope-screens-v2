import "server-only";
// lib/site-content.ts — ALT multipage CMS aggregator. Request-deduped via
// React cache; every read fails to null so a missing collection or blank field
// never breaks a render (callers fall back to lib/festival.ts at point of use).
import { cache } from "react";
import { queryCollection, getSingleton } from "./wix-cms";

// --- Reused singletons (already on the Wix site, shared with the main SPA) ---
export interface HeroContent { eyebrow?: string; title?: string; tagline?: string; poster?: string; video?: string }
export interface BuiltForAccessContent { eyebrow?: string; title?: string; quote?: string; founderName?: string; founderTitle?: string; founderCredential?: string; photo?: string }
export interface FooterContent { signoff?: string; tagline?: string; newsletterHeading?: string; copyright?: string; contactEmail?: string }
export interface SiteSettingsContent {
  venueName?: string; venueAddress?: string; venueCity?: string;
  archivesHidden?: boolean; newsletterHidden?: boolean;
  // Page on/off switches — all visibility toggles live on this one singleton so
  // editors flip everything from a single SiteSettings form.
  aboutHidden?: boolean; scheduleHidden?: boolean; ticketsHidden?: boolean; submitHidden?: boolean; supportHidden?: boolean;
  // Feature toggles
  pressKitHidden?: boolean;
}

// --- ALT page singletons ---
export interface PageCopy { eyebrow?: string; title?: string; lede?: string; closingTitle?: string; closingBody?: string; closingCta?: string; closingHref?: string }
export interface TicketsPageCopy extends PageCopy { whyTitle?: string; whyBody?: string }
export interface SupportPageCopy extends PageCopy { cardLabel?: string; cardBody?: string; donateUrl?: string }

// --- ALT list collections ---
export interface NavItem { label?: string; href?: string; order?: number; hidden?: boolean }
export interface CmsTimeline { year?: string; title?: string; blurb?: string; order?: number }
export interface CmsTier { name?: string; price?: string; amount?: string; cadence?: string; perks?: string; featured?: boolean; order?: number }
export interface CmsNumbered { n?: string; title?: string; blurb?: string; order?: number }
export interface CmsDeadline { name?: string; closes?: string; fee?: string; order?: number }

export interface SiteContent {
  hero: HeroContent | null;
  builtForAccess: BuiltForAccessContent | null;
  footer: FooterContent | null;
  siteSettings: SiteSettingsContent | null;
  marquee: { phrase?: string; order?: number }[] | null;
  aboutPage: PageCopy | null;
  schedulePage: PageCopy | null;
  ticketsPage: TicketsPageCopy | null;
  submitPage: PageCopy | null;
  supportPage: SupportPageCopy | null;
  nav: NavItem[] | null;
  timeline: CmsTimeline[] | null;
  ticketTiers: CmsTier[] | null;
  givingTiers: CmsTier[] | null;
  submitCriteria: CmsNumbered[] | null;
  submitSteps: CmsNumbered[] | null;
  submitDeadlines: CmsDeadline[] | null;
}

const byOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0);
const ASC: { sort: { fieldName: string; order: "ASC" | "DESC" }[] } = { sort: [{ fieldName: "order", order: "ASC" }] };
const sorted = <T extends { order?: number }>(x: T[] | null) => (x ? [...x].sort(byOrder) : null);

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const [
    hero, builtForAccess, footer, siteSettings, marquee,
    aboutPage, schedulePage, ticketsPage, submitPage, supportPage,
    nav, timeline, ticketTiers, givingTiers, submitCriteria, submitSteps, submitDeadlines,
  ] = await Promise.all([
    getSingleton<HeroContent>("Hero"),
    getSingleton<BuiltForAccessContent>("BuiltForAccess"),
    getSingleton<FooterContent>("Footer"),
    getSingleton<SiteSettingsContent>("SiteSettings"),
    queryCollection<{ phrase?: string; order?: number }>("Marquee", ASC),
    getSingleton<PageCopy>("AboutPage"),
    getSingleton<PageCopy>("SchedulePage"),
    getSingleton<TicketsPageCopy>("TicketsPage"),
    getSingleton<PageCopy>("SubmitPage"),
    getSingleton<SupportPageCopy>("SupportPage"),
    queryCollection<NavItem>("Nav", ASC),
    queryCollection<CmsTimeline>("Timeline", ASC),
    queryCollection<CmsTier>("TicketTiers", ASC),
    queryCollection<CmsTier>("GivingTiers", ASC),
    queryCollection<CmsNumbered>("SubmitCriteria", ASC),
    queryCollection<CmsNumbered>("SubmitSteps", ASC),
    queryCollection<CmsDeadline>("SubmitDeadlines", ASC),
  ]);
  return {
    hero, builtForAccess, footer, siteSettings,
    marquee: sorted(marquee),
    aboutPage, schedulePage, ticketsPage, submitPage, supportPage,
    nav: sorted(nav),
    timeline: sorted(timeline),
    ticketTiers: sorted(ticketTiers), givingTiers: sorted(givingTiers),
    submitCriteria: sorted(submitCriteria), submitSteps: sorted(submitSteps), submitDeadlines: sorted(submitDeadlines),
  };
});
