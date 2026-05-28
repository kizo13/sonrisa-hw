import {
  ALERT_CATEGORIES,
  CORE_CHANNELS,
  SEVERITIES,
  THRESHOLD_TYPES,
  type AlertCategory,
  type AlertRule,
  type ChannelKey,
  type NewAlertRuleInput,
  type ThresholdType
} from "./types";

export interface ValidationIssue {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export interface CreateAlertRuleOptions {
  id?: string;
  now?: string;
}

export interface AlertRulePatch {
  active: boolean;
}

export interface AlertRuleResponse {
  id: string;
  name: string;
  category: AlertCategory;
  thresholdType: ThresholdType;
  thresholdValue: string;
  channel: ChannelKey;
  destinationSummary: string;
  active: boolean;
  updatedAt: string;
}

export function validateAlertRuleInput(input: unknown): ValidationResult<NewAlertRuleInput> {
  if (!isObject(input)) {
    return invalid([{ field: "body", message: "Alert rule payload must be an object." }]);
  }

  const issues: ValidationIssue[] = [];
  const name = readTrimmedString(input, "name");
  const category = readTrimmedString(input, "category");
  const thresholdType = readTrimmedString(input, "thresholdType");
  const thresholdValue = readTrimmedString(input, "thresholdValue");
  const channel = readTrimmedString(input, "channel");
  const destination = readTrimmedString(input, "destination");
  const active = readBoolean(input, "active", true);

  if (!name) {
    issues.push({ field: "name", message: "Name is required." });
  }

  if (!isAlertCategory(category)) {
    issues.push({ field: "category", message: "Category must be breaking-news, market, or disaster." });
  }

  if (!isThresholdType(thresholdType)) {
    issues.push({ field: "thresholdType", message: "Threshold type must be severity or numeric." });
  }

  if (!thresholdValue) {
    issues.push({ field: "thresholdValue", message: "Threshold value is required." });
  } else if (thresholdType === "severity" && !isSeverityThreshold(thresholdValue)) {
    issues.push({ field: "thresholdValue", message: "Severity threshold must be low, medium, high, or critical." });
  } else if (thresholdType === "numeric" && !isPositiveNumber(thresholdValue)) {
    issues.push({ field: "thresholdValue", message: "Numeric threshold must be a positive number." });
  }

  if (!isCoreChannel(channel)) {
    issues.push({ field: "channel", message: "Channel must be email or slack for this version." });
  }

  if (!destination) {
    issues.push({ field: "destination", message: "Destination is required." });
  } else if (channel === "email" && !isEmail(destination)) {
    issues.push({ field: "destination", message: "Destination must be a valid email address." });
  }

  if (active === null) {
    issues.push({ field: "active", message: "Active must be true or false." });
  }

  if (issues.length > 0) {
    return invalid(issues);
  }

  return {
    ok: true,
    value: {
      name,
      category: category as AlertCategory,
      thresholdType: thresholdType as ThresholdType,
      thresholdValue,
      channel: channel as ChannelKey,
      destination,
      active: active ?? true
    }
  };
}

export function validateAlertRulePatchInput(input: unknown): ValidationResult<AlertRulePatch> {
  if (!isObject(input)) {
    return invalid([{ field: "body", message: "Alert update payload must be an object." }]);
  }

  const active = readBoolean(input, "active", null);

  if (active === null) {
    return invalid([{ field: "active", message: "Active must be true or false." }]);
  }

  return { ok: true, value: { active } };
}

export function buildAlertRule(input: NewAlertRuleInput, options: CreateAlertRuleOptions = {}): AlertRule {
  const now = options.now ?? new Date().toISOString();

  return {
    id: options.id ?? crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now
  };
}

export function toAlertRuleResponse(alert: AlertRule): AlertRuleResponse {
  return {
    id: alert.id,
    name: alert.name,
    category: alert.category,
    thresholdType: alert.thresholdType,
    thresholdValue: alert.thresholdValue,
    channel: alert.channel,
    destinationSummary: alert.destination,
    active: alert.active,
    updatedAt: alert.updatedAt
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

function readBoolean(input: Record<string, unknown>, field: string, fallback: boolean | null): boolean | null {
  if (!(field in input)) {
    return fallback;
  }

  return typeof input[field] === "boolean" ? input[field] : null;
}

function isAlertCategory(value: string): value is AlertCategory {
  return ALERT_CATEGORIES.includes(value as AlertCategory);
}

function isThresholdType(value: string): value is ThresholdType {
  return THRESHOLD_TYPES.includes(value as ThresholdType);
}

function isSeverityThreshold(value: string): boolean {
  return SEVERITIES.includes(value as (typeof SEVERITIES)[number]);
}

function isCoreChannel(value: string): boolean {
  return CORE_CHANNELS.includes(value as (typeof CORE_CHANNELS)[number]);
}

function isPositiveNumber(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
