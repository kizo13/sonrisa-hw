import {
  ALERT_CATEGORIES,
  SEVERITIES,
  type DemoEventInput,
  type EventCandidate,
  type Severity
} from "./types";
import type { ValidationIssue, ValidationResult } from "./alertRules";

export interface BuildEventOptions {
  id?: string;
  now?: string;
}

export function validateDemoEventInput(input: unknown, options: BuildEventOptions = {}): ValidationResult<EventCandidate> {
  if (!isObject(input)) {
    return invalid([{ field: "body", message: "Demo event payload must be an object." }]);
  }

  const issues: ValidationIssue[] = [];
  const title = readTrimmedString(input, "title");
  const source = readTrimmedString(input, "source") || "demo";
  const category = readTrimmedString(input, "category");
  const severity = readOptionalSeverity(input, "severity");
  const numericValue = readOptionalNumber(input, "numericValue");
  const occurredAt = readTrimmedString(input, "occurredAt");
  const url = readOptionalUrl(input, "url");

  if (!title) {
    issues.push({ field: "title", message: "Title is required." });
  }

  if (!isSupportedCategory(category)) {
    issues.push({ field: "category", message: "Category must be breaking-news, market, or disaster." });
  }

  if ("severity" in input && !severity) {
    issues.push({ field: "severity", message: "Severity must be low, medium, high, or critical." });
  }

  if ("numericValue" in input && numericValue === null) {
    issues.push({ field: "numericValue", message: "Numeric value must be a finite number." });
  }

  if (!severity && numericValue === undefined) {
    issues.push({ field: "trigger", message: "Event must include severity or numericValue." });
  }

  if (!occurredAt || Number.isNaN(Date.parse(occurredAt))) {
    issues.push({ field: "occurredAt", message: "Occurred time must be a valid ISO date." });
  }

  if ("url" in input && url === null) {
    issues.push({ field: "url", message: "URL must be a valid absolute URL." });
  }

  if (issues.length > 0) {
    return invalid(issues);
  }

  const value: DemoEventInput = {
    title,
    source,
    category,
    severity,
    numericValue: numericValue ?? undefined,
    occurredAt: new Date(occurredAt).toISOString(),
    url: url ?? undefined
  };

  return {
    ok: true,
    value: buildEventCandidate(value, options)
  };
}

export function buildEventCandidate(input: DemoEventInput, options: BuildEventOptions = {}): EventCandidate {
  return {
    id: options.id ?? `event_${slug(input.source)}_${slug(input.title)}`,
    title: input.title,
    source: input.source,
    category: input.category,
    severity: input.severity,
    numericValue: input.numericValue,
    occurredAt: input.occurredAt,
    url: input.url,
    createdAt: options.now ?? new Date().toISOString()
  };
}

function invalid<T>(issues: ValidationIssue[]): ValidationResult<T> {
  return { ok: false, issues };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTrimmedString(input: Record<string, unknown>, field: string): string {
  const value = input[field];
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalSeverity(input: Record<string, unknown>, field: string): Severity | undefined {
  const value = input[field];
  return typeof value === "string" && SEVERITIES.includes(value as Severity) ? (value as Severity) : undefined;
}

function readOptionalNumber(input: Record<string, unknown>, field: string): number | null | undefined {
  if (!(field in input)) {
    return undefined;
  }

  const value = input[field];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readOptionalUrl(input: Record<string, unknown>, field: string): string | null | undefined {
  if (!(field in input)) {
    return undefined;
  }

  const value = input[field];

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function isSupportedCategory(value: string): boolean {
  return ALERT_CATEGORIES.includes(value as (typeof ALERT_CATEGORIES)[number]);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}
