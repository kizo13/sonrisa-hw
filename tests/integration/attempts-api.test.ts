import { describe, expect, it } from "vitest";
import {
  createNotificationAttemptRepository,
  type NotificationAttemptDetailRow,
  type Repository,
  type RunResult,
  type SqlParams
} from "../../src/storage/repository";
import { disasterEmailAlert, disasterEvent, sentDisasterAttempt } from "../fixtures/alerts";

describe("notification attempt repository", () => {
  it("maps joined rows to attempt details", async () => {
    const row = toDetailRow();
    const repository = createNotificationAttemptRepository(fakeRepository({ detailRows: [row] }));

    const result = await repository.listRecentNotificationAttempts(20);

    expect(result).toEqual([{
      id: sentDisasterAttempt.id,
      alertName: disasterEmailAlert.name,
      eventTitle: disasterEvent.title,
      channel: sentDisasterAttempt.channel,
      destinationSummary: sentDisasterAttempt.destinationSummary,
      status: sentDisasterAttempt.status,
      messagePreview: sentDisasterAttempt.messagePreview,
      providerResponse: sentDisasterAttempt.providerResponse ?? null,
      errorMessage: null,
      attemptedAt: sentDisasterAttempt.attemptedAt
    }]);
  });

  it("queries with a JOIN and applies the limit", async () => {
    const calls: Array<{ sql: string; params?: SqlParams }> = [];
    const repository = createNotificationAttemptRepository(fakeRepository({ calls }));

    await repository.listRecentNotificationAttempts(10);

    const joinCall = calls.find((c) => c.sql.includes("JOIN"));
    expect(joinCall?.sql).toContain("JOIN alert_rules");
    expect(joinCall?.sql).toContain("JOIN event_candidates");
    expect(joinCall?.params).toContain(10);
  });

  it("returns an empty list when there are no attempts", async () => {
    const repository = createNotificationAttemptRepository(fakeRepository({ detailRows: [] }));

    await expect(repository.listRecentNotificationAttempts(20)).resolves.toEqual([]);
  });

  it("maps null provider response and error message correctly", async () => {
    const row = toDetailRow({ provider_response: null, error_message: "channel unavailable" });
    const repository = createNotificationAttemptRepository(fakeRepository({ detailRows: [row] }));

    const [result] = await repository.listRecentNotificationAttempts(20);

    expect(result.providerResponse).toBeNull();
    expect(result.errorMessage).toBe("channel unavailable");
  });
});

function fakeRepository(options: {
  detailRows?: NotificationAttemptDetailRow[];
  calls?: Array<{ sql: string; params?: SqlParams }>;
}): Repository {
  const calls = options.calls ?? [];

  return {
    async first<T>(_sql: string, _params?: SqlParams): Promise<T | null> {
      return null;
    },

    async all<T>(sql: string, params?: SqlParams) {
      calls.push({ sql, params });
      return {
        results: (options.detailRows ?? []) as T[],
        success: true
      };
    },

    async run(sql: string, params?: SqlParams): Promise<RunResult> {
      calls.push({ sql, params });
      return { success: true };
    },

    async batch(): Promise<D1Result[]> {
      return [];
    },

    async transaction(): Promise<D1Result[]> {
      return [];
    }
  };
}

function toDetailRow(overrides: Partial<NotificationAttemptDetailRow> = {}): NotificationAttemptDetailRow {
  return {
    id: sentDisasterAttempt.id,
    alert_name: disasterEmailAlert.name,
    event_title: disasterEvent.title,
    channel: sentDisasterAttempt.channel,
    destination_summary: sentDisasterAttempt.destinationSummary,
    status: sentDisasterAttempt.status,
    message_preview: sentDisasterAttempt.messagePreview,
    provider_response: sentDisasterAttempt.providerResponse ?? null,
    error_message: null,
    attempted_at: sentDisasterAttempt.attemptedAt,
    ...overrides
  };
}
