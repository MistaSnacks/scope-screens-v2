import { KineticText } from "@/components/motion/kinetic-text";
import { Hoverable } from "@/components/motion/hoverable";

export function ClosingBand({
  title,
  body,
  href,
  cta,
  variant = "primary",
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <section className="border-t border-hairline bg-bg-deep px-5 py-28 text-center md:shell-x">
      <KineticText
        as="h2"
        className="pulp font-display text-[3rem] uppercase leading-[0.95] md:text-[4.5rem]"
        text={title}
      />
      <p className="mx-auto mt-5 max-w-[48ch] font-credits text-[1.125rem] text-fg/75">
        {body}
      </p>
      <Hoverable magnetic strength={0.35} className="mt-8 inline-block">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={variant === "secondary" ? "btn-secondary" : "btn-primary"}
        >
          {cta}
        </a>
      </Hoverable>
    </section>
  );
}
