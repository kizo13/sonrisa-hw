import { describe, expect, it } from "vitest";
import { createFakeChannel } from "../../src/channels/fake";
import { notifyAlertForEvent, type NotificationAttemptStore } from "../../src/domain/notifications";
import type { ChannelKey, NotificationAttempt } from "../../src/domain/types";
import { disasterEmailAlert, disasterEvent, sentDisasterAttempt } from "../fixtures/alerts";

describe("notification orchestration", () => {
  it("sends and persists a notification attempt for a new alert/event pair", async () => {
    const created: NotificationAttempt[] = [];
    const store = fakeAttemptStore({ created });
    const channel = createFakeChannel("email");

    const result = await notifyAlertForEvent({
      alert: disasterEmailAlert,
      event: disasterEvent,
      channel,
      store,
      id: "attempt_123",
      now: "2026-05-28T12:17:00.000Z"
    });

    expect(result.duplicate).toBe(false);
    expect(result.status).toBe("sent");
    expect(channel.sent).toHaveLength(1);
    expect(created).toEqual([
      expect.objectContaining({
        id: "attempt_123",
        alertRuleId: disasterEmailAlert.id,
        eventCandidateId: disasterEvent.id,
        channel: "email",
        destinationSummary: "op*@example.com",
        providerResponse: "fake-email: accepted"
      })
    ]);
  });

  it("skips duplicate alert/event/channel attempts without sending again", async () => {
    const created: NotificationAttempt[] = [];
    const store = fakeAttemptStore({ existing: sentDisasterAttempt, created });
    const channel = createFakeChannel("email");

    const result = await notifyAlertForEvent({
      alert: disasterEmailAlert,
      event: disasterEvent,
      channel,
      store
    });

    expect(result.duplicate).toBe(true);
    expect(result.status).toBe("skipped_duplicate");
    expect(channel.sent).toHaveLength(0);
    expect(created).toEqual([]);
  });

  it("records failed delivery attempts", async () => {
    const created: NotificationAttempt[] = [];
    const store = fakeAttemptStore({ created });

    const result = await notifyAlertForEvent({
      alert: disasterEmailAlert,
      event: disasterEvent,
      channel: {
        key: "email",
        async send() {
          return {
            status: "failed",
            errorMessage: "Provider unavailable"
          };
        }
      },
      store,
      id: "attempt_failed"
    });

    expect(result.status).toBe("failed");
    expect(created[0]).toMatchObject({
      id: "attempt_failed",
      status: "failed",
      errorMessage: "Provider unavailable"
    });
  });
});

function fakeAttemptStore(options: {
  existing?: NotificationAttempt | null;
  created: NotificationAttempt[];
}): NotificationAttemptStore {
  return {
    async findNotificationAttempt(_alertRuleId: string, _eventCandidateId: string, _channel: ChannelKey) {
      return options.existing ?? null;
    },

    async createNotificationAttempt(attempt: NotificationAttempt) {
      options.created.push(attempt);
      return attempt;
    }
  };
}
