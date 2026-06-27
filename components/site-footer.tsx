import { CONTACT_EMAIL, SOCIALS, VENUE } from "@/lib/festival";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { KineticText } from "@/components/motion/kinetic-text";
import { getSiteContent } from "@/lib/site-content";
import { isNewsletterHidden, rerouteHidden } from "@/lib/nav";
import type { ReactNode } from "react";

const COLUMNS = [
  { head: "Festival", links: ["About", "The Films", "Schedule"] },
  { head: "Attend", links: ["Buy Tickets", "Season Pass", "Accessibility"] },
  { head: "Get Involved", links: ["Submit a Film", "Become a Funder", "Press & Media", "Volunteer"] },
];

// Footer link targets. Page-backed links use their standalone route; the render
// wraps every href in rerouteHidden() so a page toggled OFF in the CMS falls
// back to its home-page section (/#about, …) instead of 404ing.
const FOOTER_HREFS: Record<string, string> = {
  About: "/about",
  "The Films": "/#films",
  Schedule: "/schedule",
  "Buy Tickets": "/#tickets",
  "Season Pass": "/#tickets",
  Accessibility: "/accessibility",
  "Submit a Film": "/submit",
  "Become a Funder": "/support",
  "Press & Media": `mailto:${CONTACT_EMAIL}?subject=Scope%20Screenings%20Press%20%26%20Media`,
  Volunteer: `mailto:${CONTACT_EMAIL}?subject=Scope%20Screenings%20Volunteer`,
};

// Footer social glyphs (Instagram / TikTok / YouTube), currentColor so they
// inherit the smoke→rust hover like the rest of the footer.
const SOCIAL_ICONS: Record<string, ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M16.6 3c.36 2.07 1.65 3.66 3.9 4.06v2.62c-1.43.07-2.78-.34-3.93-1.12v6.42a5.82 5.82 0 1 1-5.82-5.82c.3 0 .6.02.9.07v2.74a3.18 3.18 0 1 0 2.25 3.04V3h2.7z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.2 9.3l4.9 2.7-4.9 2.7z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </svg>
  );
}

export async function SiteFooter() {
  const content = await getSiteContent();
  const f = content.footer;
  const contactEmail = f?.contactEmail ?? CONTACT_EMAIL;
  const hrefFor = (label: string): string => rerouteHidden(content, FOOTER_HREFS[label] ?? "#");

  return (
    <footer className="bg-stage-deep px-5 pb-9 pt-16 md:shell-x">
      {/* Sign-off + newsletter — hidden via SiteSettings → newsletterHidden */}
      {!isNewsletterHidden(content) && (
      <div className="flex flex-col gap-10 border-b border-cream/10 pb-12 md:flex-row md:items-end md:justify-between">
        <KineticText
          as="h2"
          className="pulp font-display text-[3rem] uppercase leading-[0.9] tracking-[-0.01em] md:text-[3.875rem]"
          text={f?.signoff ?? "See You At\nThe Movies"}
        />
        <div className="flex w-full max-w-[27.5rem] flex-col gap-3">
          <span className="font-body text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-smoke">
            {f?.newsletterHeading ?? "Get the lineup in your inbox"}
          </span>
          <form className="flex h-[3.25rem] overflow-hidden rounded-md border border-cream/25 focus-within:border-rust">
            <input
              type="email"
              required
              placeholder="you@email.com"
              aria-label="Email address"
              className="flex-1 bg-ink/40 px-4 font-body text-[0.9375rem] text-cream placeholder:text-smoke focus:outline-none"
            />
            <button
              type="submit"
              className="bg-curtain px-6 font-body text-[0.875rem] font-extrabold uppercase tracking-[0.06em] text-cream"
            >
              Join
            </button>
          </form>
        </div>
      </div>
      )}

      {/* Columns */}
      <Stagger className="grid grid-cols-2 gap-10 border-b border-cream/10 py-11 md:grid-cols-4">
        <StaggerItem className="flex flex-col gap-3">
          <span className="font-marquee text-[1.125rem] uppercase text-cream">Scope Screenings</span>
          <p className="max-w-[28ch] font-body text-[0.875rem] leading-relaxed text-smoke">
            {f?.tagline ?? "Seattle’s underground film festival. We put the fun back in film fests."}
          </p>
          <div className="mt-2 flex items-center gap-4">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-smoke transition-colors hover:text-rust"
              >
                {SOCIAL_ICONS[s.label] ?? s.label}
              </a>
            ))}
            <a
              href={`mailto:${contactEmail}`}
              aria-label={`Email ${contactEmail}`}
              className="text-smoke transition-colors hover:text-rust"
            >
              <MailIcon />
            </a>
          </div>
        </StaggerItem>
        {COLUMNS.map((col) => (
          <StaggerItem key={col.head} className="flex flex-col gap-2.5">
            <span className="font-body text-[0.75rem] font-bold uppercase tracking-[0.16em] text-rust">
              {col.head}
            </span>
            {col.links.map((l) => (
              <a key={l} href={hrefFor(l)} className="font-body text-[0.875rem] text-cream/80 transition-colors hover:text-rust">
                {l}
              </a>
            ))}
          </StaggerItem>
        ))}
      </Stagger>

      {/* Legal */}
      <div className="flex flex-col gap-2 pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-x-5 md:gap-y-2">
          <span className="font-body text-[0.75rem] text-smoke">
            {f?.copyright ?? `© 2026 Scope Screenings · A fiscally sponsored project of Shunpike · ${VENUE.city}`}
          </span>
          <a href="/privacy" className="font-body text-[0.75rem] text-smoke transition-colors hover:text-rust">
            Privacy Policy
          </a>
          <a href="/terms" className="font-body text-[0.75rem] text-smoke transition-colors hover:text-rust">
            Terms of Service
          </a>
        </div>
        <a
          href="https://www.simplemcmathematics.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[0.75rem] text-smoke transition-colors hover:text-rust"
        >
          Powered by SimpleMcMathematics
        </a>
      </div>
    </footer>
  );
}
