import { Reveal } from "@/components/motion/reveal";
import { KineticText } from "@/components/motion/kinetic-text";

export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  /** Use "\n" for line breaks. */
  title: string;
  lede?: string;
}) {
  return (
    <header className="px-5 pt-[120px] md:px-[90px] md:pt-[150px]">
      <Reveal className="flex items-center gap-3">
        <span className="h-px w-10 bg-curtain" />
        <span className="font-mono text-[12px] font-bold uppercase tracking-[0.3em] text-label">
          {eyebrow}
        </span>
      </Reveal>
      <KineticText
        as="h1"
        className="pulp mt-5 font-display text-[64px] uppercase leading-[0.9] md:text-[96px]"
        text={title}
      />
      {lede ? (
        <Reveal delay={0.12}>
          <p className="mt-5 max-w-[42ch] font-credits text-[20px] leading-relaxed text-fg/75 md:text-[22px]">
            {lede}
          </p>
        </Reveal>
      ) : null}
    </header>
  );
}
