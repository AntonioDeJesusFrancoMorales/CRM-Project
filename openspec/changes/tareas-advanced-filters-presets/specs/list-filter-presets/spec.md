# list-filter-presets delta

## ADDED Requirements

### Requirement: Tareas filters apply to every task view

The Tareas page SHALL expose its filters outside the Lista/Kanban tabs and apply them to both the tabular list and embedded Kanban.

#### Scenario: Filtered Kanban cards

- **GIVEN** the Tareas page is on the Kanban tab
- **WHEN** the user filters by task title
- **THEN** Kanban cards whose `tareaId` is not in the filtered task set are hidden
- **AND** Kanban columns remain visible

### Requirement: Tareas local presets

The Tareas page SHALL allow saving, applying and deleting local filter presets without backend persistence.

#### Scenario: Save and apply a local preset

- **GIVEN** the user has active Tareas filters
- **WHEN** the user saves a named view
- **THEN** the preset is stored in localStorage under the Tareas presets key
- **AND** applying it restores the saved filter state.
