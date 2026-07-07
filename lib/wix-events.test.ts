import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLiveSchedule } from "./wix-events";

// wix-events.ts reads WIX_CLIENT_ID at module scope, so it must exist
// before the import is evaluated — beforeEach/stubEnv is too late.
vi.hoisted(() => {
  process.env.WIX_CLIENT_ID = "client-123";
});

const TOKEN_RES = { access_token: "visitor-token-abc" };

function mockFetchSequence(responses: Array<{ ok?: boolean; json: unknown }>) {
  const fn = vi.fn();
  for (const r of responses) {
    fn.mockResolvedValueOnce({
      ok: r.ok ?? true,
      json: async () => r.json,
    });
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  vi.stubEnv("WIX_CLIENT_ID", "client-123");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getLiveSchedule", () => {
  it("builds the reserve href from the eventPageUrl object (base + path)", async () => {
    // Events v3 returns eventPageUrl as { base, path }, not a string —
    // rendering it directly produced href="[object Object]".
    mockFetchSequence([
      { json: TOKEN_RES },
      {
        json: {
          events: [
            {
              title: "Scope Screenings: Opening Night",
              slug: "scope-screenings-opening-night",
              eventPageUrl: {
                base: "https://www.lexscopefilms.com",
                path: "/event-details/scope-screenings-opening-night",
              },
              dateAndTimeSettings: {
                startDate: "2999-07-29T02:00:00Z",
                formatted: { startDate: "July 28, 2999" },
              },
            },
          ],
        },
      },
    ]);

    const rows = await getLiveSchedule();

    expect(rows?.[0].href).toBe(
      "https://www.lexscopefilms.com/event-details/scope-screenings-opening-night"
    );
    // The slug rides along so the schedule can link internally to /events/[slug].
    expect(rows?.[0].slug).toBe("scope-screenings-opening-night");
  });

  it("falls back to the slug URL when eventPageUrl is missing", async () => {
    mockFetchSequence([
      { json: TOKEN_RES },
      {
        json: {
          events: [
            {
              title: "Scope Screenings: Opening Night",
              slug: "opening-night",
              dateAndTimeSettings: { startDate: "2999-07-29T02:00:00Z" },
            },
          ],
        },
      },
    ]);

    const rows = await getLiveSchedule();

    expect(rows?.[0].href).toBe("https://www.lexscopefilms.com/event-details/opening-night");
  });

  it("skips past events and returns null when nothing is upcoming", async () => {
    mockFetchSequence([
      { json: TOKEN_RES },
      {
        json: {
          events: [
            {
              title: "Old Night",
              slug: "old-night",
              dateAndTimeSettings: { startDate: "2020-01-01T00:00:00Z" },
            },
          ],
        },
      },
    ]);

    const rows = await getLiveSchedule();

    expect(rows).toBeNull();
  });
});
