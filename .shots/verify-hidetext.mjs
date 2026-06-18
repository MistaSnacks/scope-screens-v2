// Drives the ALT hero's "Hide Text" toggle to verify it only hides on-screen
// content (marquee headline + scrim) and leaves the below-frame nav credits.
import { chromium } from "playwright";

const URL = "http://localhost:3007";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
// reduced-motion settles the hero fully open with the controls live.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);
await page.addStyleTag({ content: `nextjs-portal,[data-next-badge-root],[data-nextjs-toast]{display:none!important}` });

await page.screenshot({ path: "/Users/admin/SS/.shots/hidetext-before.png" });

const btn = page.getByRole("button", { name: /hide the hero text/i });
console.log("hide button visible:", await btn.isVisible());
await btn.click();
await page.waitForTimeout(900);
await page.screenshot({ path: "/Users/admin/SS/.shots/hidetext-after.png" });

console.log("done");
await browser.close();
