import type { AlertRule, ChannelKey, EventCandidate, ISODateTime, NotificationAttempt } from "./types";

export interface NotificationPayload {
  alertName: string;
  eventTitle: string;
  category: string;
  source: string;
  occurredAt: ISODateTime;
  url?: string;
}

export type DeliveryStatus = "sent" | "failed";

export interface DeliveryResult {
  status: DeliveryStatus;
  providerResponse?: string;
  errorMessage?: string;
}

export interface NotificationChannel {
  key: ChannelKey;
  send(payload: NotificationPayload, destination: string): Promise<DeliveryResult>;
}

export interface NotificationAttemptStore {
  findNotificationAttempt(alertRuleId: string, eventCandidateId: string, channel: ChannelKey): Promise<NotificationAttempt | null>;
  createNotificationAttempt(attempt: NotificationAttempt): Promise<NotificationAttempt>;
}

export interface NotifyAlertOptions {
  alert: AlertRule;
  event: EventCandidate;
  channel: NotificationChannel;
  store: NotificationAttemptStore;
  now?: string;
  id?: string;
}

export interface NotifyAlertResult {
  status: "sent" | "failed" | "skipped_duplicate";
  attempt: NotificationAttempt;
  duplicate: boolean;
}

export function createMessagePreview(payload: NotificationPayload): string {
  return `${payload.alertName}: ${payload.eventTitle}`;
}

export function summarizeDestination(destination: string): string {
  if (destination.includes("@")) {
    const [localPart, domain] = destination.split("@");
    const visible = localPart.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(localPart.length - 2, 1))}@${domain}`;
  }

  return destination;
}

export async function notifyAlertForEvent(options: NotifyAlertOptions): Promise<NotifyAlertResult> {
  const existing = await options.store.findNotificationAttempt(options.alert.id, options.event.id, options.alert.channel);

  if (existing) {
    return {
      status: "skipped_duplicate",
      attempt: {
        ...existing,
        status: "skipped_duplicate"
      },
      duplicate: true
    };
  }

  const payload = createNotificationPayload(options.alert, options.event);
  const delivery = await options.channel.send(payload, options.alert.destination);
  const attempt: NotificationAttempt = {
    id: options.id ?? createAttemptId(options.alert, options.event),
    alertRuleId: options.alert.id,
    eventCandidateId: options.event.id,
    channel: options.alert.channel,
    destinationSummary: summarizeDestination(options.alert.destination),
    status: delivery.status,
    messagePreview: createMessagePreview(payload),
    providerResponse: delivery.providerResponse,
    errorMessage: delivery.errorMessage,
    attemptedAt: options.now ?? new Date().toISOString()
  };

  await options.store.createNotificationAttempt(attempt);

  return {
    status: delivery.status,
    attempt,
    duplicate: false
  };
}

export function createNotificationPayload(alert: AlertRule, event: EventCandidate): NotificationPayload {
  return {
    alertName: alert.name,
    eventTitle: event.title,
    category: event.category,
    source: event.source,
    occurredAt: event.occurredAt,
    url: event.url
  };
}

function createAttemptId(alert: AlertRule, event: EventCandidate): string {
  return `attempt_${alert.id}_${event.id}_${alert.channel}`;
}
