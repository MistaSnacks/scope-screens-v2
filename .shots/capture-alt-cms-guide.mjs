// Captures annotated per-section screenshots for the ALT (multipage) CMS editor guide.
// Drops numbered pins on the actual editable elements, tags the section, and screenshots
// that element. The .docx generator pairs each image with a numbered legend of field names.
//
// ALT is multipage — for each section we page.goto the right route first, then pin the
// section's fields and screenshot that element.
//
// Usage: GUIDE_URL=http://localhost:3003 node .shots/capture-alt-cms-guide.mjs
import { chromium } from "playwright";
import fs from "fs";

const OUT = "/Users/admin/SS/.shots/guide/alt";
const URL = process.env.GUIDE_URL || "http://localhost:3003";

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

const PIN_CSS = `
  .cmsguide-pin{position:absolute;z-index:99999;width:28px;height:28px;border-radius:50%;
    background:#B13A2A;color:#fff;font:700 16px/28px Arial,sans-serif;text-align:center;
    box-shadow:0 0 0 3px #fff,0 2px 8px rgba(0,0,0,.6);transform:translate(-55%,-55%);}
  .cmsguide-ring{position:absolute;z-index:99998;border:3px solid #B13A2A;border-radius:6px;
    box-shadow:0 0 0 2px rgba(255,255,255,.7);pointer-events:none;}
`;

// Navigate to a route, inject pin styles.
async function goto(path) {
  await page.goto(`${URL}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3500);
  await page.addStyleTag({ content: PIN_CSS });
}

// Find a section + pin its fields, then screenshot the [data-cmsshot] element.
async function annotate(anchor, fields) {
  return await page.evaluate(
    ({ anchor, fields }) => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
      function findByText(txt, root = document.body) {
        const t = norm(txt);
        let best = null;
        for (const el of root.querySelectorAll("*")) {
          if (norm(el.textContent).includes(t)) {
            if (!best || (el.textContent || "").length <= (best.textContent || "").length) best = el;
          }
        }
        return best;
      }
      const tag = anchor.tag || "section";
      let sec = null;
      if (anchor.id) { const e = document.getElementById(anchor.id); sec = e && (e.closest(tag) || e); }
      if (!sec && anchor.text) { const e = findByText(anchor.text); sec = e && (e.closest(tag) || e.parentElement); }
      if (!sec && anchor.css) { const e = document.querySelector(anchor.css); sec = e && (e.closest(tag) || e); }
      if (!sec) return { error: "section not found" };
      sec.scrollIntoView({ block: "start" });
      window.scrollBy(0, -10);
      sec.setAttribute("data-cmsshot", "1");

      const found = [];
      for (const f of fields) {
        let el = null;
        if (f.css) el = sec.querySelector(f.css) || document.querySelector(f.css);
        if (!el && f.text) el = findByText(f.text, sec) || findByText(f.text);
        if (!el) { found.push({ n: f.n, label: f.label, ok: false }); continue; }
        const r = el.getBoundingClientRect();
        const ring = document.createElement("div"); ring.className = "cmsguide-ring";
        ring.style.left = r.left + scrollX + "px"; ring.style.top = r.top + scrollY + "px";
        ring.style.width = r.width + "px"; ring.style.height = r.height + "px";
        document.body.appendChild(ring);
        const pin = document.createElement("div"); pin.className = "cmsguide-pin"; pin.textContent = f.n;
        pin.style.left = r.left + scrollX + "px"; pin.style.top = r.top + scrollY + "px";
        document.body.appendChild(pin);
        found.push({ n: f.n, label: f.label, ok: true });
      }
      return { found };
    },
    { anchor, fields },
  );
}

async function shoot(key, anchor, fields) {
  const res = await annotate(anchor, fields);
  if (res.error) { console.log(key, "ERROR", res.error); return; }
  await page.waitForTimeout(300);
  await page.locator("[data-cmsshot]").first().screenshot({ path: `${OUT}/${key}.png` });
  const pins = res.found.map((f) => `${f.n}:${f.label}${f.ok ? "" : "(MISS)"}`).join("  ");
  console.log(key, "->", pins);
  // Clean up pins + ring overlays for next shot
  await page.evaluate(() => {
    document.querySelectorAll(".cmsguide-pin,.cmsguide-ring").forEach((e) => e.remove());
    document.querySelectorAll("[data-cmsshot]").forEach((e) => e.removeAttribute("data-cmsshot"));
  });
}

// ── 1. Hero (/  — curtain hero section) ────────────────────────────────────────
await goto("/");
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);
{
  const res = await page.evaluate(() => {
    const pinEl = (el, n) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const ring = document.createElement("div"); ring.className = "cmsguide-ring";
      ring.style.left = r.left + scrollX + "px"; ring.style.top = r.top + scrollY + "px";
      ring.style.width = r.width + "px"; ring.style.height = r.height + "px";
      document.body.appendChild(ring);
      const pin = document.createElement("div"); pin.className = "cmsguide-pin"; pin.textContent = n;
      pin.style.left = r.left + scrollX + "px"; pin.style.top = r.top + scrollY + "px";
      document.body.appendChild(pin); return true;
    };
    const eb = document.querySelector('[class*="eyebrow"]') || document.querySelector('[class*="Eyebrow"]');
    // reel area — the video or the hero section itself
    const reelArea = document.querySelector("video") || document.querySelector('[class*="hero"]') || document.querySelector('[class*="curtain"]');
    const ok = [pinEl(eb, "1"), pinEl(reelArea, "2")];
    const sec = (eb || reelArea)?.closest("section") || document.querySelector("section");
    if (sec) sec.setAttribute("data-cmsshot", "1");
    return { ok };
  });
  await page.waitForTimeout(300);
  const shots = await page.locator("[data-cmsshot]").all();
  if (shots.length > 0) {
    await shots[0].screenshot({ path: `${OUT}/Hero.png` });
    console.log("Hero -> 1:Eyebrow 2:VideoReel", JSON.stringify(res.ok));
  } else {
    await page.screenshot({ path: `${OUT}/Hero.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log("Hero -> fallback viewport screenshot", JSON.stringify(res.ok));
  }
  await page.evaluate(() => {
    document.querySelectorAll(".cmsguide-pin,.cmsguide-ring").forEach((e) => e.remove());
    document.querySelectorAll("[data-cmsshot]").forEach((e) => e.removeAttribute("data-cmsshot"));
  });
}

// ── 2. About — header (/about  PageHero) ───────────────────────────────────────
await goto("/about");
await shoot("AboutHeader", { css: "header, main > header" }, [
  { n: "1", label: "Eyebrow", text: "About the Festival" },
  { n: "2", label: "Title", text: "We Put The Fun" },
  { n: "3", label: "Lede", text: "Scope Screenings is Seattle" },
]);

// ── 3. About — Timeline (/about  "How We Got Here") ───────────────────────────
await shoot("Timeline", { text: "How We Got Here" }, [
  { n: "1", label: "Year", css: ".font-marquee" },
  { n: "2", label: "Title", text: "How We Got Here" },
  { n: "3", label: "Blurb", text: "Founded in June 2022" },
]);

// ── 4. About — Houses (/about  "The Houses") ──────────────────────────────────
await shoot("Houses", { id: "houses" }, [
  { n: "1", label: "Eyebrow", text: "The houses" },
  { n: "2", label: "Name", text: "The Houses" },
  { n: "3", label: "Address", css: ".font-mono" },
  { n: "4", label: "Blurb", text: "Langston Hughes" },
]);

// ── 5. Founder band (/about  BuiltForAccess) ──────────────────────────────────
await shoot("FounderBand", { text: "Built For" }, [
  { n: "1", label: "Title", text: "Built For" },
  { n: "2", label: "Quote", text: "see their work on a big screen" },
  { n: "3", label: "Founder name", text: "Lex Scope" },
  { n: "4", label: "Founder title·credential", text: "Festival Director" },
  { n: "5", label: "Photo", css: "figure img, img[alt*='Lex']" },
]);

// ── 6. Schedule (/schedule  PageHero + ClosingBand) ──────────────────────────
await goto("/schedule");
await shoot("Schedule", { css: "header, main > header" }, [
  { n: "1", label: "Eyebrow", text: "The Season" },
  { n: "2", label: "Title", text: "Seven" },
  { n: "3", label: "Lede", text: "One night a month" },
]);
// Closing band
await shoot("ScheduleClose", { text: "Get Your Seat" }, [
  { n: "4", label: "Closing band", text: "Get Your Seat" },
]);

// ── 7. Tickets (/tickets  PageHero + why block) ───────────────────────────────
await goto("/tickets");
await shoot("Tickets", { css: "header, main > header" }, [
  { n: "1", label: "Eyebrow", text: "Chapter One" },
  { n: "2", label: "Title", text: "The" },
  { n: "3", label: "Lede", text: "Last Tuesday" },
]);
await shoot("TicketsWhy", { text: "Why a season pass" }, [
  { n: "4", label: "Why-a-season-pass title", text: "One Pass" },
  { n: "5", label: "Why body", text: "cheapest seat" },
]);
await shoot("TicketsClose", { text: "See You In The Dark" }, [
  { n: "6", label: "Closing band", text: "See You In The Dark" },
]);

// ── 8. Submit — header (/submit  PageHero) ────────────────────────────────────
await goto("/submit");
await shoot("SubmitHeader", { css: "header, main > header" }, [
  { n: "1", label: "Eyebrow", text: "Open call" },
  { n: "2", label: "Title", text: "Submit Your Film" },
  { n: "3", label: "Lede", text: "underrepresented filmmakers" },
]);
await shoot("SubmitClose", { text: "Got A Film" }, [
  { n: "4", label: "Closing band", text: "Got A Film" },
]);

// ── 9. Submit — Criteria (/submit  "What We're After") ───────────────────────
// Section eyebrow label text is "What we look for" (lowercase); h2 contains "What We"
// Use CSS class unique to this section (mt-16 only on first section after hero)
await shoot("SubmitCriteria", { css: "section.mt-16" }, [
  { n: "1", label: "Number", css: ".font-marquee" },
  { n: "2", label: "Title", text: "What We" },
  { n: "3", label: "Blurb", text: "Black, brown" },
]);

// ── 10. Submit — Steps (/submit  "Three Steps In") ────────────────────────────
await shoot("SubmitSteps", { text: "Three Steps In" }, [
  { n: "1", label: "Number", css: ".font-marquee" },
  { n: "2", label: "Title", text: "Three Steps In" },
  { n: "3", label: "Blurb", text: "FilmFreeway" },
]);

// ── 11. Submit — Deadlines (/submit  "Mark Your Calendar") ───────────────────
await shoot("SubmitDeadlines", { text: "Mark Your Calendar" }, [
  { n: "1", label: "Round name", css: ".font-body.font-bold" },
  { n: "2", label: "Closes", text: "Deadlines" },
  { n: "3", label: "Fee", text: "Entry fee" },
]);

// ── 12. Support — header (/support  PageHero) ────────────────────────────────
await goto("/support");
await shoot("SupportHeader", { css: "header, main > header" }, [
  { n: "1", label: "Eyebrow", text: "Funders" },
  { n: "2", label: "Title", text: "Keep It Running" },
  { n: "3", label: "Lede", text: "Three hundred seats" },
  { n: "4", label: "Give card", text: "Give Today" },
]);
await shoot("SupportClose", { text: "Keep The Screen Lit" }, [
  { n: "5", label: "Closing band", text: "Keep The Screen Lit" },
]);

// ── 13. Support — Giving tiers (/support  "Pick Your Level") ─────────────────
await shoot("GivingTiers", { text: "Pick Your Level" }, [
  { n: "1", label: "Name", text: "Giving levels" },
  { n: "2", label: "Amount", css: ".font-display" },
  { n: "3", label: "Cadence", text: "/year" },
  { n: "4", label: "Perks", css: "ul li" },
  { n: "5", label: "Featured highlight", css: "[class*='ring-rust'], [class*='border-rust']" },
]);

// ── 14. Footer (/ — site footer) ──────────────────────────────────────────────
await goto("/");
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1000);
await shoot("Footer", { text: "See You At", tag: "footer" }, [
  { n: "1", label: "Sign-off", text: "See You At" },
  { n: "2", label: "Newsletter heading", text: "lineup in your inbox" },
  { n: "3", label: "Tagline", text: "underground film festival" },
  { n: "4", label: "Copyright", text: "fiscally sponsored project" },
  { n: "5", label: "Contact email", text: "scopescreenings.com" },
]);

// ── 15. Nav (/ — top navigation bar) ─────────────────────────────────────────
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await shoot("Nav", { css: "nav" }, [
  { n: "1", label: "Watch", text: "Watch" },
  { n: "2", label: "Tickets", text: "Tickets" },
  { n: "3", label: "Schedule", text: "Schedule" },
  { n: "4", label: "Submit", text: "Submit" },
  { n: "5", label: "About", text: "About" },
  { n: "6", label: "Support", text: "Support" },
]);

await browser.close();
console.log("done");
