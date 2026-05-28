# Feature Specification: Alert Notifications

**Feature Branch**: `001-alert-notifications`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "We want users to be able to set up alerts so they get notified when something important happens in the world - like breaking news, market movements, natural disasters, that kind of thing. Should work for both email and Slack. Make it flexible enough that we can add more channels later. We need an admin view too."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Alert Rules (Priority: P1)

An alert manager creates, reviews, and updates alert rules that define what
events matter and where notifications should be sent.

**Why this priority**: Without alert configuration there is no user value and no
meaningful way to demonstrate the product.

**Independent Test**: Can be tested by creating an alert rule for a chosen event
category, choosing email or Slack, saving it, and seeing it listed in the admin
view with its active status and destination summary.

**Acceptance Scenarios**:

1. **Given** the alert manager is on the admin view, **When** they create a rule
   for "natural disasters" with minimum severity "high" and an email address,
   **Then** the rule is saved as active and appears in the alert list.
2. **Given** an existing active alert rule, **When** the alert manager disables
   it, **Then** future matching events no longer produce notification attempts.
3. **Given** an invalid destination for the selected channel, **When** the alert
   manager submits the form, **Then** the system explains the validation problem
   and does not save the invalid rule.

---

### User Story 2 - Notify on Matching Events (Priority: P1)

The system evaluates candidate world events against active alert rules and
notifies the configured destination through email or Slack.

**Why this priority**: This is the core promise of the brief and the smallest
useful vertical slice must prove end-to-end notification behavior.

**Independent Test**: Can be tested by submitting or loading a demo event that
matches a saved alert and verifying that a delivery attempt is recorded for the
selected channel with the expected message content.

**Acceptance Scenarios**:

1. **Given** an active Slack alert for high-severity breaking news, **When** a
   matching event is evaluated, **Then** one Slack notification attempt is
   recorded with the event title, category, source, and link.
2. **Given** an active email alert for a market movement threshold, **When** a
   matching market event is evaluated, **Then** one email notification attempt is
   recorded with the event details and alert name.
3. **Given** the same event is evaluated twice for the same alert, **When** the
   second evaluation runs, **Then** no duplicate notification is attempted.

---

### User Story 3 - Review Operations in Admin View (Priority: P2)

An admin reviews alert rules, recent notification attempts, related event
details, and failures from one operational view.

**Why this priority**: The brief explicitly asks for an admin view, and the
interview task benefits from visible evidence of system behavior and failure
handling.

**Independent Test**: Can be tested by opening the admin view after configured
rules and demo events exist, then confirming recent delivery results and related
event details are visible without inspecting logs or storage directly.

**Acceptance Scenarios**:

1. **Given** several delivery attempts exist, **When** the admin opens the admin
   view, **Then** they can see the most recent attempts with status, channel,
   alert name, event title, and error details when present.
2. **Given** a delivery fails, **When** the admin reviews the delivery history,
   **Then** the failure reason is visible and the alert remains editable.

---

### User Story 4 - Preserve Extension Path (Priority: P3)

A developer can add another notification channel later without redesigning alert
rules or rewriting existing matching behavior.

**Why this priority**: Future channel flexibility is required, but it should not
block the smaller email and Slack vertical slice.

**Independent Test**: Can be tested by reading the channel contract and adding a
fake channel in tests that receives the same notification payload shape as email
and Slack.

**Acceptance Scenarios**:

1. **Given** the channel contract is documented, **When** a new fake channel is
   used in tests, **Then** it can receive notification payloads without changing
   saved alert rule semantics.

### Edge Cases

- A candidate event has no category or severity.
- A matching alert has been disabled between event ingestion and evaluation.
- A channel destination is malformed or missing.
- A notification provider is unavailable or returns an error.
- The same external event appears more than once from the source feed.
- No alert rules exist yet.
- No recent delivery attempts exist yet.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an alert manager to create an alert rule with
  name, event category, trigger threshold, notification channel, destination,
  and active status.
- **FR-002**: System MUST support email and Slack notification channels for the
  first shippable version.
- **FR-003**: System MUST validate required alert fields and destination format
  before saving a rule.
- **FR-004**: System MUST list saved alert rules in an admin view with channel,
  trigger summary, active status, and last updated time.
- **FR-005**: System MUST allow an alert manager to disable or delete an alert
  rule.
- **FR-006**: System MUST accept candidate events with title, source, category,
  severity or threshold value, occurred time, and optional URL.
- **FR-007**: System MUST evaluate candidate events against active alert rules
  and identify matches.
- **FR-008**: System MUST create a notification attempt for each matching active
  alert and selected channel.
- **FR-009**: System MUST prevent duplicate notification attempts for the same
  alert and event.
- **FR-010**: System MUST record delivery status, provider response summary,
  and error details for each notification attempt.
- **FR-011**: System MUST show recent notification attempts, related event
  details, and failure details in the admin view.
- **FR-012**: System MUST allow notification methods beyond email and Slack to
  be added without changing the meaning of existing alert rules.
- **FR-013**: System MUST provide a deterministic demo path that works without
  paid services or production credentials.
- **FR-014**: System MUST document assumptions, tradeoffs, validation checks,
  and time-cut decisions as part of the submitted repository artifacts.

### Key Entities *(include if feature involves data)*

- **AlertRule**: A saved rule defining event category, trigger threshold,
  notification channel, destination, active status, and timestamps.
- **EventCandidate**: A normalized world event or market movement that can be
  evaluated against alert rules. Includes title, source, category, severity or
  threshold value, occurred time, and optional URL.
- **NotificationAttempt**: A record of an attempted notification for one alert
  and one event. Includes channel, destination summary, status, timestamps,
  provider response summary, and error details.
- **Channel**: A supported notification method. The first version includes
  email and Slack.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can create a valid email or Slack alert rule from the
  admin view in under 2 minutes.
- **SC-002**: A demo event that matches an active alert produces exactly one
  notification attempt and a visible delivery history entry within 60 seconds.
- **SC-003**: Re-evaluating the same demo event for the same alert does not
  create a duplicate notification attempt.
- **SC-004**: The admin view exposes at least the 20 most recent notification
  attempts with status and failure reason where applicable.
- **SC-005**: Automated tests cover alert validation, event matching, duplicate
  suppression, channel dispatch through fakes, and admin data loading.
- **SC-006**: The demo can run using only free-tier-friendly services and
  without real email or Slack credentials by using documented fake delivery.
- **SC-007**: Adding a fake third channel for tests requires a localized channel
  implementation and no change to the AlertRule entity meaning.

## Assumptions

- The first version is a single-tenant demo/admin application, not a public
  multi-user SaaS product.
- Authentication and account management are out of scope for the first vertical
  slice; access is treated as trusted demo/admin access and documented as such.
- "Something important" is represented by normalized event category plus a
  severity or threshold value. Natural disasters and breaking news use severity;
  market movements use a threshold-style value.
- External event feeds are not required for the smallest demo. A deterministic
  demo event input path is acceptable, with real feeds deferred if time allows.
- Real email and Slack delivery are optional for local tests. Fake delivery must
  exercise the same matching and attempt-recording behavior.
- Delivery history can be capped to recent records for the demo.
- English-only copy is acceptable for the 24-hour task.
