import { describe, expect, it } from "vitest";
import { reviewSchema } from "./review-schema";

describe("reviewSchema", () => {
  it("accepts a valid completed-booking review", () => {
    const parsed = reviewSchema.safeParse({
      rating: 5,
      title: "Clear arrival and solid communication",
      body: "The trip was well prepared, communication was practical, and the expectations around access and timing matched what was actually delivered.",
      flagForReview: false,
    });

    expect(parsed.success).toBe(true);
  });
});
