// Captures full-page screenshots for the ALT (multipage) CMS editor guide.
// One screenshot per route: /, /about, /schedule, /tickets, /submit, /support.
// Output: .shots/guide/alt/<key>.png
// Usage: node .shots/capture-alt-cms-guide.mjs (dev server must be running on port 3137)
import { chromium } from "playwright";
import fs from "fs";

const OUT = "/Users/admin/SS/.shots/guide/alt";
const URL = process.env.GUIDE_URL || "http://localhost:3137";

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});

page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

const ROUTES = [
  { key: "home", path: "/" },
  { key: "about", path: "/about" },
  { key: "schedule", path: "/schedule" },
  { key: "tickets", path: "/tickets" },
  { key: "submit", path: "/submit" },
  { key: "support", path: "/support" },
];

for (const { key, path } of ROUTES) {
  try {
    console.log(`Capturing ${key} (${path})...`);
    await page.goto(`${URL}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    // Wait for animations/reveals to settle (reducedMotion helps, but give it time)
    await page.waitForTimeout(3000);
    const outPath = `${OUT}/${key}.png`;
    await page.screenshot({ path: outPath, fullPage: true });
    const stat = fs.statSync(outPath);
    console.log(`  -> ${outPath} (${(stat.size / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.log(`  ERROR capturing ${key}: ${err.message}`);
  }
}

await browser.close();
console.log("done");
