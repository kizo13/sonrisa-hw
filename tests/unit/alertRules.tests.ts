import { describe, expect, it } from "vitest";
import {
  buildAlertRule,
  validateAlertRuleInput,
  validateAlertRulePatchInput
} from "../../src/domain/alertRules";

describe("alert rule validation", () => {
  it("accepts a valid email alert rule", () => {
    const result = validateAlertRuleInput({
      name: "  High severity disasters  ",
      category: "disaster",
      thresholdType: "severity",
      thresholdValue: "high",
      channel: "email",
      destination: "ops@example.com",
      active: true
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual({
        name: "High severity disasters",
        category: "disaster",
        thresholdType: "severity",
        thresholdValue: "high",
        channel: "email",
        destination: "ops@example.com",
        active: true
      });
    }
  });

  it("rejects an invalid email destination", () => {
    const result = validateAlertRuleInput({
      name: "High severity disasters",
      category: "disaster",
      thresholdType: "severity",
      thresholdValue: "high",
      channel: "email",
      destination: "not-email",
      active: true
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues).toContainEqual({
        field: "destination",
        message: "Destination must be a valid email address."
      });
    }
  });

  it("rejects invalid numeric thresholds", () => {
    const result = validateAlertRuleInput({
      name: "Large market movement",
      category: "market",
      thresholdType: "numeric",
      thresholdValue: "zero",
      channel: "slack",
      destination: "demo-slack",
      active: true
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues).toContainEqual({
        field: "thresholdValue",
        message: "Numeric threshold must be a positive number."
      });
    }
  });

  it("defaults missing active state to true", () => {
    const result = validateAlertRuleInput({
      name: "Breaking news to Slack",
      category: "breaking-news",
      thresholdType: "severity",
      thresholdValue: "critical",
      channel: "slack",
      destination: "demo-slack"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.active).toBe(true);
    }
  });

  it("validates active-only patch payloads", () => {
    expect(validateAlertRulePatchInput({ active: false })).toEqual({
      ok: true,
      value: { active: false }
    });
    expect(validateAlertRulePatchInput({ active: "false" }).ok).toBe(false);
  });

  it("builds persisted alert metadata", () => {
    const validation = validateAlertRuleInput({
      name: "High severity disasters",
      category: "disaster",
      thresholdType: "severity",
      thresholdValue: "high",
      channel: "email",
      destination: "ops@example.com",
      active: true
    });

    expect(validation.ok).toBe(true);

    if (validation.ok) {
      const alert = buildAlertRule(validation.value, {
        id: "alert_123",
        now: "2026-05-28T12:00:00.000Z"
      });

      expect(alert.id).toBe("alert_123");
      expect(alert.createdAt).toBe("2026-05-28T12:00:00.000Z");
      expect(alert.updatedAt).toBe("2026-05-28T12:00:00.000Z");
    }
  });
});
