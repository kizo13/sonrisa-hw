import { describe, expect, it } from "vitest";
import { createEmailChannel } from "../../src/channels/email";
import { createFakeChannel } from "../../src/channels/fake";
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

describe("notification channels", () => {
  it("fake channel records sent payloads", async () => {
    const channel = createFakeChannel("test-channel");
    const result = await channel.send(payload, "demo-destination");

    expect(result).toEqual({
      status: "sent",
      providerResponse: "fake-test-channel: accepted"
    });
    expect(channel.sent).toEqual([{ channel: "test-channel", destination: "demo-destination", payload }]);
  });

  it("email channel is fake-first", async () => {
    await expect(createEmailChannel().send(payload, "ops@example.com")).resolves.toEqual({
      status: "sent",
      providerResponse: "fake-email:ops@example.com: accepted"
    });
  });

  it("slack channel uses fake delivery without a webhook", async () => {
    await expect(createSlackChannel().send(payload, "demo-slack")).resolves.toEqual({
      status: "sent",
      providerResponse: "fake-slack:demo-slack: accepted"
    });
  });

  it("slack channel posts to webhook when configured", async () => {
    const calls: RequestInit[] = [];
    const channel = createSlackChannel({
      webhookUrl: "https://hooks.slack.test/example",
      async fetcher(_input, init) {
        calls.push(init ?? {});
        return new Response("ok", { status: 200 });
      }
    });

    await expect(channel.send(payload, "demo-slack")).resolves.toEqual({
      status: "sent",
      providerResponse: "slack:200"
    });
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toContain("Major earthquake near demo city");
  });
});
