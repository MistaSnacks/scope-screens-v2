import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { CONTACT_EMAIL, VENUE } from "@/lib/festival";

export const metadata: Metadata = {
  title: "Accessibility · Scope Screenings",
  description:
    "How we keep Scope Screenings open to everyone, venue access details, and how to request accommodations.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Built for access"
      title="Accessibility"
      updated="June 27, 2026"
      intro="Access is the whole point of Scope Screenings. We want every filmmaker and every guest in the room, so we work to make our screenings, our venue, and this site usable for everyone. If anything below falls short of what you need, tell us and we&rsquo;ll make it right."
    >
      <LegalSection heading="At the Venue">
        <p>
          Our home is {VENUE.name} at {VENUE.address}, {VENUE.city}. The
          screening room is step-free and wheelchair accessible, with
          accessible restrooms and reserved seating for guests who need it. If
          you use a wheelchair or have specific seating needs, let us know
          ahead of time and we&rsquo;ll hold the right spot for you.
        </p>
      </LegalSection>

      <LegalSection heading="Requesting Accommodations">
        <p>
          We&rsquo;re glad to arrange accommodations such as reserved or
          companion seating, assistive listening, captioning where available,
          or a quiet entry. Reach out at least a few days before a screening so
          we have time to set things up, and we&rsquo;ll confirm the details
          with you.
        </p>
      </LegalSection>

      <LegalSection heading="For Filmmakers">
        <p>
          If you&rsquo;re submitting or screening a film and need support with
          the entry process, captioning your work, or presenting on the night,
          we want to help. Fee waivers are available, and cost should never be
          the reason your film stays unseen.
        </p>
      </LegalSection>

      <LegalSection heading="This Website">
        <p>
          We aim for this site to work with keyboard navigation, screen
          readers, and reduced-motion settings, and we&rsquo;re always
          improving it. If you hit a barrier here, a page you can&rsquo;t use
          or content you can&rsquo;t reach, please tell us so we can fix it.
        </p>
      </LegalSection>

      <LegalSection heading="Tell Us What You Need">
        <p>
          Questions, requests, or feedback on accessibility? Email us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Scope%20Screenings%20Accessibility`}
            className="text-curtain underline-offset-2 hover:text-rust hover:underline"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          and we&rsquo;ll get back to you.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
