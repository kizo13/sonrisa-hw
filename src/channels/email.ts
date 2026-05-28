import type { NotificationChannel } from "../domain/notifications";

export function createEmailChannel(): NotificationChannel {
  return {
    key: "email",
    async send(_payload, destination) {
      return {
        status: "sent",
        providerResponse: `fake-email:${destination}: accepted`
      };
    }
  };
}
