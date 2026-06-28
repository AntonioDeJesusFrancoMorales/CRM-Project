# Spec: list-filter-presets

## ADDED Requirements

### Requirement: Client-side advanced filters for deals

The system SHALL allow users to filter the deals page using advanced criteria without requesting filtered data from the backend.

#### Scenario: Filter deals by status

- **WHEN** the user selects a deal status filter in the Deals list
- **THEN** the visible rows SHALL include only deals matching that status
- **AND** no new backend request SHALL be made for filtered deal data

#### Scenario: Filter deals by contract type

- **WHEN** the user selects a contract type filter
- **THEN** the visible rows SHALL include only deals with that contract type

#### Scenario: Filter deals by responsible user

- **WHEN** the user selects a responsible user filter
- **THEN** the visible rows SHALL include only deals assigned to that user

#### Scenario: Filter deals by contact

- **WHEN** the user selects a contact filter
- **THEN** the visible rows SHALL include only deals linked to that contact

#### Scenario: Filter deals by estimated value range

- **WHEN** the user enters minimum and/or maximum estimated value filters
- **THEN** the visible rows SHALL include only deals whose estimated value is inside the selected range
- **AND** deals with null estimated value SHALL NOT match an active numeric range filter

#### Scenario: Filter deals by expected close date

- **WHEN** the user selects an expected close date filter
- **THEN** the visible rows SHALL include only deals matching that date bucket
- **AND** null expected close dates SHALL match only the `sin fecha` bucket

### Requirement: Deals search remains client-side

The system SHALL keep the existing deal name search behavior while combining it with advanced filters.

#### Scenario: Search and filters combine

- **WHEN** the user enters a search term and selects one or more filters
- **THEN** the visible rows SHALL match both the search term and all active filters

### Requirement: Local filter presets for deals

The system SHALL allow users to save, apply, and delete local filter presets for the deals list.

#### Scenario: Save current filters as a preset

- **WHEN** the user saves the current deals filters with a preset name
- **THEN** the preset SHALL be stored in browser localStorage
- **AND** the preset SHALL be available without a page reload

#### Scenario: Apply a saved preset

- **GIVEN** a saved deals filter preset exists
- **WHEN** the user applies that preset
- **THEN** the deals filters SHALL update to the preset values
- **AND** the visible rows SHALL reflect those filters

#### Scenario: Delete a saved preset

- **GIVEN** a saved deals filter preset exists
- **WHEN** the user deletes that preset
- **THEN** the preset SHALL be removed from browser localStorage
- **AND** it SHALL no longer be offered in the preset controls

#### Scenario: Corrupt preset storage

- **GIVEN** localStorage contains invalid preset data
- **WHEN** the deals list loads
- **THEN** the page SHALL NOT crash
- **AND** the preset list SHALL behave as empty

### Requirement: No backend or contract changes

The system SHALL implement deal filters and presets entirely in the frontend.

#### Scenario: Changing filters does not hit backend

- **WHEN** the user changes any advanced filter or applies a preset
- **THEN** the frontend SHALL NOT send filter query parameters to `/api/tratos/get-all`
- **AND** the frontend SHALL NOT refetch deals solely due to filter changes

### Requirement: Results feedback

The system SHALL show feedback about how many deals are visible after filters are applied.

#### Scenario: Active filters reduce results

- **WHEN** filters reduce the deal list
- **THEN** the user SHALL see a count such as `Mostrando X de Y tratos`

### Requirement: Deal filters apply to Kanban

The system SHALL apply the same deal filters to the Kanban representation of deals.

#### Scenario: Filtered Kanban shows matching deal cards only

- **WHEN** the user applies deal filters and switches to the Kanban tab
- **THEN** Kanban SHALL show only cards whose deal matches the active filters
- **AND** Kanban columns SHALL remain visible even when no cards match

#### Scenario: No active filters preserve existing Kanban behavior

- **WHEN** no deal filters are active
- **THEN** Kanban SHALL show the same deal cards it showed before this change

### Requirement: Clear filters

The system SHALL allow users to reset all deal filters to their default empty state.

#### Scenario: Clear all filters

- **WHEN** the user activates `Limpiar filtros`
- **THEN** search and advanced filters SHALL reset
- **AND** all deals SHALL be visible again in the list tab
