import type {
  AlertRule,
  AlertCategory,
  ChannelKey,
  EventCandidate,
  NotificationAttempt,
  NotificationStatus,
  Severity,
  ThresholdType
} from "../domain/types";

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
  listActiveAlertRulesByCategory(category: string): Promise<AlertRule[]>;
  createAlertRule(alert: AlertRule): Promise<AlertRule>;
  setAlertRuleActive(id: string, active: boolean, updatedAt: string): Promise<AlertRule | null>;
  deleteAlertRule(id: string): Promise<void>;
}

export interface EventCandidateRow {
  id: string;
  title: string;
  source: string;
  category: string;
  severity: string | null;
  numeric_value: number | null;
  occurred_at: string;
  url: string | null;
  created_at: string;
}

export interface NotificationAttemptRow {
  id: string;
  alert_rule_id: string;
  event_candidate_id: string;
  channel: string;
  destination_summary: string;
  status: string;
  message_preview: string;
  provider_response: string | null;
  error_message: string | null;
  attempted_at: string;
}

export interface NotificationAttemptDetailRow {
  id: string;
  alert_name: string;
  event_title: string;
  channel: string;
  destination_summary: string;
  status: string;
  message_preview: string;
  provider_response: string | null;
  error_message: string | null;
  attempted_at: string;
}

export interface NotificationAttemptDetail {
  id: string;
  alertName: string;
  eventTitle: string;
  channel: ChannelKey;
  destinationSummary: string;
  status: NotificationStatus;
  messagePreview: string;
  providerResponse: string | null;
  errorMessage: string | null;
  attemptedAt: string;
}

export interface EventRepository {
  upsertEventCandidate(event: EventCandidate): Promise<EventCandidate>;
  listActiveAlertRulesByCategory(category: string): Promise<AlertRule[]>;
}

export interface NotificationAttemptRepository {
  findNotificationAttempt(alertRuleId: string, eventCandidateId: string, channel: ChannelKey): Promise<NotificationAttempt | null>;
  createNotificationAttempt(attempt: NotificationAttempt): Promise<NotificationAttempt>;
  listRecentNotificationAttempts(limit: number): Promise<NotificationAttemptDetail[]>;
}

export function createRepository(db: D1Database): Repository {
  function prepare({ sql, params = [] }: PreparedStatement): D1PreparedStatement {
    return db.prepare(sql).bind(...params);
  }

  return {
    first<T>(sql: string, params: SqlParams = []) {
      return db.prepare(sql).bind(...params).first<T>();
    },

    async all<T>(sql: string, params: SqlParams = []) {
      const result = await db.prepare(sql).bind(...params).all<T>();

      return {
        results: result.results ?? [],
        success: result.success,
        meta: result.meta
      };
    },

    async run(sql: string, params: SqlParams = []) {
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

    async listActiveAlertRulesByCategory(category) {
      const result = await repository.all<AlertRuleRow>(
        `SELECT * FROM alert_rules
          WHERE active = 1 AND category = ?
          ORDER BY updated_at DESC`,
        [category]
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

export function createEventRepository(repository: Repository): EventRepository {
  return {
    async upsertEventCandidate(event) {
      await repository.run(
        `INSERT OR IGNORE INTO event_candidates (
          id,
          title,
          source,
          category,
          severity,
          numeric_value,
          occurred_at,
          url,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.title,
          event.source,
          event.category,
          event.severity ?? null,
          event.numericValue ?? null,
          event.occurredAt,
          event.url ?? null,
          event.createdAt
        ]
      );

      const row = await repository.first<EventCandidateRow>(`SELECT * FROM event_candidates WHERE id = ?`, [event.id]);
      return row ? fromEventCandidateRow(row) : event;
    },

    async listActiveAlertRulesByCategory(category) {
      const alertRepository = createAlertRuleRepository(repository);
      return alertRepository.listActiveAlertRulesByCategory(category);
    }
  };
}

export function createNotificationAttemptRepository(repository: Repository): NotificationAttemptRepository {
  return {
    async findNotificationAttempt(alertRuleId, eventCandidateId, channel) {
      const row = await repository.first<NotificationAttemptRow>(
        `SELECT * FROM notification_attempts
          WHERE alert_rule_id = ? AND event_candidate_id = ? AND channel = ?`,
        [alertRuleId, eventCandidateId, channel]
      );

      return row ? fromNotificationAttemptRow(row) : null;
    },

    async createNotificationAttempt(attempt) {
      await repository.run(
        `INSERT INTO notification_attempts (
          id,
          alert_rule_id,
          event_candidate_id,
          channel,
          destination_summary,
          status,
          message_preview,
          provider_response,
          error_message,
          attempted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          attempt.id,
          attempt.alertRuleId,
          attempt.eventCandidateId,
          attempt.channel,
          attempt.destinationSummary,
          attempt.status,
          attempt.messagePreview,
          attempt.providerResponse ?? null,
          attempt.errorMessage ?? null,
          attempt.attemptedAt
        ]
      );

      return attempt;
    },

    async listRecentNotificationAttempts(limit) {
      const result = await repository.all<NotificationAttemptDetailRow>(
        `SELECT
          na.id,
          ar.name AS alert_name,
          ec.title AS event_title,
          na.channel,
          na.destination_summary,
          na.status,
          na.message_preview,
          na.provider_response,
          na.error_message,
          na.attempted_at
        FROM notification_attempts na
        JOIN alert_rules ar ON ar.id = na.alert_rule_id
        JOIN event_candidates ec ON ec.id = na.event_candidate_id
        ORDER BY na.attempted_at DESC
        LIMIT ?`,
        [limit]
      );

      return result.results.map(fromNotificationAttemptDetailRow);
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

export function fromEventCandidateRow(row: EventCandidateRow): EventCandidate {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    category: row.category,
    severity: row.severity ? (row.severity as Severity) : undefined,
    numericValue: row.numeric_value ?? undefined,
    occurredAt: row.occurred_at,
    url: row.url ?? undefined,
    createdAt: row.created_at
  };
}

export function fromNotificationAttemptRow(row: NotificationAttemptRow): NotificationAttempt {
  return {
    id: row.id,
    alertRuleId: row.alert_rule_id,
    eventCandidateId: row.event_candidate_id,
    channel: row.channel as ChannelKey,
    destinationSummary: row.destination_summary,
    status: row.status as NotificationStatus,
    messagePreview: row.message_preview,
    providerResponse: row.provider_response ?? undefined,
    errorMessage: row.error_message ?? undefined,
    attemptedAt: row.attempted_at
  };
}

export function fromNotificationAttemptDetailRow(row: NotificationAttemptDetailRow): NotificationAttemptDetail {
  return {
    id: row.id,
    alertName: row.alert_name,
    eventTitle: row.event_title,
    channel: row.channel as ChannelKey,
    destinationSummary: row.destination_summary,
    status: row.status as NotificationStatus,
    messagePreview: row.message_preview,
    providerResponse: row.provider_response,
    errorMessage: row.error_message,
    attemptedAt: row.attempted_at
  };
}
