# Change: Dashboard executive insights

## Why

The current Inicio page already shows several KPIs, but it behaves mostly like a metrics board. A more serious CRM home page should help the user understand what requires attention today: overdue work, commercial risk, upcoming closes and CRM data hygiene.

This change evolves the existing `DashboardPage` at `/` into an executive, actionable dashboard using only data already available in the frontend.

## What changes

- Refactor dashboard business logic out of `DashboardPage` into pure, tested helpers.
- Add executive KPIs focused on pipeline, weighted pipeline, overdue tasks and upcoming closes.
- Add actionable alerts for commercial and operational risks.
- Add prioritized lists for upcoming actions and upcoming commercial closes.
- Add a CRM health section for data quality issues such as companies without owner, contacts without email and deals without expected close date.
- Keep the existing Inicio route (`/`) and sidebar label; this replaces/evolves the current dashboard content rather than adding a duplicate page.
- Keep the change frontend-only; no new backend endpoints.

## Out of scope

- Backend metrics endpoints or server-side aggregations.
- Persisted dashboard configuration.
- URL-aware filters for dashboard CTAs.
- Changing CRM domain contracts or API payloads.
- Replacing module list pages; dashboard links navigate to existing routes.
