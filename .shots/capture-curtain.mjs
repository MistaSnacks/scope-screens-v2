// Captures the REAL closed-curtain WebGL canvas to public/curtain-closed.jpg so
// it can be used as the SSR fallback. Because lib/velvet.ts is now seeded, the
// captured drape is byte-identical to every live render — the hand-off from the
// static image to the WebGL curtain is invisible.
//
// Usage: `next build && next start -p 3002`, then `node .shots/capture-curtain.mjs`.
// Re-run whenever SEED, the shaders, or the curtain layout change.
import { chromium } from "/Users/admin/.npm/_npx/bc46ece8a1067505/node_modules/playwright/index.mjs";

// JPEG, not PNG: the clipped region is fully opaque velvet, and PNG compresses
// the grain terribly (~800KB) while JPEG q82 is a fraction of that with no
// perceptible difference for a sub-second first-paint stand-in.
const OUT = "/Users/admin/SS/public/curtain-closed.jpg";
const URL = "http://localhost:3002";

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});
// deviceScaleFactor 1 keeps the PNG light; the drape is soft and stretches to
// fill the plane by texcoord at any width, so 1x reads identically once scaled.
const VALANCE = 56; // .plane top — the curtain hangs below the valance
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});

const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(URL, { waitUntil: "networkidle" });
// Hold the curtain closed (progress 0) at the top of the pin.
await page.evaluate(() => window.scrollTo(0, 0));
// Let curtains.js import, build the planes, decode the texture, and paint.
await page.waitForFunction(() => !!document.querySelector("canvas"), { timeout: 15000 });
await page.waitForTimeout(2500);

// A locator/element screenshot captures the screen REGION, so anything stacked
// over the canvas (nav z-60, valance z-50) or behind its transparent areas
// (video, scrim, screen) bakes in. Hide every layer except the canvas so the
// shot is the curtain pixels alone, transparent where the canvas alpha is 0.
await page.addStyleTag({
  content: `
    [class*="heroVideo"],[class*="heroScrim"],[class*="edgeGuard"],
    [class*="_screen__"],[class*="_spot__"],[class*="curtainFallback"],
    [class*="letterbox"],[class*="scrollCue"],
    nav,.z-50,.z-\\[55\\],.z-\\[100\\],
    nextjs-portal,[data-nextjs-toast],[data-next-badge-root],[id*="next-logo"] {
      opacity: 0 !important; visibility: hidden !important; display: none !important;
    }`,
});
await page.waitForTimeout(200);

// Clip to the opaque curtain region only (below the valance line). The result is
// a fully opaque velvet rectangle positioned, in CSS, exactly where .plane sits
// (top:56px → bottom). Both this image and the WebGL planes stretch their velvet
// by texcoord, so the static fallback matches the live render at any size.
const { width, height } = page.viewportSize();
await page.screenshot({
  path: OUT,
  type: "jpeg",
  quality: 82,
  clip: { x: 0, y: VALANCE, width, height: height - VALANCE },
});

console.log("WROTE", OUT);
console.log("CONSOLE_ERRORS:", JSON.stringify(errors.slice(0, 20), null, 2));
await browser.close();
