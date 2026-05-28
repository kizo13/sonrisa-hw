# Quickstart and Demo Plan: Alert Notifications

This is the planned local/deployed demo path. Commands may be adjusted during
implementation if the final scaffolding differs.

## Local Setup

```bash
npm install
npm run db:migrate:local
npm test
npm run dev
```

Open the local Worker/admin URL printed by Wrangler.

## Demo Script

1. Open the admin view.
2. Create an email alert:
   - Name: `High severity disasters`
   - Category: `disaster`
   - Threshold: `severity >= high`
   - Channel: `email`
   - Destination: `ops@example.com`
3. Create a Slack alert:
   - Name: `Breaking news to Slack`
   - Category: `breaking-news`
   - Threshold: `severity >= high`
   - Channel: `slack`
   - Destination: `demo-slack`
4. Submit a demo disaster event.
5. Confirm exactly one email attempt appears in recent history.
6. Submit the same demo disaster event again.
7. Confirm no duplicate notification attempt is created.
8. Submit a demo breaking-news event.
9. Confirm one Slack attempt appears in recent history.
10. Disable the Slack alert and submit the breaking-news event again.
11. Confirm no new Slack attempt is created for the disabled rule.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Recorded Validation Output (2026-05-28)

```
$ npm test
 Test Files  10 passed (10)
      Tests  45 passed (45)
   Duration  342ms

$ npm run typecheck
(no output — 0 errors)

$ npm run lint
(no output — 0 warnings)
```

### Test coverage by area

| File | Tests |
|------|-------|
| `tests/unit/alertRules.test.ts` | Alert rule validation |
| `tests/unit/matcher.test.ts` | Event/rule matching logic |
| `tests/unit/notifications.test.ts` | Duplicate suppression, attempt creation |
| `tests/unit/channels.test.ts` | Email/Slack fake and real adapters |
| `tests/unit/events.test.ts` | Demo event candidate validation |
| `tests/unit/channel-contract.test.ts` | Third-channel registry contract |
| `tests/integration/alertRepository.test.ts` | Alert CRUD repository |
| `tests/integration/admin-alerts.test.ts` | Admin form behavior |
| `tests/integration/attempts-api.test.ts` | Attempts JOIN query |
| `tests/integration/admin-history.test.ts` | History view status labels |

## Cloudflare Deployment Plan

```bash
npm run db:migrate:remote
npm run deploy
```

Required Cloudflare bindings:

- D1 database binding for alert storage.
- Optional `SLACK_WEBHOOK_URL` secret for real Slack delivery.
- Optional external email provider secret if real email delivery is added.

Default demo behavior uses fake delivery adapters, so real notification secrets
are not required for the reviewed vertical slice.

## README Evidence To Include

- What the app does and what it intentionally does not do.
- Cloudflare services used and avoided.
- Demo script with screenshots or terminal output if time permits.
- Test commands and latest passing output.
- Time-cut decisions and known production gaps.
