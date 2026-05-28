import type { DeliveryResult, NotificationChannel, NotificationPayload } from "../domain/notifications";

export interface SlackChannelOptions {
  webhookUrl?: string;
  fetcher?: typeof fetch;
}

export function createSlackChannel(options: SlackChannelOptions = {}): NotificationChannel {
  return {
    key: "slack",
    async send(payload, destination): Promise<DeliveryResult> {
      if (!options.webhookUrl) {
        return {
          status: "sent",
          providerResponse: `fake-slack:${destination}: accepted`
        };
      }

      const fetcher = options.fetcher ?? fetch;
      const response = await fetcher(options.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: formatSlackMessage(payload) })
      });

      if (!response.ok) {
        return {
          status: "failed",
          errorMessage: `Slack webhook returned ${response.status}.`
        };
      }

      return {
        status: "sent",
        providerResponse: `slack:${response.status}`
      };
    }
  };
}

function formatSlackMessage(payload: NotificationPayload): string {
  const link = payload.url ? `\n${payload.url}` : "";
  return `*${payload.alertName}*\n${payload.eventTitle}\n${payload.category} from ${payload.source}${link}`;
}
