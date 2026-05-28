import type { AlertRule, AlertCategory, ChannelKey, ThresholdType } from "../domain/types";

export type SqlValue = string | number | null;
export type SqlParams = readonly SqlValue[];

export interface QueryResult<T> {
  results: T[];
  success: boolean;
  meta?: unknown;
}

export interface RunResult {
  success: boolean;
  meta?: unknown;
}

export interface Repository {
  first<T>(sql: string, params?: SqlParams): Promise<T | null>;
  all<T>(sql: string, params?: SqlParams): Promise<QueryResult<T>>;
  run(sql: string, params?: SqlParams): Promise<RunResult>;
  batch(statements: PreparedStatement[]): Promise<D1Result[]>;
  transaction(statements: PreparedStatement[]): Promise<D1Result[]>;
}

export interface PreparedStatement {
  sql: string;
  params?: SqlParams;
}

export interface AlertRuleRow {
  id: string;
  name: string;
  category: string;
  threshold_type: string;
  threshold_value: string;
  channel: string;
  destination: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface AlertRuleRepository {
  listAlertRules(): Promise<AlertRule[]>;
  createAlertRule(alert: AlertRule): Promise<AlertRule>;
  setAlertRuleActive(id: string, active: boolean, updatedAt: string): Promise<AlertRule | null>;
  deleteAlertRule(id: string): Promise<void>;
}

export function createRepository(db: D1Database): Repository {
  function prepare({ sql, params = [] }: PreparedStatement): D1PreparedStatement {
    return db.prepare(sql).bind(...params);
  }

  return {
    first<T>(sql, params = []) {
      return db.prepare(sql).bind(...params).first<T>();
    },

    async all<T>(sql, params = []) {
      const result = await db.prepare(sql).bind(...params).all<T>();

      return {
        results: result.results ?? [],
        success: result.success,
        meta: result.meta
      };
    },

    async run(sql, params = []) {
      const result = await db.prepare(sql).bind(...params).run();

      return {
        success: result.success,
        meta: result.meta
      };
    },

    batch(statements) {
      return db.batch(statements.map((statement) => prepare(statement)));
    },

    transaction(statements) {
      return db.batch(statements.map((statement) => prepare(statement)));
    }
  };
}

export function createAlertRuleRepository(repository: Repository): AlertRuleRepository {
  return {
    async listAlertRules() {
      const result = await repository.all<AlertRuleRow>(
        `SELECT * FROM alert_rules ORDER BY updated_at DESC`
      );

      return result.results.map(fromAlertRuleRow);
    },

    async createAlertRule(alert) {
      await repository.run(
        `INSERT INTO alert_rules (
          id,
          name,
          category,
          threshold_type,
          threshold_value,
          channel,
          destination,
          active,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alert.id,
          alert.name,
          alert.category,
          alert.thresholdType,
          alert.thresholdValue,
          alert.channel,
          alert.destination,
          alert.active ? 1 : 0,
          alert.createdAt,
          alert.updatedAt
        ]
      );

      return alert;
    },

    async setAlertRuleActive(id, active, updatedAt) {
      const row = await repository.first<AlertRuleRow>(
        `UPDATE alert_rules
          SET active = ?, updated_at = ?
          WHERE id = ?
          RETURNING *`,
        [active ? 1 : 0, updatedAt, id]
      );

      return row ? fromAlertRuleRow(row) : null;
    },

    async deleteAlertRule(id) {
      await repository.run(`DELETE FROM alert_rules WHERE id = ?`, [id]);
    }
  };
}

export function fromAlertRuleRow(row: AlertRuleRow): AlertRule {
  return {
    id: row.id,
    name: row.name,
    category: row.category as AlertCategory,
    thresholdType: row.threshold_type as ThresholdType,
    thresholdValue: row.threshold_value,
    channel: row.channel as ChannelKey,
    destination: row.destination,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
