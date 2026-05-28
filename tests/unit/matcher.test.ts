import { describe, expect, it } from "vitest";
import { findMatchingAlertRules, matchesAlertRule } from "../../src/domain/matcher";
import {
  breakingNewsEvent,
  breakingNewsSlackAlert,
  cloneFixture,
  disabledMarketAlert,
  disasterEmailAlert,
  disasterEvent,
  marketEvent
} from "../fixtures/alerts";

describe("alert event matching", () => {
  it("matches active severity alerts at or above threshold", () => {
    expect(matchesAlertRule(disasterEmailAlert, disasterEvent)).toBe(true);
    expect(matchesAlertRule(disasterEmailAlert, cloneFixture(disasterEvent, { severity: "critical" }))).toBe(true);
  });

  it("does not match severity events below threshold", () => {
    expect(matchesAlertRule(disasterEmailAlert, cloneFixture(disasterEvent, { severity: "medium" }))).toBe(false);
  });

  it("does not match disabled or category-mismatched alerts", () => {
    expect(matchesAlertRule(disabledMarketAlert, marketEvent)).toBe(false);
    expect(matchesAlertRule(disasterEmailAlert, breakingNewsEvent)).toBe(false);
  });

  it("matches numeric threshold alerts using absolute movement", () => {
    const activeMarketAlert = cloneFixture(disabledMarketAlert, { active: true });

    expect(matchesAlertRule(activeMarketAlert, marketEvent)).toBe(true);
    expect(matchesAlertRule(activeMarketAlert, cloneFixture(marketEvent, { numericValue: -6.2 }))).toBe(true);
    expect(matchesAlertRule(activeMarketAlert, cloneFixture(marketEvent, { numericValue: 2 }))).toBe(false);
  });

  it("returns only matching rules from a mixed rule set", () => {
    expect(findMatchingAlertRules([disasterEmailAlert, breakingNewsSlackAlert, disabledMarketAlert], breakingNewsEvent)).toEqual([
      breakingNewsSlackAlert
    ]);
  });
});
