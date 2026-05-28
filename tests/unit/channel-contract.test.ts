import { describe, expect, it } from "vitest";
import { createEmailChannel } from "../../src/channels/email";
import { createFakeChannel } from "../../src/channels/fake";
import { createChannelRegistry } from "../../src/channels/index";
import { createSlackChannel } from "../../src/channels/slack";
import type { NotificationPayload } from "../../src/domain/notifications";

const payload: NotificationPayload = {
  alertName: "High severity disasters",
  eventTitle: "Major earthquake near demo city",
  category: "disaster",
  source: "demo",
  occurredAt: "2026-05-28T12:15:00.000Z",
  url: "https://example.test/demo-earthquake"
};

describe("channel registry", () => {
  it("resolves email and slack channels by key", () => {
    const registry = createChannelRegistry([createEmailChannel(), createSlackChannel()]);

    expect(registry.resolve("email")).toBeDefined();
    expect(registry.resolve("slack")).toBeDefined();
  });

  it("returns undefined for an unregistered key", () => {
    const registry = createChannelRegistry([createEmailChannel()]);

    expect(registry.resolve("slack")).toBeUndefined();
  });

  it("a third channel receives the same payload contract as email and slack", async () => {
    const sms = createFakeChannel("sms");
    const registry = createChannelRegistry([createEmailChannel(), createSlackChannel(), sms]);

    const channel = registry.resolve("sms");
    expect(channel).toBeDefined();

    const result = await channel!.send(payload, "demo-sms");

    expect(result.status).toBe("sent");
    expect(sms.sent).toHaveLength(1);
    expect(sms.sent[0].payload).toEqual(payload);
    expect(sms.sent[0].destination).toBe("demo-sms");
  });

  it("registering a third channel does not change email or slack behavior", async () => {
    const sms = createFakeChannel("sms");
    const registry = createChannelRegistry([createEmailChannel(), createSlackChannel(), sms]);

    const email = registry.resolve("email")!;
    const slack = registry.resolve("slack")!;

    await expect(email.send(payload, "ops@example.com")).resolves.toMatchObject({ status: "sent" });
    await expect(slack.send(payload, "demo-slack")).resolves.toMatchObject({ status: "sent" });
    expect(sms.sent).toHaveLength(0);
  });
});
