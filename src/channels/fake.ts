import type { DeliveryResult, NotificationChannel, NotificationPayload } from "../domain/notifications";
import type { ChannelKey } from "../domain/types";

export interface FakeNotificationRecord {
  channel: ChannelKey;
  destination: string;
  payload: NotificationPayload;
}

export interface FakeNotificationChannel extends NotificationChannel {
  sent: FakeNotificationRecord[];
}

export function createFakeChannel(key: ChannelKey): FakeNotificationChannel {
  const sent: FakeNotificationRecord[] = [];

  return {
    key,
    sent,
    async send(payload, destination): Promise<DeliveryResult> {
      sent.push({ channel: key, destination, payload });

      return {
        status: "sent",
        providerResponse: `fake-${key}: accepted`
      };
    }
  };
}
