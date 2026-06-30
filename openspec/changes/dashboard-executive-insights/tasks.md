# Tasks

- [x] Review current `DashboardPage` behavior, data hooks and tests.
- [x] Create `dashboardMetrics.ts` with pure derivation helpers.
- [x] Move CSV export helper out of `DashboardPage` if still used.
- [x] Add tests for dashboard metrics: pipeline, weighted pipeline, overdue tasks and upcoming closes.
- [x] Add tests for actionable alerts: deals without next task, companies without owner, contacts without email and deals without close date.
- [x] Add tests for upcoming action sorting.
- [x] Refactor `DashboardPage` to use pure helpers and preserve current useful KPIs.
- [x] Add actionable alerts section with CTAs to existing module routes.
- [x] Add upcoming actions list linking to task details.
- [x] Add upcoming closes list linking to deal details.
- [x] Add CRM health section.
- [x] Add/adjust integration tests for DashboardPage render states and links.
- [x] Run focused tests and `pnpm type-check` without running build.
