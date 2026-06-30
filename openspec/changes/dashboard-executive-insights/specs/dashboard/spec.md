# dashboard delta

## ADDED Requirements

### Requirement: Executive Inicio dashboard

The Inicio page SHALL act as an executive dashboard that summarizes commercial performance and operational risk using existing frontend data.

#### Scenario: Show executive KPIs

- **GIVEN** deals, tasks, contacts and companies have loaded
- **WHEN** the user opens `/`
- **THEN** the dashboard shows open pipeline, weighted pipeline, overdue task count and upcoming close count.

### Requirement: Actionable dashboard alerts

The dashboard SHALL surface actionable alerts for CRM risks detected from loaded data.

#### Scenario: Deals without next task

- **GIVEN** there are open deals
- **AND** at least one open deal has no incomplete future task associated with it
- **WHEN** the dashboard renders alerts
- **THEN** it shows an alert explaining that open deals need a next task
- **AND** the alert links to the Tratos module.

#### Scenario: Data hygiene alerts

- **GIVEN** companies without owner, contacts without email or open deals without expected close date exist
- **WHEN** the dashboard renders CRM health
- **THEN** it lists those issues with counts and links to the relevant modules.

### Requirement: Prioritized upcoming actions

The dashboard SHALL show a prioritized list of tasks that require attention.

#### Scenario: Sort upcoming actions

- **GIVEN** there are overdue tasks and upcoming tasks
- **WHEN** the dashboard derives upcoming actions
- **THEN** overdue tasks appear before future tasks
- **AND** tasks with higher priority appear before lower priority tasks when dates are comparable
- **AND** each task links to `/tareas/:id`.

### Requirement: Upcoming commercial closes

The dashboard SHALL show open deals with expected close dates in the next 30 days.

#### Scenario: Show upcoming closes

- **GIVEN** open deals have expected close dates
- **WHEN** some close dates are within the next 30 days
- **THEN** those deals are listed ordered by nearest close date
- **AND** each deal links to `/tratos/:id`.

### Requirement: Frontend-only dashboard evolution

The dashboard SHALL use existing frontend hooks and SHALL NOT require backend endpoint changes.

#### Scenario: Existing route remains Inicio

- **GIVEN** the user navigates to `/`
- **WHEN** the dashboard loads
- **THEN** it remains the Inicio page shown by the sidebar
- **AND** no duplicate dashboard route is introduced.
