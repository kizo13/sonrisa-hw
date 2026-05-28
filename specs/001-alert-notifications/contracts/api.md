# API Contract: Alert Notifications

This contract is intentionally small and demo-oriented. It defines the API shape
needed by the admin UI and tests; exact framework syntax is deferred to
implementation.

## Alert Rules

### GET /api/alerts

Returns saved alert rules ordered by updated time descending.

**Response 200**

```json
{
  "alerts": [
    {
      "id": "alert_123",
      "name": "High severity disasters",
      "category": "disaster",
      "thresholdType": "severity",
      "thresholdValue": "high",
      "channel": "email",
      "destinationSummary": "ops@example.com",
      "active": true,
      "updatedAt": "2026-05-28T12:00:00Z"
    }
  ]
}
```

### POST /api/alerts

Creates an alert rule.

**Request**

```json
{
  "name": "High severity disasters",
  "category": "disaster",
  "thresholdType": "severity",
  "thresholdValue": "high",
  "channel": "email",
  "destination": "ops@example.com",
  "active": true
}
```

**Response 201**

```json
{
  "alert": {
    "id": "alert_123",
    "name": "High severity disasters",
    "category": "disaster",
    "thresholdType": "severity",
    "thresholdValue": "high",
    "channel": "email",
    "destinationSummary": "ops@example.com",
    "active": true,
    "updatedAt": "2026-05-28T12:00:00Z"
  }
}
```

**Response 400**

```json
{
  "error": {
    "code": "invalid_alert",
    "message": "Destination must be a valid email address."
  }
}
```

### PATCH /api/alerts/{id}

Updates active status or editable rule fields.

**Request**

```json
{
  "active": false
}
```

**Response 200**

```json
{
  "alert": {
    "id": "alert_123",
    "active": false,
    "updatedAt": "2026-05-28T12:10:00Z"
  }
}
```

### DELETE /api/alerts/{id}

Deletes an alert rule.

**Response 204**

No body.

## Demo Events

### POST /api/events/demo

Creates or reuses a deterministic demo event and evaluates it against active
alerts.

**Request**

```json
{
  "title": "Major earthquake near demo city",
  "source": "demo",
  "category": "disaster",
  "severity": "high",
  "occurredAt": "2026-05-28T12:15:00Z",
  "url": "https://example.test/demo-earthquake"
}
```

**Response 200**

```json
{
  "event": {
    "id": "event_demo_earthquake",
    "title": "Major earthquake near demo city",
    "category": "disaster"
  },
  "matchedAlerts": 1,
  "createdAttempts": 1,
  "skippedDuplicates": 0
}
```

## Notification Attempts

### GET /api/attempts?limit=20

Returns recent notification attempts for the admin view.

**Response 200**

```json
{
  "attempts": [
    {
      "id": "attempt_123",
      "alertName": "High severity disasters",
      "eventTitle": "Major earthquake near demo city",
      "channel": "email",
      "destinationSummary": "ops@example.com",
      "status": "sent",
      "messagePreview": "High severity disasters: Major earthquake near demo city",
      "providerResponse": "fake-email: accepted",
      "errorMessage": null,
      "attemptedAt": "2026-05-28T12:16:00Z"
    }
  ]
}
```

## Channel Adapter Contract

Each channel implementation receives the same notification payload and returns a
delivery result.

```ts
type NotificationPayload = {
  alertName: string;
  eventTitle: string;
  category: string;
  source: string;
  occurredAt: string;
  url?: string;
};

type DeliveryResult = {
  status: "sent" | "failed";
  providerResponse?: string;
  errorMessage?: string;
};
```
