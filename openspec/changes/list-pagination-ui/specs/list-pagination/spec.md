# list-pagination delta spec

## ADDED Requirements

### Requirement: Visible pagination controls
List screens MUST show current range, total records, previous/next page actions, and page size selector when using paginated data.

#### Scenario: user changes page size
- **WHEN** the user selects a new page size
- **THEN** the page resets to the first page and reloads with the selected size.

### Requirement: Sortable table headers
Supported table columns SHOULD be sortable by clicking their header.

#### Scenario: user toggles sort
- **WHEN** the user clicks the active sortable header
- **THEN** sort direction toggles between ascending and descending.

### Requirement: Kanban remains unpaginated
Kanban tabs for Tratos and Tareas MUST NOT use the paginated list dataset for cards.
