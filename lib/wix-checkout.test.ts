import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { queryAvailableTickets, createReservation, createPaymentRedirect, getPurchasableTargets } from "./wix-checkout";

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

describe("queryAvailableTickets", () => {
  it("normalizes Wix definitions into tiers", async () => {
    const fetchMock = mockFetchSequence([
      { json: TOKEN_RES },
      {
        json: {
          metaData: { total: 2 },
          definitions: [
            {
              id: "ga",
              name: "General Admission - $22",
              price: { amount: "22.00", currency: "USD" },
              limitPerCheckout: 50,
              salePeriod: { startDate: "2026-01-01T00:00:00Z", endDate: "2026-08-08T06:50:00Z" },
            },
            { id: "free", name: "Donate", price: { amount: "0.00", currency: "USD" }, limitPerCheckout: 10 },
          ],
        },
      },
    ]);

    const tiers = await queryAvailableTickets("event-1");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tiers).toEqual([
      { id: "ga", name: "General Admission - $22", priceAmount: 22, priceLabel: "$22.00", currency: "USD", limit: 50, free: false, saleEndsAt: "2026-08-08T06:50:00Z" },
      { id: "free", name: "Donate", priceAmount: 0, priceLabel: "Free", currency: "USD", limit: 10, free: true, saleEndsAt: null },
    ]);
  });

  it("filters out tiers whose sale is not currently running", async () => {
    mockFetchSequence([
      { json: TOKEN_RES },
      {
        json: {
          definitions: [
            { id: "ga", name: "General Admission", price: { amount: "22.00", currency: "USD" }, limitPerCheckout: 50, saleStatus: "SALE_STARTED" },
            { id: "early", name: "Earlybird", price: { amount: "10.00", currency: "USD" }, limitPerCheckout: 50, saleStatus: "SALE_ENDED" },
            { id: "late", name: "Door Price", price: { amount: "25.00", currency: "USD" }, limitPerCheckout: 50, saleStatus: "SALE_SCHEDULED" },
            { id: "legacy", name: "No Status", price: { amount: "5.00", currency: "USD" }, limitPerCheckout: 50 },
          ],
        },
      },
    ]);

    const tiers = await queryAvailableTickets("event-1");

    expect(tiers?.map((t) => t.id)).toEqual(["ga", "legacy"]);
  });

  it("returns null when WIX_CLIENT_ID is missing", async () => {
    vi.unstubAllEnvs();
    const tiers = await queryAvailableTickets("event-1");
    expect(tiers).toBeNull();
  });

  it("returns null when the availability call fails", async () => {
    mockFetchSequence([{ json: TOKEN_RES }, { ok: false, json: {} }]);
    const tiers = await queryAvailableTickets("event-1");
    expect(tiers).toBeNull();
  });

  it("returns null when the token call fails", async () => {
    mockFetchSequence([{ ok: false, json: {} }]);
    const tiers = await queryAvailableTickets("event-1");
    expect(tiers).toBeNull();
  });
});

describe("createReservation", () => {
  it("reserves tickets and returns id + expiry", async () => {
    const fetchMock = mockFetchSequence([
      { json: TOKEN_RES },
      { json: { ticketReservation: { id: "res-1", status: "PENDING", expirationDate: "2026-06-13T22:50:05.045Z" } } },
    ]);

    const result = await createReservation([{ ticketDefinitionId: "ga", quantity: 2 }]);

    expect(result).toEqual({ reservationId: "res-1", expiresAt: "2026-06-13T22:50:05.045Z" });
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body).toEqual({ ticketReservation: { tickets: [{ ticketDefinitionId: "ga", quantity: 2 }] } });
  });

  it("returns null when no line items have quantity", async () => {
    const result = await createReservation([{ ticketDefinitionId: "ga", quantity: 0 }]);
    expect(result).toBeNull();
  });

  it("returns null when the reservation call fails", async () => {
    mockFetchSequence([{ json: TOKEN_RES }, { ok: false, json: {} }]);
    const result = await createReservation([{ ticketDefinitionId: "ga", quantity: 1 }]);
    expect(result).toBeNull();
  });

  it("returns the Wix error code when the reservation is rejected", async () => {
    mockFetchSequence([
      { json: TOKEN_RES },
      {
        ok: false,
        json: {
          message: "Ticket definition is hidden ID: early",
          details: { applicationError: { code: "TICKET_DEFINITION_HIDDEN", description: "Ticket definition is hidden ID: early" } },
        },
      },
    ]);
    const result = await createReservation([{ ticketDefinitionId: "early", quantity: 1 }]);
    expect(result).toEqual({ errorCode: "TICKET_DEFINITION_HIDDEN" });
  });
});

describe("createPaymentRedirect", () => {
  it("creates a redirect session and returns the full url", async () => {
    const fetchMock = mockFetchSequence([
      { json: TOKEN_RES },
      { json: { redirectSession: { fullUrl: "https://wix.example/redirect?token=xyz" } } },
    ]);

    const url = await createPaymentRedirect({
      reservationId: "res-1",
      eventSlug: "opening-night",
      thankYouPageUrl: "https://site.test/thank-you",
      postFlowUrl: "https://site.test/",
    });

    expect(url).toBe("https://wix.example/redirect?token=xyz");
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body).toEqual({
      eventsCheckout: { reservationId: "res-1", eventSlug: "opening-night" },
      callbacks: { thankYouPageUrl: "https://site.test/thank-you", postFlowUrl: "https://site.test/" },
    });
  });

  it("returns null when the session call fails", async () => {
    mockFetchSequence([{ json: TOKEN_RES }, { ok: false, json: {} }]);
    const url = await createPaymentRedirect({
      reservationId: "res-1",
      eventSlug: "opening-night",
      thankYouPageUrl: "https://site.test/thank-you",
      postFlowUrl: "https://site.test/",
    });
    expect(url).toBeNull();
  });
});

describe("getPurchasableTargets", () => {
  const EVENTS = {
    events: [
      { id: "pass5", slug: "season-pass-5", title: "Season Pass for Scope Screenings Season 5", dateAndTimeSettings: {} },
      { id: "past", slug: "old-night", title: "Scope Screenings: August 26", dateAndTimeSettings: { startDate: "2020-01-01T00:00:00Z" } },
      { id: "next", slug: "opening-night", title: "Scope Screenings: Opening Night", dateAndTimeSettings: { startDate: "2999-01-01T00:00:00Z" } },
    ],
  };

  it("picks the soonest upcoming non-pass screening and the season pass", async () => {
    mockFetchSequence([{ json: TOKEN_RES }, { json: EVENTS }]);
    const targets = await getPurchasableTargets();
    expect(targets?.nextShow).toEqual({ eventId: "next", eventSlug: "opening-night", title: "Scope Screenings: Opening Night" });
    expect(targets?.seasonPass).toEqual({ eventId: "pass5", eventSlug: "season-pass-5", title: "Season Pass for Scope Screenings Season 5" });
  });

  it("returns null targets gracefully when the events call fails", async () => {
    mockFetchSequence([{ json: TOKEN_RES }, { ok: false, json: {} }]);
    const targets = await getPurchasableTargets();
    expect(targets).toEqual({ nextShow: null, seasonPass: null });
  });

  it("returns null nextShow when every screening is in the past", async () => {
    mockFetchSequence([
      { json: TOKEN_RES },
      {
        json: {
          events: [
            { id: "pass5", slug: "season-pass-5", title: "Season Pass for Scope Screenings Season 5", dateAndTimeSettings: {} },
            { id: "past", slug: "old-night", title: "Scope Screenings: August 26", dateAndTimeSettings: { startDate: "2020-01-01T00:00:00Z" } },
          ],
        },
      },
    ]);
    const targets = await getPurchasableTargets();
    expect(targets.nextShow).toBeNull();
    expect(targets.seasonPass).toEqual({ eventId: "pass5", eventSlug: "season-pass-5", title: "Season Pass for Scope Screenings Season 5" });
  });
});
