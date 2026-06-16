// Verifies the silver-screen hero on a phone viewport: closed (logo) + framed
// (screen + stacked credits), that the sound toggle flips its label, and that
// reduced-motion renders the framed end-state on load. Requires the prod server
// on :3002 (npm run build && npx next start -p 3002).
import { chromium } from "/Users/admin/.npm/_npx/bc46ece8a1067505/node_modules/playwright/index.mjs";

const OUT = "/Users/admin/SS/.shots";
const URL = "http://localhost:3002";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});

// iPhone 12-ish portrait
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/m1-closed.png` });

// Scroll to the framed end of the pin (~140% of 844).
await page.evaluate(() => window.scrollTo(0, 844 * 1.5));
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/m2-framed.png` });

// Sound toggle: label should read "Sound On" then flip to "Mute".
const before = await page.locator("button", { hasText: /sound on|mute/i }).first().innerText();
await page.locator("button", { hasText: /sound on|mute/i }).first().click();
await page.waitForTimeout(300);
const after = await page.locator("button", { hasText: /sound on|mute/i }).first().innerText();
console.log("SOUND_TOGGLE:", JSON.stringify({ before, after }));

// Reduced motion: framed end-state should be visible on load (no scroll).
const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const rp = await reduced.newPage();
await rp.goto(URL, { waitUntil: "networkidle" });
await rp.waitForTimeout(2000);
await rp.screenshot({ path: `${OUT}/m3-reduced.png` });

console.log("CONSOLE_ERRORS:", JSON.stringify(errors.slice(0, 20), null, 2));
await browser.close();
