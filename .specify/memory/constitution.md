<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> Small Shippable Slices
- [PRINCIPLE_2_NAME] -> Cloudflare-Native, Cost-Aware Defaults
- [PRINCIPLE_3_NAME] -> Testable Requirements and TDD Discipline
- [PRINCIPLE_4_NAME] -> Process Evidence and AI Output Review
- [PRINCIPLE_5_NAME] -> Extensible Interfaces, Minimal Abstractions
Added sections:
- Delivery Constraints
- Development Workflow
Removed sections:
- Template placeholder guidance
Templates requiring updates:
- .specify/templates/plan-template.md: OK, existing Constitution Check section is sufficient
- .specify/templates/spec-template.md: OK, assumptions and success criteria satisfy principles
- .specify/templates/tasks-template.md: OK, story/task/test ordering satisfies principles
- .specify/templates/commands/*.md: Not present in this Codex skills install
Follow-up TODOs: None
-->
# Sonrisa-hw Constitution

## Core Principles

### I. Small Shippable Slices
Every feature MUST be scoped as the smallest independently demonstrable vertical
slice that satisfies the interview brief. Implementation plans MUST identify the
MVP story first, defer nonessential polish, and keep time-cut options explicit.
Rationale: the task is evaluated on judgment and process under a 24-hour limit,
not on maximal feature volume.

### II. Cloudflare-Native, Cost-Aware Defaults
Architecture decisions MUST prefer Cloudflare-native services that are sensible
on the free plan when they meet the requirement without operational complexity.
Any paid, third-party, or self-hosted dependency MUST document why a free-tier
Cloudflare option is insufficient. Rationale: the preferred deployment target is
Cloudflare, and billing surprises are unacceptable for this exercise.

### III. Testable Requirements and TDD Discipline
Requirements, plans, and tasks MUST be written so they can be verified with
automated tests or a deterministic demo. Core business logic MUST have unit
tests before or alongside implementation. Integration paths for storage,
scheduled evaluation, email, and Slack MUST use fakes or local adapters unless
real credentials are explicitly available. Rationale: generated code is not
accepted without checks that prove the behavior.

### IV. Process Evidence and AI Output Review
Major decisions MUST leave evidence in repository artifacts, including
assumptions, rejected options, sanity checks, and known tradeoffs. AI-generated
outputs MUST be reviewed for hallucinated APIs, excessive scope, missing tests,
and deployment constraints before acceptance. Rationale: the interview evaluates
how the solution was reached, not only the final code.

### V. Extensible Interfaces, Minimal Abstractions
The design MUST support adding notification channels and event sources through
small explicit interfaces, but MUST NOT introduce generalized plugin systems,
workflow engines, queues, or distributed architecture before a working vertical
slice needs them. Rationale: email and Slack require extension points, while the
24-hour scope requires direct, understandable code.

## Delivery Constraints

- The target submission is a GitHub repository with meaningful milestone
  commits, prompt/process artifacts, specs, plan, tasks, tests, and a demo path.
- The implementation SHOULD fit within Cloudflare free-tier limits for expected
  demo usage.
- External credentials, webhooks, and API keys MUST be optional for local tests.
- Documentation MUST identify which parts are production-ready, mocked, or
  deliberately simplified.

## Development Workflow

- Follow Spec Kit order: constitution, specification, optional clarification,
  plan, tasks, analysis, then implementation.
- Preserve a visible decision log in the feature documentation rather than
  relying on chat history alone.
- Prefer one deployable app with clear seams over multiple services.
- Stop at each milestone to validate scope, tests, and assumptions before
  expanding the feature.

## Governance

This constitution supersedes conflicting generated plans or tasks. Amendments
require updating this file, recording a Sync Impact Report, and rechecking the
active spec, plan, and tasks for consistency. Versioning follows semantic
versioning: MAJOR for principle removals or incompatible governance changes,
MINOR for new principles or materially expanded policy, PATCH for wording-only
clarifications. Compliance is checked during planning, task generation, and
pre-implementation analysis.

**Version**: 1.0.0 | **Ratified**: 2026-05-28 | **Last Amended**: 2026-05-28
