# Alert Notifications Interview Task

This repository is being built from the vague alerting brief in
[`interview-task.md`](./interview-task.md) using GitHub Spec Kit.

## Current Status

Planning is complete enough to start implementation. The full app has not been
implemented yet.

## Task Understanding

Build a small alerting product where an alert manager can define rules for
important world events, receive notifications through email or Slack, and review
rules and delivery history in an admin view. The interview evaluates the process,
assumptions, tradeoffs, validation, and commits as much as the final code.

## Chosen Approach

The planned implementation is a single Cloudflare-native TypeScript web app:

- Cloudflare Worker for API, admin UI assets, and optional scheduled evaluation.
- Cloudflare D1 for alert rules, normalized events, and notification attempts.
- Channel adapters for Slack, fake email, and future notification methods.
- Deterministic demo events before real external feeds.
- Fake delivery by default so tests and demo do not require paid services or
  real credentials.

Cloudflare outbound Email Sending is intentionally avoided for the free-tier
baseline because it is not available on Workers Free.

## Spec Kit Artifacts

- [Constitution](./.specify/memory/constitution.md)
- [Feature spec](./specs/001-alert-notifications/spec.md)
- [Implementation plan](./specs/001-alert-notifications/plan.md)
- [Research and tradeoffs](./specs/001-alert-notifications/research.md)
- [Data model](./specs/001-alert-notifications/data-model.md)
- [API contract](./specs/001-alert-notifications/contracts/api.md)
- [Tasks](./specs/001-alert-notifications/tasks.md)
- [Quickstart and demo plan](./specs/001-alert-notifications/quickstart.md)

## Smallest Useful Vertical Slice

1. Create an alert rule in the admin UI.
2. Submit a deterministic demo event.
3. Match the event against active rules.
4. Record one fake email or Slack notification attempt.
5. Show the attempt in admin history.
6. Run the same event again and show duplicate suppression.

## First Implementation Steps

1. Create the TypeScript, Worker, test, and D1 project scaffold.
2. Add D1 schema and repository helpers.
3. Implement alert rule validation and CRUD tests.
4. Build alert rule API routes and minimal admin form/list.
5. Implement event matching, fake channel dispatch, and duplicate suppression.

## Planned Local Commands

```bash
npm install
npm run db:migrate:local
npm test
npm run dev
```

These commands will become valid after the setup tasks are implemented.
