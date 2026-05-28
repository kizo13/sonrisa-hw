import type { NotificationChannel } from "../domain/notifications";

export interface ChannelRegistry {
  resolve(key: string): NotificationChannel | undefined;
}

export function createChannelRegistry(channels: NotificationChannel[]): ChannelRegistry {
  const map = new Map(channels.map((channel) => [channel.key, channel]));

  return {
    resolve(key) {
      return map.get(key);
    }
  };
}
