import { describe, expect, it } from "vitest";
import { DEFAULT_HISTORY_LIMIT, statusClass, statusLabel } from "../../src/app/historyView";

describe("admin delivery history view", () => {
  it("uses a default limit of 20 for recent attempts", () => {
    expect(DEFAULT_HISTORY_LIMIT).toBe(20);
  });

  it("labels sent attempts as Sent", () => {
    expect(statusLabel("sent")).toBe("Sent");
  });

  it("labels failed attempts as Failed", () => {
    expect(statusLabel("failed")).toBe("Failed");
  });

  it("labels skipped duplicate attempts as Duplicate", () => {
    expect(statusLabel("skipped_duplicate")).toBe("Duplicate");
  });

  it("labels pending attempts as Pending", () => {
    expect(statusLabel("pending")).toBe("Pending");
  });

  it("applies active pill class for sent attempts", () => {
    expect(statusClass("sent")).toBe("pill active");
  });

  it("applies error pill class for failed attempts", () => {
    expect(statusClass("failed")).toBe("pill error");
  });

  it("applies base pill class for skipped duplicates", () => {
    expect(statusClass("skipped_duplicate")).toBe("pill");
  });

  it("applies base pill class for pending attempts", () => {
    expect(statusClass("pending")).toBe("pill");
  });
});
