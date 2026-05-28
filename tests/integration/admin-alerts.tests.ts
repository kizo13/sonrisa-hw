import { describe, expect, it } from "vitest";
import { DEFAULT_ALERT_FORM, toAlertRuleRequest } from "../../src/app/alertForm";

describe("admin alert form behavior", () => {
  it("starts with the smallest useful default alert shape", () => {
    expect(DEFAULT_ALERT_FORM).toEqual({
      name: "",
      category: "disaster",
      thresholdType: "severity",
      thresholdValue: "high",
      channel: "email",
      destination: "",
      active: true
    });
  });

  it("normalizes form strings before sending API requests", () => {
    const request = toAlertRuleRequest({
      ...DEFAULT_ALERT_FORM,
      name: "  High severity disasters  ",
      destination: "  ops@example.com  "
    });

    expect(request).toEqual({
      name: "High severity disasters",
      category: "disaster",
      thresholdType: "severity",
      thresholdValue: "high",
      channel: "email",
      destination: "ops@example.com",
      active: true
    });
  });

  it("preserves inactive rules when submitted from the admin form", () => {
    const request = toAlertRuleRequest({
      ...DEFAULT_ALERT_FORM,
      name: "Paused alert",
      destination: "ops@example.com",
      active: false
    });

    expect(request.active).toBe(false);
  });
});
