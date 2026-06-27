import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { FounderBand } from "@/components/founder-band";
import { PartnersMarquee } from "@/components/partners-marquee";
import { Reveal } from "@/components/motion/reveal";
import { KineticText } from "@/components/motion/kinetic-text";
import { getSiteContent } from "@/lib/site-content";
import { isPageHidden } from "@/lib/nav";

export const metadata: Metadata = {
  title: "About · Scope Screenings",
  description:
    "Seattle’s underground film festival, a live, monthly short-film night built for the filmmakers the industry tends to overlook.",
};

export default async function AboutPage() {
  const content = await getSiteContent();
  if (isPageHidden(content, "about")) notFound();
  const page = content.aboutPage;

  return (
    <main className="min-h-screen bg-bg">
      {/* (a) Header */}
      <PageHero
        eyebrow={page?.eyebrow ?? "About the Festival"}
        title={page?.title ?? "We Put The Fun\nBack In Film Fests"}
        lede={page?.lede ?? "Scope Screenings is Seattle’s underground film festival, a live, monthly short-film night built for the filmmakers the industry tends to overlook. Tropical, wavy energy meets the illest shorts in the PNW."}
        logo
      />

      {/* (b) What Is Scope Screenings */}
      <section className="mt-16 border-t border-hairline bg-bg-alt px-5 py-24 md:shell-x">
        <div className="lg:flex lg:gap-16">
          {/* Left column */}
          <Reveal className="lg:w-[25rem] lg:shrink-0">
            <SectionEyebrow label="The short version" />
            <KineticText
              as="h2"
              className="pulp font-display text-[2.75rem] uppercase leading-[0.95] md:text-[3.5rem] mt-5"
              text={"What Is\nScope Screenings"}
            />
          </Reveal>

          {/* Right column */}
          <Reveal delay={0.1} className="mt-8 max-w-[60ch] space-y-6 font-credits text-[1.125rem] leading-relaxed text-fg/85 md:text-[1.1875rem] lg:mt-0">
            <p>
              Founded in June 2022, Scope Screenings is a live short-film festival that runs the
              last Tuesday of every month, June through December, at the Langston Hughes Performing
              Arts Institute in Seattle&rsquo;s Central District. Each night puts ten directors and
              ten films, shorts, music videos, docs, animation, experiments, all twenty minutes or
              less, on a big screen in front of a packed house of around 300 people.
            </p>
            <p>
              But it was never just a screening. Scope was built to uplift Black, brown, tan, and
              underrepresented creators, to give them access, collaboration, and a room that shows
              up. Doors at 6:30, lights down at 7:30, and a filmmaker Q&amp;A and mixer to close the
              night.
            </p>
          </Reveal>
        </div>
      </section>

      {/* (c) Founder — red band */}
      <FounderBand eyebrow="Meet the Founder" />

      {/* (d) Partners */}
      <PartnersMarquee />
    </main>
  );
}
