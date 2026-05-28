CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('severity', 'numeric')),
  threshold_value TEXT NOT NULL,
  channel TEXT NOT NULL,
  destination TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_active_category
  ON alert_rules (active, category);

CREATE TABLE IF NOT EXISTS event_candidates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  numeric_value REAL,
  occurred_at TEXT NOT NULL,
  url TEXT,
  created_at TEXT NOT NULL,
  CHECK (severity IS NOT NULL OR numeric_value IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_event_candidates_category_occurred
  ON event_candidates (category, occurred_at);

CREATE TABLE IF NOT EXISTS notification_attempts (
  id TEXT PRIMARY KEY,
  alert_rule_id TEXT NOT NULL,
  event_candidate_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  destination_summary TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'skipped_duplicate')),
  message_preview TEXT NOT NULL,
  provider_response TEXT,
  error_message TEXT,
  attempted_at TEXT NOT NULL,
  FOREIGN KEY (alert_rule_id) REFERENCES alert_rules (id) ON DELETE CASCADE,
  FOREIGN KEY (event_candidate_id) REFERENCES event_candidates (id) ON DELETE CASCADE,
  UNIQUE (alert_rule_id, event_candidate_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_attempts_attempted_at
  ON notification_attempts (attempted_at DESC);
