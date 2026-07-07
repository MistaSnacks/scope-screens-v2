import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketPicker } from "./ticket-picker";

const TIERS = [
  { id: "ga", name: "General Admission", priceAmount: 22, priceLabel: "$22.00", currency: "USD", limit: 2, free: false, saleEndsAt: null },
];

describe("TicketPicker", () => {
  it("increments quantity up to the limit and reports changes", async () => {
    const onChange = vi.fn();
    render(<TicketPicker tiers={TIERS} quantities={{}} onChange={onChange} />);

    const plus = screen.getByRole("button", { name: /increase general admission/i });
    await userEvent.click(plus);
    expect(onChange).toHaveBeenLastCalledWith("ga", 1);
  });

  it("disables increment at the per-checkout limit", async () => {
    render(<TicketPicker tiers={TIERS} quantities={{ ga: 2 }} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /increase general admission/i })).toBeDisabled();
  });

  it("shows the venue-local sale-end date for a tier with a deadline", () => {
    // 2026-08-08T06:50:00Z is 11:50 PM PDT on Aug 7 — must read as Aug 7, not Aug 8.
    const tiers = [{ ...TIERS[0], name: "Early Bird", saleEndsAt: "2026-08-08T06:50:00Z" }];
    render(<TicketPicker tiers={tiers} quantities={{}} onChange={() => {}} />);
    expect(screen.getByText("Sale ends Aug 7")).toBeInTheDocument();
  });
});
