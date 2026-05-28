import type { AlertRule, EventCandidate, Severity } from "./types";

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export function findMatchingAlertRules(alerts: AlertRule[], event: EventCandidate): AlertRule[] {
  return alerts.filter((alert) => matchesAlertRule(alert, event));
}

export function matchesAlertRule(alert: AlertRule, event: EventCandidate): boolean {
  if (!alert.active || alert.category !== event.category) {
    return false;
  }

  if (alert.thresholdType === "severity") {
    return matchesSeverity(alert.thresholdValue, event.severity);
  }

  return matchesNumeric(alert.thresholdValue, event.numericValue);
}

function matchesSeverity(thresholdValue: string, eventSeverity: Severity | undefined): boolean {
  if (!eventSeverity || !(thresholdValue in SEVERITY_RANK)) {
    return false;
  }

  return SEVERITY_RANK[eventSeverity] >= SEVERITY_RANK[thresholdValue as Severity];
}

function matchesNumeric(thresholdValue: string, eventValue: number | undefined): boolean {
  if (eventValue === undefined) {
    return false;
  }

  const threshold = Number(thresholdValue);
  return Number.isFinite(threshold) && Math.abs(eventValue) >= threshold;
}
