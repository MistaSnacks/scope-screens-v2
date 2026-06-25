import { Reveal } from "@/components/motion/reveal";

export function SectionEyebrow({
  label,
  centered = false,
}: {
  label: string;
  centered?: boolean;
}) {
  return (
    <Reveal
      className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}
    >
      <span className="h-px w-10 bg-curtain" />
      <span className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.3em] text-label">
        {label}
      </span>
      {centered ? <span className="h-px w-10 bg-curtain" /> : null}
    </Reveal>
  );
}
