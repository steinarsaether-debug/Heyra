import { describe, expect, it } from "vitest";
import { hunterExperienceSchema } from "./hunter-experience-schema";

describe("hunterExperienceSchema", () => {
  it("accepts a practical hunter experience post", () => {
    const parsed = hunterExperienceSchema.safeParse({
      title: "Useful local prep for a mountain river stop",
      summary:
        "The stretch was easy to reach and worth a stop, but it helped a lot to know where to park, where the shallow entry was, and which local shop had basic tackle.",
      areaQualityNotes: "Good moving water and easy bank access on the lower side.",
      accessNotes: "Parking was simple near the bridge, then a short walk down to the river.",
      localServicesNotes: "A nearby sports shop had flies and day essentials.",
      accommodationNotes: "The cabin area nearby had decent drying space and stable coverage.",
      safetyNotes: "The stones were slippery after rain, so wading care mattered.",
    });

    expect(parsed.success).toBe(true);
  });
});
