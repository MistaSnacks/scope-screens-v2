import type { ReactNode } from "react";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { KineticText } from "@/components/motion/kinetic-text";
import { SectionEyebrow } from "@/components/section-eyebrow";

export function PageHero({
  eyebrow,
  title,
  lede,
  card,
  logo = false,
}: {
  eyebrow: string;
  /** Use "\n" for line breaks. */
  title: string;
  lede?: string;
  card?: ReactNode;
  logo?: boolean;
}) {
  return (
    <header className="px-5 pt-[7.5rem] md:shell-x md:pt-[9.375rem]">
      <div className="md:flex md:items-start md:justify-between md:gap-12">
        <Reveal className={card ? "md:max-w-[60%]" : undefined}>
          {logo ? (
            <Image
              src="/popcorn-logo.png"
              alt=""
              width={64}
              height={64}
              className="mb-5 h-12 w-auto md:h-14"
              priority
            />
          ) : null}
          <SectionEyebrow label={eyebrow} />
          <KineticText
            as="h1"
            className={`pulp mt-5 font-display text-[4rem] uppercase leading-[0.9] ${
              card ? "md:text-[5.5rem]" : "md:text-[6rem]"
            }`}
            text={title}
          />
          {lede ? (
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-[44ch] font-credits text-[1.25rem] leading-relaxed text-fg/75 md:text-[1.375rem]">
                {lede}
              </p>
            </Reveal>
          ) : null}
        </Reveal>
        {card ? (
          <Reveal as="aside" delay={0.12} className="mt-10 w-full md:mt-2 md:w-[21.25rem] md:shrink-0">
            {card}
          </Reveal>
        ) : null}
      </div>
    </header>
  );
}
