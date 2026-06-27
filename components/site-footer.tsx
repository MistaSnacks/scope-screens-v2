import { CONTACT_EMAIL, SOCIALS, VENUE } from "@/lib/festival";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { KineticText } from "@/components/motion/kinetic-text";
import { getSiteContent } from "@/lib/site-content";

const COLUMNS = [
  { head: "Festival", links: ["About", "The Films", "Schedule"] },
  { head: "Attend", links: ["Buy Tickets", "Season Pass", "Accessibility"] },
  { head: "Get Involved", links: ["Submit a Film", "Become a Funder", "Press & Media", "Volunteer"] },
];

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

export async function SiteFooter() {
  const content = await getSiteContent();
  const f = content.footer;
  const contactEmail = f?.contactEmail ?? CONTACT_EMAIL;

  return (
    <footer className="bg-stage-deep px-5 pb-9 pt-16 md:shell-x">
      {/* Sign-off + newsletter */}
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

      {/* Columns */}
      <Stagger className="grid grid-cols-2 gap-10 border-b border-cream/10 py-11 md:grid-cols-4">
        <StaggerItem className="flex flex-col gap-3">
          <span className="font-marquee text-[1.125rem] uppercase text-cream">Scope Screenings</span>
          <p className="max-w-[28ch] font-body text-[0.875rem] leading-relaxed text-smoke">
            {f?.tagline ?? "Seattle’s underground film festival. We put the fun back in film fests."}
          </p>
        </StaggerItem>
        {COLUMNS.map((col) => (
          <StaggerItem key={col.head} className="flex flex-col gap-2.5">
            <span className="font-body text-[0.75rem] font-bold uppercase tracking-[0.16em] text-rust">
              {col.head}
            </span>
            {col.links.map((l) => (
              <a key={l} href={FOOTER_HREFS[l]} className="font-body text-[0.875rem] text-cream/80 transition-colors hover:text-rust">
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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[0.75rem] text-smoke transition-colors hover:text-rust"
            >
              {s.label}
            </a>
          ))}
          <a href={`mailto:${contactEmail}`} className="font-body text-[0.75rem] text-smoke transition-colors hover:text-rust">
            {contactEmail}
          </a>
          <a
            href="https://www.simplemcmathematics.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[0.75rem] text-smoke transition-colors hover:text-rust"
          >
            Powered by SimpleMcMathematics
          </a>
        </div>
      </div>
    </footer>
  );
}
