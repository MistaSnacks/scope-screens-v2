# Uniform Desktop Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop design (≥1024px) scale uniformly like a zoom — same look at every desktop width, capped on very wide monitors — while leaving mobile/tablet (<1024px) pixel-identical to today.

**Architecture:** A single fluid root `font-size` (clamped) is the only "zoom knob." Tailwind's rem-based utilities already ride it; a scripted, tested codemod converts the 429 hard-coded arbitrary `[<n>px]` utilities to `rem` so the rest of the design rides it too. Because `rem` at the default 16px root equals the original px exactly, the conversion is behavior-neutral below 1024px and only takes effect where the root font scales. The hero (already fluid via `vw`/`clamp`, WebGL-measured) is deliberately untouched.

**Tech Stack:** Next.js 16, Tailwind CSS v4, React 19, Vitest, Playwright (existing `.shots/` harness).

**Spec:** `docs/superpowers/specs/2026-06-16-uniform-desktop-scaling-design.md`

---

## File Structure

- `app/globals.css` — **modify**: add the gated fluid-root-font media query (the zoom knob).
- `scripts/px-to-rem.mjs` — **create**: pure transform `convertClassNamePx(source)` (no I/O).
- `scripts/px-to-rem.run.mjs` — **create**: CLI runner that walks `app/` + `components/` and applies the transform in place.
- `scripts/px-to-rem.test.ts` — **create**: Vitest unit tests for the transform.
- `.shots/verify-scale.mjs` — **create**: width-parametrized homepage screenshot capture for before/after comparison.
- All `app/**/*.tsx` + `components/**/*.tsx` containing arbitrary `[<n>px]` utilities — **modify** (mechanically, by the runner).

---

## Task 1: Capture the visual baseline (before any change)

**Files:**
- Create: `.shots/verify-scale.mjs`

This must run **before** Tasks 2–4 so we have a true pre-change reference. It screenshots the homepage at six widths into a target subdirectory.

- [ ] **Step 1: Write the capture script**

```javascript
// .shots/verify-scale.mjs
// Usage: node .shots/verify-scale.mjs <outDir>
// Screenshots the homepage at six widths into .shots/<outDir>/<width>.png
// Requires `npm run dev` (or `npm run build && npm start`) on http://localhost:3000.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage: node .shots/verify-scale.mjs <outDir>");
  process.exit(1);
}
const WIDTHS = [375, 800, 1024, 1440, 1920, 2560];
const dir = `.shots/${outDir}`;
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  // Settle hero/GSAP, then disable animations for a stable frame.
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/${width}.png`, fullPage: true });
  await page.close();
  console.log(`${dir}/${width}.png`);
}
await browser.close();
```

- [ ] **Step 2: Start the dev server in a separate shell**

Run: `npm run dev`
Expected: server ready on `http://localhost:3000`.

- [ ] **Step 3: Capture the baseline**

Run: `node .shots/verify-scale.mjs baseline`
Expected: prints six paths `.shots/baseline/375.png … .shots/baseline/2560.png`.

- [ ] **Step 4: Commit only the script (not the capture PNGs)**

```bash
git add .shots/verify-scale.mjs
git commit -m "test(scale): width-parametrized homepage capture for scaling verification"
```

Note: `.shots/` is tracked in this repo, but the `baseline/` and `after/` PNGs are throwaway verification artifacts — do **not** `git add` them. Stage only `verify-scale.mjs`.

---

## Task 2: Add the fluid root font-size (the zoom knob)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the media query**

Add this block to `app/globals.css` immediately after the `html, body { … }` base rule (around line 66, after the `background`/`color` declarations):

```css
/* ------------------------------------------------------------------ */
/*  Uniform desktop scaling.                                           */
/*  Above 1024px the whole design rides ONE fluid root font-size, so   */
/*  it scales like a zoom (capped) instead of snapping. Reference      */
/*  width 1440px → root 16px (scale 1.0). 1.1111vw = 100vw/1440×16.    */
/*  Cap 19.2px is reached at 1728px → past that the design stops       */
/*  growing and margins take over. Below 1024px the rule does not      */
/*  apply, so the root stays 16px and mobile/tablet are unchanged.     */
/* ------------------------------------------------------------------ */
@media (min-width: 1024px) {
  :root {
    font-size: clamp(11.38px, 1.1111vw, 19.2px);
  }
}
```

- [ ] **Step 2: Verify it parses (build the CSS)**

Run: `npm run build`
Expected: build succeeds (no CSS parse error).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(scale): fluid root font-size above 1024px (capped zoom knob)"
```

---

## Task 3: Write and test the px→rem codemod

**Files:**
- Create: `scripts/px-to-rem.mjs`
- Test: `scripts/px-to-rem.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// scripts/px-to-rem.test.ts
import { describe, it, expect } from "vitest";
import { convertClassNamePx } from "./px-to-rem.mjs";

describe("convertClassNamePx", () => {
  it("converts a whole-number px utility to rem (÷16)", () => {
    const { out, count } = convertClassNamePx('className="text-[56px]"');
    expect(out).toBe('className="text-[3.5rem]"');
    expect(count).toBe(1);
  });

  it("converts gutter and offset utilities", () => {
    const { out } = convertClassNamePx("px-[90px] scroll-mt-[120px]");
    expect(out).toBe("px-[5.625rem] scroll-mt-[7.5rem]");
  });

  it("converts a decimal px value", () => {
    const { out } = convertClassNamePx("gap-[6.5px]");
    expect(out).toBe("gap-[0.40625rem]");
  });

  it("preserves responsive variant prefixes", () => {
    const { out } = convertClassNamePx("md:text-[80px]");
    expect(out).toBe("md:text-[5rem]");
  });

  it("keeps border widths in px", () => {
    const { out, skipped } = convertClassNamePx("border-r-[3px]");
    expect(out).toBe("border-r-[3px]");
    expect(skipped).toContain("border-r-[3px]");
  });

  it("keeps <=2px hairlines in px", () => {
    const { out } = convertClassNamePx("h-[1px] w-[2px]");
    expect(out).toBe("h-[1px] w-[2px]");
  });

  it("does not touch compound shadow/calc values", () => {
    const src = "shadow-[0_20px_45px_rgba(11,10,9,0.07)] w-[calc(100%+10px)]";
    const { out, count } = convertClassNamePx(src);
    expect(out).toBe(src);
    expect(count).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run scripts/px-to-rem.test.ts`
Expected: FAIL — cannot resolve `./px-to-rem.mjs` (module not created yet).

- [ ] **Step 3: Write the transform module**

```javascript
// scripts/px-to-rem.mjs
// Converts Tailwind arbitrary `[<n>px]` utilities to `[<n/16>rem]`.
// Pure string transform — no filesystem access (so it is unit-testable).
//
// Matches ONLY the simple form `<prefix>[<number>px]`, identical to the audit
// grep `\[[0-9]+px\]`. Compound values (`shadow-[0_20px_…]`, `[calc(…px)]`)
// start with a non-digit after `[` and are never matched.
//
// Skips (keeps px): border/ring/outline widths, and values <= 2px (hairlines),
// so thin lines stay crisp and do not scale.

const TOKEN = /([\w:./-]*)\[(\d+(?:\.\d+)?)px\]/g;

export function convertClassNamePx(source) {
  let count = 0;
  const skipped = [];
  const out = source.replace(TOKEN, (match, prefix, numStr) => {
    const px = parseFloat(numStr);
    if (/border|ring|outline/.test(prefix) || px <= 2) {
      skipped.push(match);
      return match;
    }
    // x/16 has at most 5 decimal places (e.g. 6.5/16 = 0.40625); toFixed(5)
    // is exact, and unary + trims trailing zeros (56/16 → 3.5).
    const rem = +(px / 16).toFixed(5);
    count += 1;
    return `${prefix}[${rem}rem]`;
  });
  return { out, count, skipped };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/px-to-rem.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/px-to-rem.mjs scripts/px-to-rem.test.ts
git commit -m "feat(scale): tested px→rem codemod transform"
```

---

## Task 4: Run the codemod across the app

**Files:**
- Create: `scripts/px-to-rem.run.mjs`
- Modify: `app/**/*.tsx`, `components/**/*.tsx` (mechanical, in place)

- [ ] **Step 1: Write the runner**

```javascript
// scripts/px-to-rem.run.mjs
// Walks app/ and components/ and applies convertClassNamePx in place.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { convertClassNamePx } from "./px-to-rem.mjs";

const ROOTS = ["app", "components"];
const EXT = /\.tsx?$/;

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (EXT.test(name)) acc.push(p);
  }
  return acc;
}

let total = 0;
const allSkipped = [];
for (const file of ROOTS.flatMap((r) => walk(r))) {
  const src = readFileSync(file, "utf8");
  const { out, count, skipped } = convertClassNamePx(src);
  allSkipped.push(...skipped);
  if (count > 0) {
    writeFileSync(file, out);
    console.log(`${file}: ${count}`);
  }
  total += count;
}
console.log(`\nTotal converted: ${total}`);
console.log(`Kept px: ${[...new Set(allSkipped)].sort().join(", ") || "(none)"}`);
```

- [ ] **Step 2: Confirm the pre-run token count**

Run: `grep -rohE '\[[0-9]+px\]' components app | wc -l`
Expected: `429`.

- [ ] **Step 3: Run the codemod**

Run: `node scripts/px-to-rem.run.mjs`
Expected: per-file conversion counts, then `Total converted: 424` and `Kept px: [1px], [2px], border-r-[3px]`.

- [ ] **Step 4: Confirm only the intended px tokens remain**

Run: `grep -rohE '\[[0-9]+px\]' components app | sort | uniq -c`
Expected: only the 5 skipped tokens remain — `[1px]` ×1, `[2px]` ×2, `border-r-[3px]` ×2.

- [ ] **Step 5: Confirm no malformed rem tokens were produced**

Run: `grep -rohE '\[[0-9.]+rem\]' components app | grep -vE '^\[[0-9]+(\.[0-9]+)?rem\]$' | head`
Expected: no output (every produced token is a clean `[<number>rem]`).

- [ ] **Step 6: Review the diff by hand**

Run: `git diff --stat && git diff components/buy-tickets.tsx`
Expected: only `[<n>px]` → `[<n>rem]` substitutions inside `className` strings; no structural changes. Spot-check 2–3 files.

- [ ] **Step 7: Build and test**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass (including the codemod tests).

- [ ] **Step 8: Commit**

```bash
git add scripts/px-to-rem.run.mjs app components
git commit -m "feat(scale): convert arbitrary px utilities to rem so desktop rides the zoom knob"
```

---

## Task 5: Visual verification (after)

**Files:** none (uses `.shots/verify-scale.mjs` from Task 1)

- [ ] **Step 1: Rebuild/restart and capture the after-state**

With the dev server running (restart if needed to pick up changes):
Run: `node .shots/verify-scale.mjs after`
Expected: six paths `.shots/after/375.png … .shots/after/2560.png`.

- [ ] **Step 2: Confirm mobile/tablet pixel-identity**

Open `.shots/baseline/375.png` vs `.shots/after/375.png`, and `.shots/baseline/800.png` vs `.shots/after/800.png`.
Expected: **visually identical** (the conversion is a no-op below 1024px).

Optional exact check (if ImageMagick is available):
Run: `compare -metric AE .shots/baseline/375.png .shots/after/375.png /dev/null; echo; compare -metric AE .shots/baseline/800.png .shots/after/800.png /dev/null`
Expected: `0` (or near-0) differing pixels for both.

- [ ] **Step 3: Confirm uniform scaling above the boundary**

Open `.shots/after/1024.png`, `1440.png`, `1920.png`, `2560.png` in order.
Expected: the same desktop layout at increasing scale through 1440; 1920 and 2560 look the same as ~1728px (capped) with growing side margin. No broken/overlapping/clipped sections; the hero remains coherent with the body.

- [ ] **Step 4: Stop the dev server.**

---

## Task 6: Replicate to `main`

**Files:** on the `main` branch — `app/globals.css`, `scripts/px-to-rem.mjs`, `scripts/px-to-rem.run.mjs`, `scripts/px-to-rem.test.ts`, and its own `app/**` + `components/**`.

`main` has fewer files than ALT but the same px-utility pattern, so the same knob + codemod apply.

- [ ] **Step 1: Branch off main**

```bash
git checkout main && git pull && git checkout -b scale/uniform-desktop
```

- [ ] **Step 2: Bring over the engine + tooling from ALT**

```bash
git checkout ALT -- scripts/px-to-rem.mjs scripts/px-to-rem.run.mjs scripts/px-to-rem.test.ts .shots/verify-scale.mjs
```

- [ ] **Step 3: Add the same media query to `app/globals.css`**

Add the identical `@media (min-width: 1024px) { :root { font-size: clamp(11.38px, 1.1111vw, 19.2px); } }` block (with the comment header from Task 2) after the `html, body` base rule.

- [ ] **Step 4: Confirm main's pre-run token count, then run the codemod**

```bash
grep -rohE '\[[0-9]+px\]' components app | wc -l   # record this number N
node scripts/px-to-rem.run.mjs
```
Expected: `Total converted: N − (count of border/ring/outline + <=2px tokens)`; the runner prints the kept-px list.

- [ ] **Step 5: Verify remaining tokens, build, test**

```bash
grep -rohE '\[[0-9]+px\]' components app | sort | uniq -c   # only border/hairline tokens remain
npm run build && npm test
```
Expected: only border/hairline px remain; build + tests pass.

- [ ] **Step 6: Capture and visually verify (same as Task 5)**

Run the dev server, then `node .shots/verify-scale.mjs main-after`; confirm 375/800 unchanged and 1024–2560 scale + cap.

- [ ] **Step 7: Commit**

```bash
git add scripts app components app/globals.css .shots/verify-scale.mjs
git commit -m "feat(scale): uniform desktop scaling on main (fluid root + px→rem)"
```

---

## Self-Review

- **Spec coverage:**
  - Scaling engine (clamp, 1440 ref, 1728 cap, ≥1024 gate) → Task 2. ✓
  - px→rem conversion with border/≤2px exclusions → Tasks 3–4. ✓
  - Hero/`--band-skew` untouched → guaranteed by codemod scope (className `[Npx]` only; verified in Task 4 Step 6 diff). ✓
  - Both branches → Tasks 1–5 (ALT) + Task 6 (main). ✓
  - Verification: pixel-identity <1024, scaling ≥1024, build, test → Tasks 4–5. ✓
- **Placeholder scan:** none — all steps carry real code/commands/expected output.
- **Type consistency:** `convertClassNamePx(source) → { out, count, skipped }` is defined identically in the module (Task 3 Step 3), consumed in the test (Task 3 Step 1) and the runner (Task 4 Step 1). ✓
