"use client";

// Dialog chrome around the shared CheckoutPanel — the ticket flow itself lives
// in checkout-panel.tsx so the /events/[slug] page can embed it inline too.
import { useEffect, useState } from "react";
import type { CheckoutTarget } from "@/lib/wix-checkout";
import { CheckoutPanel } from "./checkout-panel";

export function CheckoutModal({ target, onClose }: { target: CheckoutTarget; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4"
      onClick={submitting ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Buy tickets for ${target.title}`}
        className="relative flex max-h-[90vh] w-full max-w-[30rem] flex-col gap-5 overflow-y-auto rounded-2xl border border-faint bg-stage p-7 text-fg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={submitting ? undefined : onClose}
          disabled={submitting}
          className="absolute right-4 top-4 font-body text-xl leading-none text-smoke hover:text-fg"
        >
          ×
        </button>

        <h2 className="pulp font-display text-[1.75rem] uppercase leading-none">{target.title}</h2>

        <CheckoutPanel target={target} onSubmittingChange={setSubmitting} />
      </div>
    </div>
  );
}
