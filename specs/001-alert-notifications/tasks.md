---
description: "Task list for alert notifications feature"
---

# Tasks: Alert Notifications

**Input**: Design documents from `specs/001-alert-notifications/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md), [quickstart.md](./quickstart.md)

**Tests**: Tests are required because the user explicitly requested tests and the constitution requires generated behavior to be validated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the smallest Cloudflare Worker TypeScript app needed for the vertical slice.

- [x] T001 Create TypeScript project metadata and npm scripts in `package.json`
- [x] T002 Configure Cloudflare Worker, static assets, and D1 binding in `wrangler.toml`
- [x] T003 [P] Configure TypeScript, Vitest, and linting in `tsconfig.json`, `vitest.config.ts`, and `eslint.config.js`
- [x] T004 [P] Create source and test directory skeletons in `src/` and `tests/`
- [x] T005 Create initial D1 schema migration in `src/storage/migrations/0001_initial.sql`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts and utilities that all user stories depend on.

**Critical**: No user story work should begin until this phase is complete.

- [ ] T006 [P] Define shared domain types for alert rules, events, and attempts in `src/domain/types.ts`
- [ ] T007 [P] Define notification channel payload and result types in `src/domain/notifications.ts`
- [ ] T008 [P] Create deterministic test fixtures for alerts and demo events in `tests/fixtures/alerts.ts`
- [ ] T009 Implement D1 repository wrapper and transaction helpers in `src/storage/repository.ts`
- [ ] T010 Implement API error and JSON response helpers in `src/worker/http.ts`
- [ ] T011 Implement fake notification channel adapter in `src/channels/fake.ts`

**Checkpoint**: Foundation ready; user story implementation can begin.

---

## Phase 3: User Story 1 - Configure Alert Rules (Priority: P1)

**Goal**: Alert manager can create, list, disable, and delete alert rules in the admin view.

**Independent Test**: Create a valid email or Slack alert, see it listed, disable it, and confirm invalid destinations are rejected.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add alert validation unit tests in `tests/unit/alertRules.test.ts`
- [ ] T013 [P] [US1] Add alert repository CRUD tests in `tests/integration/alertRepository.test.ts`
- [ ] T014 [P] [US1] Add admin alert form behavior tests in `tests/integration/admin-alerts.test.ts`

### Implementation for User Story 1

- [ ] T015 [US1] Implement alert rule validation in `src/domain/alertRules.ts`
- [ ] T016 [US1] Implement alert rule CRUD repository methods in `src/storage/repository.ts`
- [ ] T017 [US1] Implement alert rule API routes in `src/worker/routes.ts`
- [ ] T018 [US1] Build alert create/list UI in `src/app/AdminApp.tsx`
- [ ] T019 [US1] Add alert disable and delete UI actions in `src/app/AdminApp.tsx`

**Checkpoint**: User Story 1 is independently demonstrable.

---

## Phase 4: User Story 2 - Notify on Matching Events (Priority: P1)

**Goal**: Demo events match active alert rules and create exactly one notification attempt per alert/event/channel.

**Independent Test**: Submit a matching demo event twice and verify one created attempt and one duplicate skip.

### Tests for User Story 2

- [ ] T020 [P] [US2] Add event matching unit tests in `tests/unit/matcher.test.ts`
- [ ] T021 [P] [US2] Add duplicate suppression tests in `tests/unit/notifications.test.ts`
- [ ] T022 [P] [US2] Add fake channel dispatch tests in `tests/unit/channels.test.ts`

### Implementation for User Story 2

- [ ] T023 [P] [US2] Implement event candidate validation in `src/domain/events.ts`
- [ ] T024 [US2] Implement alert/event matcher in `src/domain/matcher.ts`
- [ ] T025 [US2] Implement notification orchestration and duplicate checks in `src/domain/notifications.ts`
- [ ] T026 [US2] Implement demo event evaluation route in `src/worker/routes.ts`
- [ ] T027 [P] [US2] Implement Slack webhook adapter behind channel contract in `src/channels/slack.ts`
- [ ] T028 [P] [US2] Implement fake-first email adapter behind channel contract in `src/channels/email.ts`
- [ ] T029 [US2] Persist notification attempts and provider summaries in `src/storage/repository.ts`

**Checkpoint**: User Story 2 proves the smallest end-to-end alerting loop.

---

## Phase 5: User Story 3 - Review Operations in Admin View (Priority: P2)

**Goal**: Admin can inspect recent notification attempts, related event details, and failures without direct database access.

**Independent Test**: After demo events run, open the admin view and verify recent attempts include status, channel, alert name, event title, and failure reason.

### Tests for User Story 3

- [ ] T030 [P] [US3] Add notification attempts API tests in `tests/integration/attempts-api.test.ts`
- [ ] T031 [P] [US3] Add admin delivery history UI tests in `tests/integration/admin-history.test.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Implement recent notification attempts query in `src/storage/repository.ts`
- [ ] T033 [US3] Implement notification attempts API route in `src/worker/routes.ts`
- [ ] T034 [US3] Build recent delivery history table and failure display in `src/app/AdminApp.tsx`

**Checkpoint**: Admin view is useful for demo and debugging.

---

## Phase 6: User Story 4 - Preserve Extension Path (Priority: P3)

**Goal**: A future channel can be added by implementing the channel contract without changing alert rule semantics.

**Independent Test**: A fake third channel receives the same notification payload as email and Slack through the registry.

### Tests for User Story 4

- [ ] T035 [P] [US4] Add third-channel contract test in `tests/unit/channel-contract.test.ts`

### Implementation for User Story 4

- [ ] T036 [US4] Implement minimal channel registry in `src/channels/index.ts`

**Checkpoint**: Future-channel requirement is evidenced without a plugin system.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finish documentation, demo reliability, and validation evidence.

- [ ] T037 [P] Update project README with architecture, tradeoffs, and demo steps in `README.md`
- [ ] T038 [P] Add local demo seed command or fixture in `src/worker/demoEvents.ts`
- [ ] T039 Run and record validation commands in `specs/001-alert-notifications/quickstart.md`
- [ ] T040 Record AI review notes, rejected shortcuts, and time cuts in `specs/001-alert-notifications/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies.
- Foundational (Phase 2) depends on Setup and blocks all user stories.
- User Story 1 and User Story 2 are both P1; implement User Story 1 first because it creates alert data needed for the notification loop.
- User Story 3 depends on notification attempts from User Story 2.
- User Story 4 can happen after Phase 2, but is lower priority than the MVP.
- Polish depends on whichever user stories are completed before the deadline.

### User Story Dependencies

- **US1 Configure Alert Rules**: Starts after Phase 2.
- **US2 Notify on Matching Events**: Starts after Phase 2, but demo is more useful after US1.
- **US3 Review Operations**: Starts after US2 records attempts.
- **US4 Preserve Extension Path**: Starts after Phase 2 and can be cut if time is short.

## Parallel Opportunities

- T003, T004, and T005 can be prepared independently after T001.
- T006, T007, T008, T010, and T011 are parallel after setup.
- US1 tests T012, T013, and T014 can be written in parallel.
- US2 tests T020, T021, and T022 can be written in parallel.
- Channel adapters T027 and T028 can be implemented in parallel after T025 defines orchestration.
- US3 tests T030 and T031 can be written in parallel.

## Parallel Example: User Story 2

```bash
# Parallelizable test-writing prompts:
Task: "Add event matching unit tests in tests/unit/matcher.test.ts"
Task: "Add duplicate suppression tests in tests/unit/notifications.test.ts"
Task: "Add fake channel dispatch tests in tests/unit/channels.test.ts"

# Parallelizable adapter implementation prompts:
Task: "Implement Slack webhook adapter behind channel contract in src/channels/slack.ts"
Task: "Implement fake-first email adapter behind channel contract in src/channels/email.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 alert rule CRUD.
3. Complete US2 demo event evaluation and fake notification attempts.
4. Stop and validate with tests plus the quickstart demo.
5. Add US3 admin history if time remains.

### Time-Cut Order

1. Cut real email provider integration; keep fake email adapter.
2. Cut real Slack webhook; keep fake Slack path using the same channel contract.
3. Cut scheduled evaluation; keep manual demo event route.
4. Cut US4 implementation; keep the documented contract.
5. Cut UI polish; keep forms, tables, and validation messages clear.

## Format Validation

All implementation tasks use checkbox, task ID, optional parallel marker, story
label where required, and explicit file paths.
