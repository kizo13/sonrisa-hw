# Research: Alert Notifications

**Date**: 2026-05-28

## Task Understanding

The interview brief asks for an end-to-end alerting product from vague input:
users define alert rules for important world events, notifications go to email
and Slack, more channels should be possible later, and an admin view is needed.
The deliverable must show planning judgment, assumptions, AI output review, and
validation, not just code volume.

## Key Assumptions

- This is a single-tenant demo/admin application for interview review.
- "Important" is normalized to category plus severity or threshold value.
- Deterministic demo events are acceptable for the smallest vertical slice.
- Fake email and Slack adapters are required for tests and local demo.
- Real Slack can use incoming webhooks if configured.
- Real outbound email needs an external provider for free-tier deployment,
  because Cloudflare outbound Email Sending is not available on Workers Free.
- Production-grade auth, real feed ingestion, retries, and queues are time-cut
  candidates.

## Decisions

### Decision: Use Cloudflare Workers for the app boundary

**Rationale**: A Worker can host the API, static admin UI assets, and optional
scheduled evaluation in one deployable unit. This keeps the system Cloudflare
native, small, and free-tier-friendly for demo usage.

**Alternatives considered**:

- **Cloudflare Pages plus Functions**: Also viable, but a single Worker keeps
  routing, scheduled handlers, and bindings in one place.
- **Full server on Fly/Render/Railway**: More familiar for many apps, but less
  aligned with the Cloudflare preference and adds hosting choices outside scope.

### Decision: Use Cloudflare D1 as the primary store

**Rationale**: Alert rules, event candidates, and notification attempts are
relational and benefit from uniqueness constraints for duplicate suppression.
D1 has a free tier that is enough for demo-scale writes and reads.

**Alternatives considered**:

- **KV**: Good for simple key-value lookup, but weaker fit for relational
  history queries and uniqueness by alert/event.
- **Durable Objects**: Useful for coordination and per-entity state, but
  unnecessary for a small single-tenant demo.
- **Postgres provider**: More production-standard, but not Cloudflare-native and
  adds setup overhead.

### Decision: Use deterministic demo event input before real feeds

**Rationale**: The vague brief does not specify data providers, and external
feed selection can consume the 24-hour deadline. Demo events prove matching,
notification dispatch, duplicate suppression, admin history, and tests without
relying on unstable APIs.

**Alternatives considered**:

- **Public RSS/news/disaster feeds**: Useful stretch goal, but normalization,
  reliability, rate limits, and category mapping are product decisions.
- **Market API integration**: Likely needs provider keys and careful rate-limit
  handling, which is not needed to validate the core workflow.

### Decision: Model notification channels as small adapters

**Rationale**: Email and Slack have different provider details but share the
same alert/event notification payload. A narrow adapter interface supports tests
and future channels without a plugin framework.

**Alternatives considered**:

- **Hard-code email and Slack in matching code**: Faster initially, but fails the
  "more channels later" requirement.
- **Full plugin registry/workflow engine**: Over-engineered for two channels and
  a 24-hour task.

### Decision: Fake email by default; optional external email provider later

**Rationale**: Cloudflare Email Routing can receive/route inbound mail, but
Cloudflare outbound Email Sending is only available on Workers Paid. The free
and testable demo path should record fake email delivery attempts. If real email
is needed, add an external provider adapter such as Resend, SendGrid, or Brevo
behind the same channel contract.

**Alternatives considered**:

- **Cloudflare Email Sending**: Avoid for free-plan fit.
- **SMTP from Worker**: Workers do not provide raw SMTP sockets in the normal
  request path, and provider APIs are simpler.

### Decision: Avoid Queues for the MVP

**Rationale**: Queues are useful for reliable asynchronous delivery, but direct
dispatch plus recorded attempts is enough for demo-scale behavior. This keeps
the vertical slice easier to reason about and test.

**Alternatives considered**:

- **Cloudflare Queues**: Viable stretch if notification delivery becomes slow or
  retry requirements become important.

## Proposed Cloudflare-Native Architecture

```text
Admin UI (static assets)
        |
        v
Cloudflare Worker API
        |
        +--> D1: alert_rules, event_candidates, notification_attempts
        |
        +--> Matcher: active rules x normalized event
        |
        +--> Channel adapters
              |-- Fake email adapter (default local/demo)
              |-- Slack webhook adapter (optional real secret)
              |-- Optional external email API adapter (time permitting)
```

Optional stretch:

```text
Cron Trigger --> Worker scheduled handler --> fetch configured feed or seed demo event
```

## Services and Features To Use

- **Cloudflare Workers**: Single deployable runtime for API, admin UI assets,
  and optional scheduled handler.
- **Cloudflare D1**: Relational storage with uniqueness constraints and recent
  history queries.
- **Wrangler local development**: Local D1 and Worker simulation for demo.
- **Cron Triggers**: Stretch feature for periodic evaluation if the manual demo
  path is complete.
- **Worker secrets**: Store Slack webhook and optional email provider API keys.
- **Workers Logs**: Basic operational debugging during demo.

## Services and Features To Avoid Initially

- **Cloudflare Email Sending**: Avoid because outbound sending is paid-only for
  Workers, conflicting with the expected free-tier fit.
- **Cloudflare KV**: Avoid because D1 is a better fit for relational rules,
  delivery history, and duplicate suppression.
- **Cloudflare Queues**: Avoid for MVP because direct dispatch is simpler;
  revisit for retries and scale.
- **Durable Objects**: Avoid because no collaborative or strongly coordinated
  state is required.
- **R2**: Avoid because there are no large binary assets or archives.
- **Workflows/Agents/Vectorize/AI**: Avoid because they do not directly support
  the smallest alerting vertical slice.
- **Full auth provider**: Avoid for MVP; document trusted demo/admin access and
  optionally protect deployed write routes with a shared admin token.

## Smallest Useful Vertical Slice

1. Create one alert rule in the admin UI.
2. Submit or select one deterministic demo event.
3. Match the event against active rules.
4. Record one fake email or Slack notification attempt.
5. Show the attempt in admin history.
6. Verify duplicate suppression by running the same event twice.

## Risks and Time-Cut Options

- **Real data feeds**: Cut first. Use deterministic demo events and document the
  future ingestion seam.
- **Real email sending**: Cut or make optional because Cloudflare-native free
  outbound email is not available.
- **Slack webhook setup**: If credentials are unavailable, use fake Slack and
  show where the secret would be configured.
- **Scheduled evaluation**: Cut if manual event evaluation proves the vertical
  slice.
- **Admin UI polish**: Keep forms and tables simple; prioritize observable
  behavior and tests.
- **Authentication**: Use local/trusted admin mode or a simple shared secret if
  deployed publicly; full auth is out of scope.

## AI Output Review Notes (2026-05-28)

### Accepted outputs (no changes needed)

- Channel adapter interface and fake-first pattern — matches the brief's
  extensibility requirement and is small enough that no abstraction overhead
  was introduced.
- D1 repository layer with raw SQL — avoids ORM dependency; SQL is readable
  and directly testable with fake repository instances.
- TDD-first task ordering — tests were written before each implementation phase;
  no implementation code was accepted without a corresponding test.
- Duplicate suppression via SQL UNIQUE constraint — simpler and more reliable
  than application-level checks alone; correct approach for the stated goal.

### Reviewed and adjusted outputs

- **Routes.ts channel map → registry**: Initial output embedded a private
  `createChannelMap` function. Replaced with `createChannelRegistry` from
  `src/channels/index.ts` so the extension seam is explicit and testable
  (US4 requirement).
- **`NotificationAttemptDetail` placement**: AI initially suggested defining
  the JOIN result type in `types.ts`. Kept it in `repository.ts` instead
  because it is a query view type, not a stored domain entity.
- **Admin history test scope**: First draft proposed testing the React
  component with DOM queries. Changed to testing `historyView.ts` utility
  functions instead — same coverage, no DOM setup, consistent with the
  `admin-alerts.test.ts` pattern already in the project.

### Rejected shortcuts

- **Skipping the channel registry (US4)**: The brief explicitly asks for
  a future-channel seam. Keeping the local map would pass all tests but
  would not evidence the extensibility requirement.
- **Inlining attempt detail mapping in routes.ts**: Suggested during
  Phase 5 to avoid adding a `fromNotificationAttemptDetailRow` converter.
  Rejected to keep mapping consistent with the existing `fromAlertRuleRow`
  pattern.
- **Using `crypto.randomUUID()` for attempt IDs**: Replaced with
  deterministic IDs (`attempt_{alertId}_{eventId}_{channel}`) to keep
  tests predictable without mocking.

### Time cuts made

- Real email provider (Resend/SendGrid): fake adapter recorded; seam documented
  in README.
- Scheduled evaluation: `scheduled.ts` stub left in place; `demoEvents.ts`
  exports payloads ready for a cron handler.
- Production auth: out of scope; noted as a known gap in README.

## Source Notes

- Cloudflare Workers limits and pricing: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare KV pricing: https://developers.cloudflare.com/kv/platform/pricing/
- Cloudflare Queues pricing: https://developers.cloudflare.com/queues/platform/pricing/
- Cloudflare Email Workers and Email Sending availability: https://developers.cloudflare.com/email-routing/email-workers/
