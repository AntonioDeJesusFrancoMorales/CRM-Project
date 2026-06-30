# Design: Dashboard executive insights

## Approach

Evolve `src/features/dashboard/pages/DashboardPage.tsx` into a thin composition layer and move calculation-heavy logic into pure modules:

- `src/features/dashboard/lib/dashboardMetrics.ts` — KPIs, alerts, upcoming actions, upcoming closes and CRM health derivation.
- `src/features/dashboard/lib/dashboardCsv.ts` — existing CSV export behavior extracted from the page.
- `src/features/dashboard/components/*` — presentational sections for KPIs, alerts and lists if the page becomes too large.

The dashboard continues to consume existing hooks:

- `useTratos()`
- `useTareas()`
- `useContactos()`
- `useEmpresas()`
- `useUsuarios()`

No backend changes are required.

## Sections

### Executive KPIs

- Open pipeline: sum of `valorEstimado` for `estado === 'ABIERTO'`.
- Weighted pipeline: sum of `valorEstimado * probabilidad / 100` for open deals.
- Overdue tasks: tasks with `fechaCompletada === null` and `fechaLimite < now`.
- Upcoming closes: open deals with `fechaCierreEsperada` within the next 30 days.

Existing useful KPIs such as conversion, ticket average and CSAT can remain if they do not crowd the layout.

### Actionable alerts

- Open deals without a future task.
- Overdue tasks requiring attention.
- Companies without `responsableId`.
- Active contacts without open opportunity.
- Open deals without expected close date.

Each alert should include a short explanation and a CTA to the relevant module route.

### Upcoming actions

Prioritize tasks by:

1. overdue first,
2. due within the next 7 days,
3. priority weight (`URGENTE`, `ALTA`, `MEDIA`, `BAJA`),
4. nearest `fechaLimite`.

Each item links to `/tareas/:id`.

### Upcoming commercial closes

Show open deals with expected close date in the next 30 days, ordered by nearest close date. Each item links to `/tratos/:id`.

### CRM health

Summarize data hygiene issues:

- companies without owner,
- contacts without email,
- deals without expected close date,
- tasks without description.

## Partial failure strategy

The dashboard should degrade gracefully. If one query fails but others succeed, show available sections and an inline warning that some metrics may be incomplete.

If the current hooks do not expose enough error state for all sections, implement the first iteration with the available states and isolate failure handling so it can evolve.

## Tradeoffs

- CTAs will initially navigate to module pages, not to pre-filtered views, because recent list filters are local state rather than URL-driven.
- Metrics are computed client-side, which is acceptable for current data volume and avoids backend scope.
- Refactoring before adding new sections reduces risk of a giant untestable dashboard component.
