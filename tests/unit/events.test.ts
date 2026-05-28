import { describe, expect, it } from "vitest";
import { validateDemoEventInput } from "../../src/domain/events";

describe("demo event validation", () => {
  it("normalizes valid severity events", () => {
    const result = validateDemoEventInput(
      {
        title: "  Major earthquake near demo city  ",
        source: "demo",
        category: "disaster",
        severity: "high",
        occurredAt: "2026-05-28T12:15:00Z",
        url: "https://example.test/demo-earthquake"
      },
      { now: "2026-05-28T12:16:00.000Z" }
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toMatchObject({
        id: "event_demo_major_earthquake_near_demo_city",
        title: "Major earthquake near demo city",
        category: "disaster",
        severity: "high",
        occurredAt: "2026-05-28T12:15:00.000Z",
        createdAt: "2026-05-28T12:16:00.000Z"
      });
    }
  });

  it("accepts numeric market movement events", () => {
    const result = validateDemoEventInput({
      title: "Index moves sharply",
      source: "demo",
      category: "market",
      numericValue: "6.2",
      occurredAt: "2026-05-28T12:25:00Z"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.numericValue).toBe(6.2);
    }
  });

  it("rejects events without severity or numeric value", () => {
    const result = validateDemoEventInput({
      title: "Incomplete event",
      source: "demo",
      category: "disaster",
      occurredAt: "2026-05-28T12:15:00Z"
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues).toContainEqual({
        field: "trigger",
        message: "Event must include severity or numericValue."
      });
    }
  });
});
