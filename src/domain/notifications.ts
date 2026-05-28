import type { ChannelKey, ISODateTime } from "./types";

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
