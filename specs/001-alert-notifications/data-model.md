# Data Model: Alert Notifications

## Entity: AlertRule

Represents a configured alert and notification destination.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Stable identifier |
| name | string | yes | Human-readable rule name |
| category | string | yes | Examples: breaking-news, market, disaster |
| threshold_type | string | yes | severity or numeric |
| threshold_value | string | yes | high/critical or numeric string |
| channel | string | yes | email, slack, or future channel key |
| destination | string | yes | Email address or Slack webhook/alias summary |
| active | boolean | yes | Disabled rules do not match |
| created_at | datetime | yes | Creation time |
| updated_at | datetime | yes | Last change time |

### Validation Rules

- name must be non-empty.
- category must be one of the supported demo categories.
- channel must map to a registered channel adapter.
- email destination must be an email address.
- Slack destination must be present; real webhook URL is read from secrets when
  configured, while stored destination can be a label.
- disabled rules remain visible but are ignored by matching.

## Entity: EventCandidate

Represents a normalized event that may trigger alerts.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Stable identifier, preferably from source plus external id |
| title | string | yes | Notification headline |
| source | string | yes | Source feed or demo input |
| category | string | yes | Same category vocabulary as rules |
| severity | string | no | low, medium, high, critical |
| numeric_value | number | no | Used for market threshold-style events |
| occurred_at | datetime | yes | When event happened |
| url | string | no | Source link |
| created_at | datetime | yes | Stored time |

### Validation Rules

- An event must have either severity or numeric_value.
- Unknown categories are accepted for storage but produce no matches unless rules
  support that category.
- Source plus event id should be unique to support duplicate suppression.

## Entity: NotificationAttempt

Represents one attempted notification for one alert and one event.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | yes | Stable identifier |
| alert_rule_id | string | yes | Related AlertRule |
| event_candidate_id | string | yes | Related EventCandidate |
| channel | string | yes | Channel used for attempt |
| destination_summary | string | yes | Redacted destination |
| status | string | yes | pending, sent, failed, skipped_duplicate |
| message_preview | string | yes | Safe preview shown in admin view |
| provider_response | string | no | Short provider response or fake adapter result |
| error_message | string | no | Failure reason |
| attempted_at | datetime | yes | Attempt time |

### Validation Rules

- alert_rule_id plus event_candidate_id plus channel must be unique for sent or
  failed attempts to prevent duplicate notifications.
- provider_response and error_message must not store secrets.

## Relationships

- AlertRule has many NotificationAttempts.
- EventCandidate has many NotificationAttempts.
- NotificationAttempt belongs to one AlertRule and one EventCandidate.

## State Transitions

```text
AlertRule: active -> disabled -> active
NotificationAttempt: pending -> sent
NotificationAttempt: pending -> failed
NotificationAttempt: pending -> skipped_duplicate
```
