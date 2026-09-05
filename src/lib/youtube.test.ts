import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { youtubeEmbedUrl, youtubePoster, youtubeVideoId } from "./youtube";

describe("youtube helpers", () => {
  it("reads watch, short, and embed URLs", () => {
    assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=2l7gC3fa3m0"), "2l7gC3fa3m0");
    assert.equal(youtubeVideoId("https://youtu.be/2GAzfj-WYFs"), "2GAzfj-WYFs");
    assert.equal(youtubeVideoId("https://www.youtube.com/embed/-4ji4fZXuTg"), "-4ji4fZXuTg");
    assert.equal(youtubeVideoId("https://commondatastorage.googleapis.com/sample.mp4"), null);
  });

  it("builds a privacy-enhanced embed for Ghana trailers", () => {
    const embed = youtubeEmbedUrl("https://www.youtube.com/watch?v=BBcEq-4q-b0", {
      autoplay: true,
      muted: true,
    });
    assert.ok(embed?.startsWith("https://www.youtube-nocookie.com/embed/BBcEq-4q-b0?"));
    assert.ok(embed?.includes("autoplay=1"));
    assert.ok(embed?.includes("mute=1"));
  });

  it("returns YouTube poster art", () => {
    assert.equal(
      youtubePoster("https://www.youtube.com/watch?v=2l7gC3fa3m0"),
      "https://i.ytimg.com/vi/2l7gC3fa3m0/hqdefault.jpg",
    );
  });
});
