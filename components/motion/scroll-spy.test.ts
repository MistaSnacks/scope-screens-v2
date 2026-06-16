import { describe, it, expect } from "vitest";
import { pickActiveSection } from "./scroll-spy";

const entry = (id: string, ratio: number) =>
  ({ target: { id }, intersectionRatio: ratio, isIntersecting: ratio > 0 } as IntersectionObserverEntry);

describe("pickActiveSection", () => {
  it("returns the id with the highest intersection ratio", () => {
    expect(pickActiveSection([entry("about", 0.2), entry("tickets", 0.7)], "top")).toBe("tickets");
  });
  it("keeps the current id when nothing is intersecting", () => {
    expect(pickActiveSection([entry("about", 0), entry("tickets", 0)], "tickets")).toBe("tickets");
  });
  it("falls back to current id for an empty list", () => {
    expect(pickActiveSection([], "about")).toBe("about");
  });
});
