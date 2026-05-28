# Alert Notifications

A single-tenant alerting app built on Cloudflare Workers + D1. An alert manager
configures event-based rules, submits deterministic demo events, and reviews
delivery history in a React admin view — without paid services or real
notification credentials.

Built as an interview exercise from [`interview-task.md`](./interview-task.md)
using [GitHub Spec Kit](https://github.com/fajtaiandris/github-spec-kit).

## What it does

- Create, list, enable, and delete alert rules (category + threshold + channel)
- Submit demo events that are matched against active rules
- Dispatch fake email and Slack notifications via adapter contracts
- Suppress duplicate attempts for the same alert/event/channel pair
- View recent delivery history with status, destination, and failure reason

## What it intentionally does not do

- No production authentication (single-tenant demo/admin mode)
- No real email sending (Cloudflare outbound Email is paid-only; fake adapter used)
- No real Slack without `SLACK_WEBHOOK_URL` secret (fake adapter by default)
- No live external feed ingestion (deterministic demo events)
- No queues, retries, or scheduled evaluation in the MVP

## Architecture

```text
Admin UI (React, Vite static assets)
         |
         v
Cloudflare Worker API  (/api/alerts, /api/events/demo, /api/attempts)
         |
         +--> D1: alert_rules, event_candidates, notification_attempts
         |
         +--> Matcher: active rules × normalized event → matched rules
         |
         +--> Channel registry
               |-- Email adapter   (fake-first; real provider injectable)
               |-- Slack adapter   (fake without webhook; real with secret)
               |-- Any third channel via the same NotificationChannel contract
```

## Cloudflare services used

| Service | Why |
|---------|-----|
| Workers | API, static asset hosting, optional scheduled handler |
| D1 | Relational storage, uniqueness constraints, history queries |
| Wrangler | Local D1 + Worker simulation |

## Cloudflare services avoided

| Service | Reason |
|---------|--------|
| Outbound Email Sending | Paid-only; fake adapter used instead |
| KV | D1 is a better fit for relational data |
| Queues | Direct dispatch is enough for demo scale |
| Durable Objects | No collaborative state required |

## Local setup

```bash
npm install
npm run db:migrate:local
npm test
npm run dev
```

Open the local URL printed by Wrangler (typically `http://localhost:8787`).

## Demo script

1. Open the admin view.
2. Create an email alert:
   - Name: `High severity disasters` · Category: `disaster`
   - Threshold: `severity / high` · Destination: `ops@example.com`
3. Create a Slack alert:
   - Name: `Breaking news to Slack` · Category: `breaking-news`
   - Threshold: `severity / high` · Destination: `demo-slack`
4. POST a demo disaster event to `/api/events/demo` (see [quickstart](./specs/001-alert-notifications/quickstart.md)).
5. Confirm one email attempt appears in the Recent attempts table.
6. POST the same event again — confirm no duplicate attempt is created.
7. POST a breaking-news event — confirm one Slack attempt appears.
8. Disable the Slack alert and POST the breaking-news event again — confirm no new attempt.

## Validation

```
npm test       → 10 test files, 45 tests, all pass
npm run typecheck  → 0 errors
npm run lint       → 0 warnings
npm run build      → clean Vite + Wrangler bundle
```

## Deployment

```bash
npm run db:migrate:remote
npm run deploy
```

Optional secrets:

```bash
wrangler secret put SLACK_WEBHOOK_URL   # real Slack delivery
wrangler secret put DELIVERY_MODE       # set to "real" to activate
```

## Spec Kit artifacts

- [Constitution](./.specify/memory/constitution.md)
- [Feature spec](./specs/001-alert-notifications/spec.md)
- [Implementation plan](./specs/001-alert-notifications/plan.md)
- [Research and tradeoffs](./specs/001-alert-notifications/research.md)
- [Data model](./specs/001-alert-notifications/data-model.md)
- [API contract](./specs/001-alert-notifications/contracts/api.md)
- [Tasks](./specs/001-alert-notifications/tasks.md)
- [Quickstart and demo plan](./specs/001-alert-notifications/quickstart.md)

## Known production gaps

- Auth: no authentication on write routes; add a shared admin token or Workers
  Access before exposing publicly.
- Real email: inject a Resend/SendGrid/Brevo adapter behind `createEmailChannel`
  when outbound sending is needed.
- Scheduled evaluation: `src/worker/scheduled.ts` is a stub; wire up the cron
  trigger and use `DEMO_EVENTS` from `src/worker/demoEvents.ts` for periodic runs.
- Retries: failed attempts are recorded but not retried; add Queues-backed retry
  if delivery reliability matters.
