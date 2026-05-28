# Implementation Plan: Alert Notifications

**Branch**: `001-alert-notifications` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-alert-notifications/spec.md`

## Summary

Build a small single-tenant alerting app that lets an alert manager configure
event-based alerts, evaluate deterministic demo events, send or fake email and
Slack notifications, and review delivery history from an admin view. The planned
implementation is a single Cloudflare Worker-hosted TypeScript web app with D1
storage and adapter-style notification channels. The MVP intentionally avoids
real external event feeds, full authentication, queues, and generalized plugin
systems.

## Technical Context

**Language/Version**: TypeScript on Cloudflare Workers runtime, with Node.js
tooling for local tests.

**Primary Dependencies**: Vite for the admin UI, a small Worker API layer
(Hono or direct Worker routing), Cloudflare Wrangler, Vitest, React only if the
UI needs component state beyond basic forms.

**Storage**: Cloudflare D1 for alert rules, normalized demo events, and
notification attempts.

**Testing**: Vitest for unit tests; local adapter tests for Slack/email fakes;
optional Miniflare/Wrangler local integration tests if setup remains small.

**Target Platform**: Cloudflare Workers with static assets for the admin UI.

**Project Type**: Single web application with an admin UI and server-side Worker
API.

**Performance Goals**: Admin actions should complete in under 1 second locally;
matching a demo event against expected demo-scale rules should complete in under
5 seconds including fake delivery.

**Constraints**: Must run without paid Cloudflare services, without real Slack
or email credentials, and with a documented fake-delivery mode. Any real
provider calls must be isolated behind channel adapters.

**Scale/Scope**: Demo-scale single-tenant app: tens of alert rules, recent
delivery history, deterministic demo events, and optional scheduled evaluation
only if time remains.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Small Shippable Slices**: PASS. MVP is alert rule CRUD, demo event
  evaluation, fake/real Slack attempt recording, fake email attempt recording,
  and admin history.
- **Cloudflare-Native, Cost-Aware Defaults**: PASS. Workers and D1 are primary.
  Cloudflare outbound Email Sending is avoided because it is not available on
  the free Workers plan.
- **Testable Requirements and TDD Discipline**: PASS. Core matching, validation,
  duplicate suppression, and channel adapters are test-first units.
- **Process Evidence and AI Output Review**: PASS. Research decisions, risks,
  quickstart, and tasks are documented in this feature directory.
- **Extensible Interfaces, Minimal Abstractions**: PASS. Use a channel adapter
  interface only; avoid plugin frameworks, queues, and workflow engines for MVP.

## Project Structure

### Documentation (this feature)

```text
specs/001-alert-notifications/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── AdminApp.tsx
│   └── styles.css
├── worker/
│   ├── index.ts
│   ├── routes.ts
│   └── scheduled.ts
├── domain/
│   ├── alertRules.ts
│   ├── events.ts
│   ├── matcher.ts
│   └── notifications.ts
├── channels/
│   ├── email.ts
│   ├── fake.ts
│   └── slack.ts
└── storage/
    ├── migrations/
    └── repository.ts

tests/
├── unit/
│   ├── alertRules.test.ts
│   ├── matcher.test.ts
│   └── notifications.test.ts
└── integration/
    └── admin-flow.test.ts
```

**Structure Decision**: Use a single app to keep deployment, local setup, and
demo simple. Split source by domain, channel adapters, Worker boundary, and UI
only where that separation directly supports tests or future channels.

## Complexity Tracking

No constitution violations. Deferred complexity includes real feed ingestion,
production authentication, queue-backed delivery, retries with backoff, and
multi-tenant user accounts.

## Phase 0: Research Summary

See [research.md](./research.md). Key decisions:

- Use Workers plus D1 as the Cloudflare-native baseline.
- Use deterministic demo events before external feeds.
- Use direct dispatch plus recorded attempts before Queues.
- Use fake email by default and optional external email provider integration,
  because Cloudflare outbound Email Sending is paid-only.

## Phase 1: Design Summary

See [data-model.md](./data-model.md) for entities and [contracts/api.md](./contracts/api.md)
for the HTTP/UI contract. See [quickstart.md](./quickstart.md) for demo and
validation flow.

## Post-Design Constitution Check

- **Small Shippable Slices**: PASS. User Story 1 and User Story 2 form the MVP;
  User Story 3 is admin visibility; User Story 4 is limited to a documented
  adapter seam and one fake-channel test.
- **Cloudflare-Native, Cost-Aware Defaults**: PASS. No paid Cloudflare service
  is required for the demo path.
- **Testable Requirements and TDD Discipline**: PASS. Tasks include tests for
  all matching, dispatch, and duplicate-suppression behavior before code.
- **Process Evidence and AI Output Review**: PASS. Decisions and rejected
  services are recorded in research and tasks.
- **Extensible Interfaces, Minimal Abstractions**: PASS. Channel extension is a
  narrow interface, not a runtime plugin system.
