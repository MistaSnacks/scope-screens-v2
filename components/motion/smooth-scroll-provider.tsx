"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenisOptions, prefersReducedMotion } from "@/lib/motion";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const raf = useRef<((time: number) => void) | null>(null);

  useEffect(() => {
    // Reduced motion: native scroll, no Lenis, no bridge.
    if (prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);
    const instance = new Lenis(lenisOptions);
    setLenis(instance);

    // Bridge Lenis -> GSAP so any ScrollTrigger-driven effect stays in sync,
    // and drive Lenis from GSAP's single ticker.
    instance.on("scroll", ScrollTrigger.update);
    raf.current = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf.current);
    gsap.ticker.lagSmoothing(0);

    return () => {
      if (raf.current) gsap.ticker.remove(raf.current);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
