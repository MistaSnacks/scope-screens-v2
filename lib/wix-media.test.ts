import { describe, it, expect } from "vitest";
import { wixImageUrl } from "./wix-media";
import { wixVideoUrl } from "./wix-video";

describe("wixImageUrl", () => {
  it("converts a wix:image URI to a static URL", () => {
    expect(wixImageUrl("wix:image://v1/abc123~mv2.jpg")).toBe(
      "https://static.wixstatic.com/media/abc123~mv2.jpg",
    );
  });
  it("passes http(s) URLs through untouched", () => {
    expect(wixImageUrl("https://x.com/a.jpg")).toBe("https://x.com/a.jpg");
  });
  it("returns null for empty/unrecognized input", () => {
    expect(wixImageUrl("")).toBeNull();
    expect(wixImageUrl(undefined)).toBeNull();
  });
});

describe("wixVideoUrl", () => {
  it("converts a wix:video URI to a 1080p mp4 URL", () => {
    expect(wixVideoUrl("wix:video://v1/vid987/")).toBe(
      "https://video.wixstatic.com/video/vid987/1080p/mp4/file.mp4",
    );
  });
  it("returns null for empty input", () => {
    expect(wixVideoUrl(undefined)).toBeNull();
  });
});
