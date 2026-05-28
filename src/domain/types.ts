export const ALERT_CATEGORIES = ["breaking-news", "market", "disaster"] as const;
export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const THRESHOLD_TYPES = ["severity", "numeric"] as const;
export const NOTIFICATION_STATUSES = ["pending", "sent", "failed", "skipped_duplicate"] as const;
export const CORE_CHANNELS = ["email", "slack"] as const;

export type AlertCategory = (typeof ALERT_CATEGORIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type ThresholdType = (typeof THRESHOLD_TYPES)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
export type CoreChannel = (typeof CORE_CHANNELS)[number];
export type ChannelKey = CoreChannel | (string & { readonly __channelKeyBrand?: never });

export type ISODateTime = string;

export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  thresholdType: ThresholdType;
  thresholdValue: string;
  channel: ChannelKey;
  destination: string;
  active: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface EventCandidate {
  id: string;
  title: string;
  source: string;
  category: string;
  severity?: Severity;
  numericValue?: number;
  occurredAt: ISODateTime;
  url?: string;
  createdAt: ISODateTime;
}

export interface NotificationAttempt {
  id: string;
  alertRuleId: string;
  eventCandidateId: string;
  channel: ChannelKey;
  destinationSummary: string;
  status: NotificationStatus;
  messagePreview: string;
  providerResponse?: string;
  errorMessage?: string;
  attemptedAt: ISODateTime;
}

export interface RecentNotificationAttempt extends NotificationAttempt {
  alertName: string;
  eventTitle: string;
}

export type NewAlertRuleInput = Pick<
  AlertRule,
  "name" | "category" | "thresholdType" | "thresholdValue" | "channel" | "destination" | "active"
>;

export type DemoEventInput = Pick<
  EventCandidate,
  "title" | "source" | "category" | "severity" | "numericValue" | "occurredAt" | "url"
>;
