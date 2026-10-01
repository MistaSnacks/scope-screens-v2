"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./curtain-credits-hero.module.css";
import { getVelvetDataUrl } from "@/lib/velvet";
import { useTheme } from "./theme-provider";
import { PRIMARY_CREDITS, SECONDARY_CREDITS } from "@/lib/hero-nav";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Theatre-velvet drape. The folds are computed from the cloth's own coordinates
// (u across the width from the seam, v down the drop), so the SAME fold function
// drives the vertex relief, the per-pixel normals and the lighting. They are
// attached to the fabric: they lean as the hem trails the heading, gather as the
// curtain is drawn, and catch the light the way pile does. Everything is sized
// in cloth space (fold units), so it holds up at any resolution.
//
// Per plane (u = 0 at the seam where the two halves meet, 1 at the outer edge):
//   uProgress  0 closed .. 1 drawn open        uGather  how far the cloth bunches up
//   uLag       hem displacement vs the heading  uAmbient gain of the idle breathing
//   uFolds     folds across one half-curtain    uSide    -1 left, +1 right
const clothCommon = `
float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453123); }
float vnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), f);
}

// One fold in cross-section: a wide rounded crest (1.0) and a narrow tucked valley (0.0).
float foldCurve(float q) {
  float s = 0.5 - 0.5 * cos(q * 6.2831853);
  return 1.0 - pow(s, 1.7);
}

// Cloth height at material coordinate m (fold units from the seam), v down the
// drop (0 heading .. 1 hem), t seconds, amb the idle-motion gain.
float foldHeight(float m, float v, float t, float amb) {
  float q = m;
  q += 0.20 * sin(m * 0.83 + 1.7 + v * 1.1);               // folds wander, never ruler-straight
  q += v * 0.30 * sin(m * 0.51 + 4.1);                      // and flare toward the hem
  q += amb * 0.05 * sin(t * 0.55 + v * 2.4 + m * 0.9);      // slow breathing travels down the cloth
  float depth = 0.70 + 0.30 * vnoise(m * 0.7 + 3.0);        // some folds sit deeper than others
  float h = mix(0.5, foldCurve(q), depth);
  float q2 = m * 2.6 + 0.4 * sin(m * 1.7 + v * 2.0) + amb * 0.04 * sin(t * 0.8 + v * 3.1 + m * 1.9);
  return h * 0.86 + foldCurve(q2) * 0.14;                   // fine secondary wrinkles
}
`;

const vertexShader = `
precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform float uProgress;
uniform float uTime;
uniform float uSide;
uniform float uLag;
uniform float uGather;
uniform float uAmbient;
uniform float uFolds;
varying vec2 vUv;
varying vec2 vNdc;
${clothCommon}
void main() {
  vec3 pos = aVertexPosition;
  float u = uSide < 0.0 ? (1.0 - aTextureCoord.x) : aTextureCoord.x;
  float v = 1.0 - aTextureCoord.y;

  // Drawing the curtain bunches the cloth toward its outer edge rather than
  // sliding a flat sheet: the same fabric in less width, so folds deepen and
  // crowd together as it opens.
  float g = 1.0 - uGather * uProgress;
  pos.x = uSide + (pos.x - uSide) * g;

  // Heading is on the track; the hem trails it (uLag) and drifts on a faint
  // draft. The closed seam stays pinned so the halves never gap, and is freed
  // as the curtains part.
  float seamFree = smoothstep(0.08, 0.45, uProgress);
  float seamPin = mix(smoothstep(0.0, 0.3, u), 1.0, seamFree);
  float breeze = sin(v * 2.1 - uTime * 0.7 + u * 1.3) * 0.6 + sin(v * 3.7 - uTime * 1.1 + 1.7) * 0.4;
  pos.x += (uLag * v * v + breeze * 0.006 * pow(v, 1.5) * uAmbient) * seamPin;

  // Real relief, so perspective gives the folds parallax. Flat at the seam so
  // the lit edge stays a clean line, and pinned a little under the valance.
  float m = u * uFolds + (uSide > 0.0 ? 3.7 : 0.0);
  float h = foldHeight(m, v, uTime, uAmbient);
  float amp = 0.026 * (1.0 + 2.2 * uGather * uProgress);
  pos.z = (h - 0.55) * amp * smoothstep(0.0, 0.07, u) * smoothstep(0.0, 0.1, v);

  vUv = vec2(u, v);
  vec4 clip = uPMatrix * uMVMatrix * vec4(pos, 1.0);
  vNdc = clip.xy / clip.w;
  gl_Position = clip;
}
`;

const fragmentShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
varying vec2 vNdc;
uniform sampler2D velvetTexture;
uniform float uProgress;
uniform float uTime;
uniform float uSide;
uniform float uGather;
uniform float uAmbient;
uniform float uFolds;
${clothCommon}
void main() {
  float u = vUv.x;
  float v = vUv.y;
  float g = 1.0 - uGather * uProgress;
  float m = u * uFolds + (uSide > 0.0 ? 3.7 : 0.0);

  // Fold height and its slope across the cloth (central difference, in fold
  // units), turned into a surface normal. Bunching steepens the folds by 1/g.
  const float E = 0.02;
  float h = foldHeight(m, v, uTime, uAmbient);
  float dhdm = (foldHeight(m + E, v, uTime, uAmbient) - foldHeight(m - E, v, uTime, uAmbient)) / (2.0 * E);
  vec3 n = normalize(vec3(-uSide * dhdm * 0.26 / g, 0.0, 1.0));

  // Key light from above and the middle of the stage, so every fold has a lit
  // flank facing the centre and a shaded one facing the wings.
  vec3 L = normalize(vec3(-uSide * 0.62, 0.38, 0.70));
  float ndl = dot(n, L);
  float lit = pow(clamp(ndl * 0.5 + 0.5, 0.0, 1.0), 1.7);
  float ao = mix(0.28, 1.0, smoothstep(0.05, 0.62, h));      // valleys tuck into shadow

  // The velvet tile is stretched over the whole plane by texture coordinate, so
  // it is pinned to the cloth (it gathers and sways with the fabric). The lift
  // offsets the folds' shading, which would otherwise read darker overall.
  vec2 tuv = vec2(uSide < 0.0 ? 1.0 - u : u, 1.0 - v);
  vec3 albedo = texture2D(velvetTexture, tuv).rgb * 1.2;

  vec3 col = albedo * (0.16 + 1.1 * lit) * ao;

  // Velvet: fibres catch grazing light. A saturated sheen on lit flanks plus a
  // broad glow on the crests: deep red, never white.
  float graze = 1.0 - n.z;
  float sheen = smoothstep(0.05, 0.45, graze) * smoothstep(0.35, 0.95, ndl);
  float crestGlow = smoothstep(0.55, 1.0, h) * lit;
  col += vec3(0.62, 0.11, 0.075) * sheen * 0.85;
  col += vec3(0.30, 0.05, 0.035) * crestGlow;

  // Stage lighting: a pool on the middle of the house, falling off into the
  // wings, with the heading shadowed by the valance and the hem by the floor.
  float pool = 1.0 - 0.60 * smoothstep(0.25, 1.15, length(vec2(vNdc.x * 0.95, (vNdc.y - 0.15) * 0.8)));
  col *= pool;
  col *= mix(0.55, 1.0, smoothstep(0.0, 0.14, v));
  col *= mix(0.60, 1.0, smoothstep(1.0, 0.82, v));

  // Leading edge, measured in SCREEN width (u * g) so it keeps its thickness as
  // the cloth bunches. Closed, the centre is a soft overlap shadow where the two
  // drapes meet; as they part it rolls into a lit fold: bright crest, a shadow
  // valley tucked behind it, and a thin terminator at the very edge. The reveal
  // ramps with uProgress but caps at EDGE_MAX, the dialed-back reference level.
  float uS = u * g;
  float EDGE_MAX = 0.7;
  float edgeReveal = EDGE_MAX * smoothstep(0.05, 0.35, uProgress);
  float closedShade = mix(0.32, 1.0, smoothstep(0.0, 0.16, uS));
  float lip = smoothstep(0.014, 0.0, uS);
  float edgeCrest = smoothstep(0.05, 0.014, uS) * smoothstep(0.0, 0.014, uS);
  float valley = smoothstep(0.0, 0.07, uS) * smoothstep(0.22, 0.09, uS);
  float openShade = mix(1.0, 0.34, valley) * mix(1.0, 0.55, lip);
  col *= mix(closedShade, openShade, edgeReveal);
  col += vec3(0.30, 0.10, 0.045) * edgeCrest * edgeReveal;

  // Dither: the dark gradients would otherwise band in 8-bit.
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

interface PlaneLike {
  uniforms: {
    progress: { value: number };
    time: { value: number };
    side: { value: number };
    lag: { value: number };
    ambient: { value: number };
  };
  onRender: (cb: () => void) => PlaneLike;
  setRelativeTranslation: (translation: unknown) => void;
}

interface CurtainsLike {
  dispose: () => void;
  resize: () => void;
  enableDrawing: () => void;
  disableDrawing: () => void;
  renderer?: {
    gl?: WebGLRenderingContext;
  };
}

// How much the cloth bunches up as the curtains are drawn (fraction of its width
// lost at full open), and the cloth's idle sway: a damped spring that lets the
// hem trail the heading and swing once or twice when the scroll stops.
const GATHER = 0.4;
const SWAY_HZ = 0.85;
const SWAY_DAMPING = 0.3;
const FOLDS_PER_HALF = 6.5;
const HEM_LAG = 0.6; // hem displacement per unit of spring lag (1 = the whole slide)

// The 2025 sizzle reel "SS × AMC 2" (landscape, 0:55) from the Wix media library —
// plays muted/looped on the cinema screen the curtains reveal. 1080p is only ~23MB
// here. Poster is a real frame of the reel (Lex reacting with the popcorn box) so
// SSR/first-paint and reduced-motion show an on-brand still.
const SIZZLE_REEL_MP4 =
  "https://video.wixstatic.com/video/c51492_990803f9c25b4ea491c4180a6eb9a435/1080p/mp4/file.mp4";
const SIZZLE_REEL_POSTER =
  "https://static.wixstatic.com/media/c51492_990803f9c25b4ea491c4180a6eb9a435f003.jpg";
const POPCORN_LOGO = "/popcorn-logo.png";

export function CurtainCreditsHero({
  eyebrow = "Lexscope Presents",
  posterUrl = SIZZLE_REEL_POSTER,
  videoUrl = SIZZLE_REEL_MP4,
  ticketsHref = "/#tickets",
}: { eyebrow?: string; posterUrl?: string; videoUrl?: string; ticketsHref?: string } = {}) {
  const root = useRef<HTMLElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const leftPlaneEl = useRef<HTMLDivElement>(null);
  const rightPlaneEl = useRef<HTMLDivElement>(null);
  const logoOpeningRef = useRef<HTMLDivElement>(null);
  const reelVideoRef = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const frameScrimRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef({ value: 0 });
  // Cloth sim state: idle clock plus the hem, a spring chasing the heading's
  // progress (in progress units) so it trails and swings instead of tracking 1:1.
  const simRef = useRef({ t: 0, last: 0, hem: 0, hemV: 0 });
  const openFactorRef = useRef(0.86); // how far the velvet parts; overwritten in useGSAP (0.86 desktop / 0.92 mobile)
  const curtainsRef = useRef<CurtainsLike | null>(null);

  const { theme } = useTheme();
  const [velvetSrc, setVelvetSrc] = useState("");
  const [curtainsReady, setCurtainsReady] = useState(false);
  const [reelMuted, setReelMuted] = useState(true);
  const [textHidden, setTextHidden] = useState(false);
  // The reveal onUpdate re-drives the title/credits opacity every tick, so the
  // "Hide text" toggle flips this ref to make it stand down while hidden.
  const textHiddenRef = useRef(false);
  const screenVisibility = curtainsReady ? "visible" : "hidden";

  // The reel autoplays muted (browsers require it). The toggle flips audio and
  // re-plays so the unmute counts as a user gesture.
  const toggleReelSound = useCallback(() => {
    const v = reelVideoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setReelMuted(v.muted);
    void v.play().catch(() => {});
  }, []);

  const toggleText = useCallback(() => setTextHidden((t) => !t), []);

  // "Hide text" toggle: fade out ONLY what sits on the reel screen — the marquee
  // headline and its legibility scrim — so the reel plays clean. The "Now
  // Showing" nav credits live BELOW the framed reel (off the screen), so they
  // stay put. Flips the ref the reveal checks so it stops re-driving the title.
  useEffect(() => {
    textHiddenRef.current = textHidden;
    const targets = [titleRef.current, frameScrimRef.current].filter(Boolean);
    if (!targets.length) return;
    gsap.to(targets, {
      opacity: textHidden ? 0 : 1,
      y: 0,
      pointerEvents: textHidden ? "none" : "auto",
      duration: 0.4,
      ease: "power2.out",
      overwrite: true,
    });
  }, [textHidden]);

  // The procedural velvet is the single visual source for the valance and the
  // animated WebGL curtains. Folds and lighting come from the shader.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVelvetSrc(getVelvetDataUrl()));
    return () => window.cancelAnimationFrame(frame);
  }, [theme]);

  // WebGL velvet: two curtains.js planes textured with the procedural velvet. They
  // render into the z-22 canvas; as the scroll-driven progress goes 0 → 1 they
  // draw apart and the cloth bunches up toward the wings.
  useEffect(() => {
    if (!velvetSrc) return;
    let cancelled = false;
    let revealFrame: number | null = null;
    let visibility: IntersectionObserver | null = null;

    (async () => {
      try {
        const mod = await import("curtainsjs");
        if (
          cancelled ||
          !canvasContainerRef.current ||
          !leftPlaneEl.current ||
          !rightPlaneEl.current
        ) {
          return;
        }

        const { Curtains, Plane, Vec3 } = mod as unknown as {
          Curtains: new (opts: object) => CurtainsLike;
          Plane: new (renderer: CurtainsLike, el: HTMLElement, params: object) => PlaneLike;
          Vec3: new (x: number, y: number, z: number) => unknown;
        };

        const curtains = new Curtains({
          container: canvasContainerRef.current,
          pixelRatio: Math.min(2, window.devicePixelRatio),
          antialias: true,
          alpha: true,
          // Reveal the screen if WebGL is unavailable instead of leaving the
          // entire hero permanently blank.
          onError: () => {
            if (!cancelled) setCurtainsReady(true);
          },
          // Hero is pinned by ScrollTrigger, so disable curtains' own scroll watch;
          // the open is driven entirely by progress.
          watchScroll: false,
        });
        curtainsRef.current = curtains;
        if (!curtains.renderer?.gl) {
          setCurtainsReady(true);
          curtains.dispose();
          curtainsRef.current = null;
          return;
        }

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const sim = simRef.current;
        sim.t = 0;
        sim.last = 0;
        sim.hem = progressRef.current.value;
        sim.hemV = 0;

        const commonParams = {
          widthSegments: 120,
          heightSegments: 40,
          vertexShader,
          fragmentShader,
        };
        const makeUniforms = (side: number) => ({
          progress: { name: "uProgress", type: "1f", value: 0 },
          time: { name: "uTime", type: "1f", value: 0 },
          side: { name: "uSide", type: "1f", value: side },
          lag: { name: "uLag", type: "1f", value: 0 },
          gather: { name: "uGather", type: "1f", value: GATHER },
          ambient: { name: "uAmbient", type: "1f", value: 0 },
          folds: { name: "uFolds", type: "1f", value: FOLDS_PER_HALF },
        });

        const leftPlane = new Plane(curtains, leftPlaneEl.current, {
          ...commonParams,
          uniforms: makeUniforms(-1),
        });
        const rightPlane = new Plane(curtains, rightPlaneEl.current, {
          ...commonParams,
          uniforms: makeUniforms(1),
        });

        // Advance the cloth once per frame, on the real clock (a fixed per-frame
        // step runs the sway at double speed on 120Hz displays). The hem is an
        // under-damped spring after the heading: it trails while the curtain is
        // drawn and swings once or twice when the scroll stops.
        const omega = 2 * Math.PI * SWAY_HZ;
        const stepSim = () => {
          const now = performance.now();
          const dt = sim.last ? Math.min((now - sim.last) / 1000, 1 / 20) : 1 / 60;
          sim.last = now;
          sim.t += dt;
          const p = progressRef.current.value;
          // A scroll jump (restored position, refresh) shouldn't whip the hem.
          if (Math.abs(sim.hem - p) > 0.6) {
            sim.hem = p;
            sim.hemV = 0;
          }
          const steps = Math.max(1, Math.ceil(dt * 120));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            const acc = omega * omega * (p - sim.hem) - 2 * SWAY_DAMPING * omega * sim.hemV;
            sim.hemV += acc * h;
            sim.hem += sim.hemV * h;
          }
        };

        const tick = (plane: PlaneLike, side: number, el: HTMLDivElement | null) => {
          const p = progressRef.current.value;
          // `|| ` (not `??`) so a 0-size measurement during a racy mount falls
          // back too, instead of collapsing the translation and misaligning the
          // halves.
          const width = el?.offsetWidth || window.innerWidth / 2;
          // The seam travels openFactor of the half-width; the bunching eats
          // GATHER of that on its own, so the slide only covers the difference.
          const slide = openFactorRef.current - GATHER;
          const lag = Math.max(-0.35, Math.min(0.35, sim.hem - p));

          plane.uniforms.progress.value = p;
          plane.uniforms.time.value = sim.t;
          // Hem offset in plane-local units (a plane spans 2), signed toward +x.
          plane.uniforms.lag.value = side * lag * slide * 2 * HEM_LAG;
          plane.uniforms.ambient.value = reducedMotion ? 0 : Math.min(1, sim.t / 3);
          // y locked to 0 so it parts dead-flat horizontally.
          plane.setRelativeTranslation(new Vec3(side * p * width * slide, 0, 0));
        };
        leftPlane.onRender(() => {
          stepSim();
          tick(leftPlane, -1, leftPlaneEl.current);
        });
        let firstFrame = true;
        rightPlane.onRender(() => {
          tick(rightPlane, 1, rightPlaneEl.current);
          if (firstFrame) {
            firstFrame = false;
            // onRender runs immediately before Curtains.js draws. Reveal on the
            // next browser frame so the real curtain pixels have been composited.
            revealFrame = window.requestAnimationFrame(() => {
              if (!cancelled) setCurtainsReady(true);
            });
          }
        });

        // The hero is only worth rendering while it's on screen; once the page
        // has scrolled past it, stop drawing so the rest of the site stays smooth.
        if (root.current && "IntersectionObserver" in window) {
          visibility = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) curtains.enableDrawing();
            else curtains.disableDrawing();
          });
          visibility.observe(root.current);
        }

        // Re-measure after the planes exist alongside the pinned hero so the two
        // halves seat exactly against center on refresh and restored scroll.
        curtains.resize();
        ScrollTrigger.refresh();
      } catch {
        if (!cancelled) setCurtainsReady(true);
      }
    })();

    return () => {
      cancelled = true;
      if (revealFrame !== null) window.cancelAnimationFrame(revealFrame);
      visibility?.disconnect();
      curtainsRef.current?.dispose();
      curtainsRef.current = null;
    };
  }, [velvetSrc]);

  // The curtains part as you SCROLL through the hero (pinned + scrubbed), then
  // settle slightly open — framing the screen. SAME scroll mechanism as before;
  // it now drives the WebGL `progress` instead of CSS panel transforms.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { mobile, reduced } = ctx.conditions as {
            desktop: boolean;
            mobile: boolean;
            reduced: boolean;
          };
          // Framing open: curtains rest as side drapes that frame a large
          // screen (closer to the reference), the cloth gathered into folds.
          openFactorRef.current = mobile ? 0.84 : 0.76;

          // Reduced motion: skip the scroll choreography, show the framed hero
          // with the logo opening already cleared away.
          if (reduced) {
            progressRef.current.value = 1;
            gsap.set(spotRef.current, { opacity: 1 });
            gsap.set(logoOpeningRef.current, { opacity: 0 });
            gsap.set(titleRef.current, { opacity: 1, y: 0 });
            gsap.set(creditsRef.current, { opacity: 1, y: 0, pointerEvents: "auto" });
            // No scroll choreography to trigger it, so roll the reel now.
            reelVideoRef.current?.play().catch(() => {});
            return;
          }

          // Logo opening starts visible on the closed curtain.
          gsap.set(logoOpeningRef.current, { opacity: 1, y: 0 });

          // Title + credits fade in tracking the curtain progress DIRECTLY, so
          // the reveal is fully reversible — scrub the curtains back toward
          // closed and the title/credits fade back out with them. (Deliberately
          // unlike the main build, which latches them in once revealed.) The
          // title's fade is keyed to begin as the popcorn logo lifts away
          // (~0.25), then resolves as the curtains finish opening (~0.9) — a
          // picture-esque handoff, not a quick pop; the credits follow a beat
          // later.
          gsap.set(titleRef.current, { opacity: 0, y: 16 });
          gsap.set(creditsRef.current, { opacity: 0, y: 12, pointerEvents: "none" });

          const titleEase = gsap.parseEase("sine.inOut");
          const ctaEase = gsap.parseEase("power2.out");
          let videoStarted = false; // reel rolls once when the curtains hit full open

          // Progress starts at 0 (closed); scroll scrubs it to 1 (framed), then
          // the pinned hero holds before it scrolls away.
          gsap
            .timeline({
              scrollTrigger: {
                trigger: root.current,
                start: "top top",
                end: mobile ? "+=140%" : "+=190%",
                pin: true,
                scrub: 0.6,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
              // Drives the reversible hero reveal + the one-shot reel start.
              // Runs every tick (incl. the scrub settle) so the fades track the
              // curtains BOTH ways and full-open is caught even after scroll
              // stops.
              onUpdate: () => {
                const p = progressRef.current.value;

                // Keyed off p directly (not a latched max), so scrubbing the
                // curtains back toward closed fades the title/credits back out
                // with them. The title begins as the popcorn logo finishes
                // lifting away (~0.25) and resolves across the rest of the open
                // (~0.9); the credits follow a beat later.
                const ctaO = ctaEase(Math.min(1, Math.max(0, (p - 0.45) / 0.5)));
                // The "Now Showing" nav credits sit below the framed reel, not on
                // the screen, so "Hide text" never touches them — always track the
                // reveal so they stay visible and clickable while the reel plays.
                gsap.set(creditsRef.current, {
                  opacity: ctaO,
                  y: 12 * (1 - ctaO),
                  // Clickable only while essentially fully revealed.
                  pointerEvents: ctaO > 0.95 ? "auto" : "none",
                });

                // The on-screen marquee headline is the only thing "Hide text"
                // drops; while it's on, leave it where the toggle parked it
                // instead of re-driving it here.
                if (!textHiddenRef.current) {
                  const titleO = titleEase(Math.min(1, Math.max(0, (p - 0.25) / 0.65)));
                  gsap.set(titleRef.current, { opacity: titleO, y: 16 * (1 - titleO) });
                }

                // Roll the sizzle reel the instant the curtains hit full open,
                // so the reveal lands on a moving picture rather than a frozen
                // poster. Once started it keeps playing even if the curtains
                // scrub shut (it's hidden behind them anyway) — only a fade, not
                // the reel, reverses.
                const v = reelVideoRef.current;
                if (v && !videoStarted && p >= 0.999) {
                  videoStarted = true;
                  v.play().catch(() => {});
                }
              },
            })
            .to(progressRef.current, { value: 1, ease: "none", duration: 1 }, 0)
            // The logo opening (with its scroll cue) lifts + fades over the first
            // third of the open, before the curtains are fully parted.
            .to(
              logoOpeningRef.current,
              { opacity: 0, y: -48, duration: 0.4, ease: "power2.in" },
              0
            )
            .to({}, { duration: 0.6 });
        }
      );
    },
    { scope: root }
  );

  // Spotlight follows the cursor across the revealed screen.
  useEffect(() => {
    const el = spotRef.current;
    const host = root.current;
    if (!el || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r0 = host.getBoundingClientRect();
    gsap.set(el, { x: r0.width / 2, y: r0.height * 0.46 });

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      xTo(e.clientX - r.left);
      yTo(e.clientY - r.top);
    };
    host.addEventListener("pointermove", onMove);
    return () => host.removeEventListener("pointermove", onMove);
  }, []);

  // Browser back/forward (bfcache) restores this page with frozen GSAP pin
  // measurements and a stale curtains canvas — the curtains end up misaligned or
  // stuck open. On a restore, re-measure the curtains and the pinned
  // ScrollTrigger so scroll once again drives the open 0 → 1 from a clean state.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return; // a fresh load already mounts clean
      curtainsRef.current?.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <section
      ref={root}
      className={`${styles.hero} ${curtainsReady ? "" : styles.awaitingCurtains}`}
      aria-label="Scope Screenings"
    >
      {/* Preload the first-paint curtain image so it's hot before layout. */}
      <link rel="preload" as="image" href="/curtain-closed.jpg" fetchPriority="high" />

      {/* The revealed stage (z-10): framed silver screen + credits beneath.
          Behind the curtains (z-20); hidden until the curtains have painted. */}
      <div className={styles.screen} style={{ visibility: screenVisibility }}>
        <div className={styles.topMarquee} aria-hidden>
          A LexScope Production · Scope Screenings
        </div>

        {/* Framed silver screen — the sizzle reel plays here, muted by default. */}
        <div className={styles.silverFrame}>
          <video
            ref={reelVideoRef}
            className={styles.frameVideo}
            muted
            loop
            playsInline
            preload="auto"
            poster={posterUrl}
            aria-hidden
          >
            <source src={videoUrl} type="video/mp4" />
          </video>

          <div className={styles.projectorGlow} aria-hidden />

          {/* Legibility scrim under the headline. Fades with the headline on
              "Hide text" so the reel underneath plays genuinely clean. */}
          <div ref={frameScrimRef} className={styles.frameScrim} aria-hidden />

          {/* The headline, on the screen — the marquee title over the reel. */}
          <div ref={titleRef} className={styles.screenTitle}>
            <span className={styles.screenEyebrow}>Feature Presentation</span>
            <h1 className={styles.screenWordmark}>
              Scope
              <br />
              Screenings
            </h1>
            <span className={styles.screenTagline}>
              Seattle&rsquo;s Underground Film Festival
            </span>
          </div>

          <div className={styles.recTick} aria-hidden>
            <span className={styles.recDot} />
            REC
          </div>
          <div className={styles.reelCounter} aria-hidden>
            REEL 01 / 01
          </div>

          {/* Hide Text (left) drops the on-screen marquee headline (and its
              scrim) so the reel plays clean — the nav credits below the frame
              stay put; Sound (right) unmutes it. */}
          <button
            type="button"
            onClick={toggleText}
            aria-pressed={textHidden}
            aria-label={textHidden ? "Show the hero text" : "Hide the hero text to watch the reel"}
            className={`${styles.soundToggle} ${styles.hideToggle}`}
          >
            <EyeIcon off={textHidden} />
            {textHidden ? "Show Text" : "Hide Text"}
          </button>

          <button
            type="button"
            onClick={toggleReelSound}
            aria-label={reelMuted ? "Turn the reel sound on" : "Mute the reel"}
            className={styles.soundToggle}
          >
            <span className={styles.soundIcon} aria-hidden />
            {reelMuted ? "Sound On" : "Mute"}
          </button>
        </div>

        <div className={styles.subLabel} aria-hidden>
          <span />
          Now Showing
          <span />
        </div>

        {/* Nav as credits — two primary actions + one secondary line. */}
        <div ref={creditsRef} className={styles.creditsUnder}>
          <div className={styles.creditsPrimary}>
            {PRIMARY_CREDITS.map((c, i) => (
              <a
                key={c.label}
                href={i === 0 ? ticketsHref : c.href}
                className={`${styles.creditPrimary} ${i === 0 ? styles.creditSpot : ""}`}
              >
                <span className={styles.creditDot} aria-hidden />
                <span className={styles.creditRole}>{c.role}</span>
                <span className={styles.creditLabel}>{c.label}</span>
              </a>
            ))}
          </div>
          {SECONDARY_CREDITS.map((c) => (
            <a key={c.label} href={c.href} className={styles.creditSecondary}>
              <span className={styles.creditDot} aria-hidden />
              {c.label}
            </a>
          ))}
        </div>
      </div>

      {/* Follow spotlight across the revealed stage. */}
      <div
        ref={spotRef}
        aria-hidden
        className={styles.spot}
        style={{ visibility: screenVisibility }}
      />

      {/* Logo opening (z-30) — glows centered on the closed curtain, with its
          scroll cue directly beneath; lifts away on scroll. */}
      <div ref={logoOpeningRef} className={styles.logoOpening}>
        <div className={styles.logoTonight}>{eyebrow}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={POPCORN_LOGO} alt="Scope Screenings" className={styles.logoImg} />
        <div aria-hidden className={styles.scrollCue}>
          Scroll to enter
          <span className={styles.scrollCueLine} />
        </div>
      </div>

      {/* First-paint curtain stand-in (SSR), swapped for the live canvas. */}
      <div aria-hidden className={styles.curtainStandIn} />

      {/* WebGL velvet curtain planes. The <img> is the texture sampler only. */}
      <div ref={leftPlaneEl} aria-hidden className={`${styles.plane} ${styles.planeL}`}>
        {velvetSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={velvetSrc} alt="" data-sampler="velvetTexture" style={{ display: "none" }} />
        ) : null}
      </div>
      <div ref={rightPlaneEl} aria-hidden className={`${styles.plane} ${styles.planeR}`}>
        {velvetSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={velvetSrc} alt="" data-sampler="velvetTexture" style={{ display: "none" }} />
        ) : null}
      </div>
      <div ref={canvasContainerRef} aria-hidden className={styles.glCanvas} />

      <div aria-hidden className={styles.letterboxBottom} />
    </section>
  );
}

// Eye / eye-off glyph for the "Hide text" control, sized to sit beside the
// button's mono label like the sound button's play triangle.
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {off ? (
        <>
          <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.16 3.19m-3.36 2.32A9.5 9.5 0 0 1 12 18c-6.5 0-10-7-10-7a13.2 13.2 0 0 1 4-4.51" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          <path d="m2 2 20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}
