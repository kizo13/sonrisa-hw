import type { AlertRule, EventCandidate, NotificationAttempt } from "../../src/domain/types";

export const FIXED_NOW = "2026-05-28T12:00:00.000Z";

export const disasterEmailAlert: AlertRule = {
  id: "alert_disaster_email",
  name: "High severity disasters",
  category: "disaster",
  thresholdType: "severity",
  thresholdValue: "high",
  channel: "email",
  destination: "ops@example.com",
  active: true,
  createdAt: FIXED_NOW,
  updatedAt: FIXED_NOW
};

export const breakingNewsSlackAlert: AlertRule = {
  id: "alert_breaking_news_slack",
  name: "Breaking news to Slack",
  category: "breaking-news",
  thresholdType: "severity",
  thresholdValue: "high",
  channel: "slack",
  destination: "demo-slack",
  active: true,
  createdAt: FIXED_NOW,
  updatedAt: FIXED_NOW
};

export const disabledMarketAlert: AlertRule = {
  id: "alert_market_disabled",
  name: "Large market movement",
  category: "market",
  thresholdType: "numeric",
  thresholdValue: "5",
  channel: "email",
  destination: "markets@example.com",
  active: false,
  createdAt: FIXED_NOW,
  updatedAt: FIXED_NOW
};

export const disasterEvent: EventCandidate = {
  id: "event_demo_earthquake",
  title: "Major earthquake near demo city",
  source: "demo",
  category: "disaster",
  severity: "high",
  occurredAt: "2026-05-28T12:15:00.000Z",
  url: "https://example.test/demo-earthquake",
  createdAt: "2026-05-28T12:16:00.000Z"
};

export const breakingNewsEvent: EventCandidate = {
  id: "event_demo_breaking_news",
  title: "Major breaking news event",
  source: "demo",
  category: "breaking-news",
  severity: "critical",
  occurredAt: "2026-05-28T12:20:00.000Z",
  url: "https://example.test/demo-breaking-news",
  createdAt: "2026-05-28T12:21:00.000Z"
};

export const marketEvent: EventCandidate = {
  id: "event_demo_market_move",
  title: "Index moves sharply",
  source: "demo",
  category: "market",
  numericValue: 6.2,
  occurredAt: "2026-05-28T12:25:00.000Z",
  url: "https://example.test/demo-market",
  createdAt: "2026-05-28T12:26:00.000Z"
};

export const sentDisasterAttempt: NotificationAttempt = {
  id: "attempt_disaster_email",
  alertRuleId: disasterEmailAlert.id,
  eventCandidateId: disasterEvent.id,
  channel: disasterEmailAlert.channel,
  destinationSummary: "op*@example.com",
  status: "sent",
  messagePreview: "High severity disasters: Major earthquake near demo city",
  providerResponse: "fake-email: accepted",
  attemptedAt: "2026-05-28T12:17:00.000Z"
};

export function cloneFixture<T>(fixture: T, overrides: Partial<T> = {}): T {
  return { ...fixture, ...overrides };
}
