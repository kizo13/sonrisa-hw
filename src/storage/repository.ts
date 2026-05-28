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
