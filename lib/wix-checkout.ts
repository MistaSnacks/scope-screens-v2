// Server-only Wix Events checkout boundary.
// Mints an anonymous visitor token and talks to the Events ticketing +
// Headless Redirects APIs. Every function returns null on any miss so callers
// can degrade gracefully (e.g. fall back to the outbound Wix link).
import "server-only";

const API = "https://www.wixapis.com";

export interface TicketTier {
  id: string;
  name: string;
  priceAmount: number; // numeric, e.g. 22
  priceLabel: string; // display, e.g. "$22.00" or "Free"
  currency: string;
  limit: number; // max quantity per checkout
  free: boolean;
  saleEndsAt: string | null; // ISO end of this tier's sale window (e.g. early-bird deadline), or null
}

async function getVisitorToken(): Promise<string | null> {
  const clientId = process.env.WIX_CLIENT_ID;
  if (!clientId) return null;
  try {
    const res = await fetch(`${API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, grantType: "anonymous" }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

interface WixDefinition {
  id?: string;
  name?: string;
  price?: { amount?: string; currency?: string };
  limitPerCheckout?: number;
  saleStatus?: string; // SALE_SCHEDULED | SALE_STARTED | SALE_ENDED
  salePeriod?: { startDate?: string; endDate?: string };
}

export async function queryAvailableTickets(eventId: string): Promise<TicketTier[] | null> {
  const token = await getVisitorToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/events/v1/checkout/available-tickets/query`, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ offset: 0, limit: 100, filter: { eventId } }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { definitions } = (await res.json()) as { definitions?: WixDefinition[] };
    if (!definitions) return null;
    // Wix keeps returning tiers whose sale has ended (or not started) unless the
    // definition is hidden — reserving one fails, so never offer it.
    const onSale = definitions.filter((d) => (d.saleStatus ?? "SALE_STARTED") === "SALE_STARTED");
    return onSale.map((d) => {
      const amount = Number(d.price?.amount ?? "0") || 0; // guard against NaN from a bad price string
      const currency = d.price?.currency ?? "USD";
      const free = amount === 0;
      return {
        id: d.id ?? "",
        name: d.name ?? "Ticket",
        priceAmount: amount,
        priceLabel: free ? "Free" : `$${amount.toFixed(2)}`,
        currency,
        limit: d.limitPerCheckout ?? 50,
        free,
        saleEndsAt: d.salePeriod?.endDate ?? null,
      };
    });
  } catch {
    return null;
  }
}

export interface ReservationLineItem {
  ticketDefinitionId: string;
  quantity: number;
}

export type ReservationResult =
  | { reservationId: string; expiresAt: string }
  | { errorCode: string } // Wix applicationError code, e.g. TICKET_DEFINITION_HIDDEN
  | null;

export async function createReservation(lineItems: ReservationLineItem[]): Promise<ReservationResult> {
  const tickets = lineItems.filter((l) => l.quantity > 0);
  if (tickets.length === 0) return null;
  const token = await getVisitorToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/events/v1/ticket-reservations`, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ ticketReservation: { tickets } }),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as
        | { details?: { applicationError?: { code?: string } } }
        | null;
      const code = err?.details?.applicationError?.code;
      return code ? { errorCode: code } : null;
    }
    const { ticketReservation } = (await res.json()) as {
      ticketReservation?: { id?: string; expirationDate?: string };
    };
    if (!ticketReservation?.id) return null;
    return {
      reservationId: ticketReservation.id,
      expiresAt: ticketReservation.expirationDate ?? "",
    };
  } catch {
    return null;
  }
}

export async function createPaymentRedirect(args: {
  reservationId: string;
  eventSlug: string;
  thankYouPageUrl: string;
  postFlowUrl: string;
}): Promise<string | null> {
  const token = await getVisitorToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/redirect-session/v1/redirect-session`, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({
        eventsCheckout: { reservationId: args.reservationId, eventSlug: args.eventSlug },
        callbacks: { thankYouPageUrl: args.thankYouPageUrl, postFlowUrl: args.postFlowUrl },
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { redirectSession } = (await res.json()) as { redirectSession?: { fullUrl?: string } };
    return redirectSession?.fullUrl ?? null;
  } catch {
    return null;
  }
}

export interface CheckoutTarget {
  eventId: string;
  eventSlug: string;
  title: string;
}

interface WixEventRow {
  id?: string;
  slug?: string;
  title?: string;
  dateAndTimeSettings?: { startDate?: string };
}

function nowIso(): string {
  // Server evaluation time; safe in a server module.
  return new Date().toISOString();
}

export async function getPurchasableTargets(): Promise<{
  nextShow: CheckoutTarget | null;
  seasonPass: CheckoutTarget | null;
}> {
  const empty = { nextShow: null, seasonPass: null };
  const token = await getVisitorToken();
  if (!token) return empty;
  try {
    const res = await fetch(`${API}/events/v3/events/query`, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: { paging: { limit: 50 }, sort: [{ fieldName: "dateAndTimeSettings.startDate", order: "ASC" }] },
      }),
      next: { revalidate: 600 },
    });
    if (!res.ok) return empty;
    const { events } = (await res.json()) as { events?: WixEventRow[] };
    if (!events) return empty;

    const isPass = (e: WixEventRow) => /season pass/i.test(e.title ?? "");
    const toTarget = (e: WixEventRow): CheckoutTarget | null =>
      e.id && e.slug ? { eventId: e.id, eventSlug: e.slug, title: e.title ?? "" } : null;

    const today = nowIso();
    const nextShowRow = events
      .filter((e) => !isPass(e) && (e.dateAndTimeSettings?.startDate ?? "") >= today)
      .sort((a, b) => (a.dateAndTimeSettings?.startDate ?? "").localeCompare(b.dateAndTimeSettings?.startDate ?? ""))[0];

    // Season pass rows often have no startDate; pick the last one (newest season).
    const passRows = events.filter(isPass);
    const passRow = passRows[passRows.length - 1];

    return {
      nextShow: nextShowRow ? toTarget(nextShowRow) : null,
      seasonPass: passRow ? toTarget(passRow) : null,
    };
  } catch {
    return empty;
  }
}
