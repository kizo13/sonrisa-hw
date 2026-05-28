import { describe, expect, it } from "vitest";
import {
  createAlertRuleRepository,
  type AlertRuleRow,
  type Repository,
  type RunResult,
  type SqlParams
} from "../../src/storage/repository";
import { disasterEmailAlert } from "../fixtures/alerts";

describe("alert rule repository", () => {
  it("maps database rows to alert rules", async () => {
    const row = toRow({ active: 1 });
    const repository = createAlertRuleRepository(fakeRepository({ rows: [row] }));

    await expect(repository.listAlertRules()).resolves.toEqual([disasterEmailAlert]);
  });

  it("inserts alert rule rows with schema field names", async () => {
    const calls: Array<{ sql: string; params?: SqlParams }> = [];
    const repository = createAlertRuleRepository(fakeRepository({ calls }));

    await expect(repository.createAlertRule(disasterEmailAlert)).resolves.toEqual(disasterEmailAlert);

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("INSERT INTO alert_rules");
    expect(calls[0].params).toEqual([
      disasterEmailAlert.id,
      disasterEmailAlert.name,
      disasterEmailAlert.category,
      disasterEmailAlert.thresholdType,
      disasterEmailAlert.thresholdValue,
      disasterEmailAlert.channel,
      disasterEmailAlert.destination,
      1,
      disasterEmailAlert.createdAt,
      disasterEmailAlert.updatedAt
    ]);
  });

  it("updates active status and maps the returned row", async () => {
    const updatedAt = "2026-05-28T13:00:00.000Z";
    const row = toRow({ active: 0, updated_at: updatedAt });
    const calls: Array<{ sql: string; params?: SqlParams }> = [];
    const repository = createAlertRuleRepository(fakeRepository({ first: row, calls }));

    const result = await repository.setAlertRuleActive(disasterEmailAlert.id, false, updatedAt);

    expect(result).toMatchObject({
      id: disasterEmailAlert.id,
      active: false,
      updatedAt
    });
    expect(calls[0].sql).toContain("UPDATE alert_rules");
    expect(calls[0].params).toEqual([0, updatedAt, disasterEmailAlert.id]);
  });

  it("deletes alert rules by id", async () => {
    const calls: Array<{ sql: string; params?: SqlParams }> = [];
    const repository = createAlertRuleRepository(fakeRepository({ calls }));

    await repository.deleteAlertRule(disasterEmailAlert.id);

    expect(calls[0].sql).toBe("DELETE FROM alert_rules WHERE id = ?");
    expect(calls[0].params).toEqual([disasterEmailAlert.id]);
  });
});

function fakeRepository(options: {
  rows?: AlertRuleRow[];
  first?: AlertRuleRow | null;
  calls?: Array<{ sql: string; params?: SqlParams }>;
}): Repository {
  const calls = options.calls ?? [];

  return {
    async first<T>(sql: string, params?: SqlParams): Promise<T | null> {
      calls.push({ sql, params });
      return (options.first ?? null) as T | null;
    },

    async all<T>(sql: string, params?: SqlParams) {
      calls.push({ sql, params });
      return {
        results: (options.rows ?? []) as T[],
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

function toRow(overrides: Partial<AlertRuleRow> = {}): AlertRuleRow {
  return {
    id: disasterEmailAlert.id,
    name: disasterEmailAlert.name,
    category: disasterEmailAlert.category,
    threshold_type: disasterEmailAlert.thresholdType,
    threshold_value: disasterEmailAlert.thresholdValue,
    channel: disasterEmailAlert.channel,
    destination: disasterEmailAlert.destination,
    active: disasterEmailAlert.active ? 1 : 0,
    created_at: disasterEmailAlert.createdAt,
    updated_at: disasterEmailAlert.updatedAt,
    ...overrides
  };
}
