import { describe, it, expect } from "vitest";
import { navHrefFor, navActiveFor } from "./site-nav";

describe("nav routing helpers", () => {
  it("maps Watch to home and others to slugs", () => {
    expect(navHrefFor("Watch")).toBe("/");
    expect(navHrefFor("Tickets")).toBe("/tickets");
    expect(navHrefFor("Schedule")).toBe("/schedule");
    expect(navHrefFor("Support")).toBe("/support");
  });
  it("derives active item from pathname", () => {
    expect(navActiveFor("/")).toBe("Watch");
    expect(navActiveFor("/tickets")).toBe("Tickets");
    expect(navActiveFor("/schedule")).toBe("Schedule");
    expect(navActiveFor("/about")).toBe("About");
    expect(navActiveFor("/unknown")).toBe("Watch");
  });
});
