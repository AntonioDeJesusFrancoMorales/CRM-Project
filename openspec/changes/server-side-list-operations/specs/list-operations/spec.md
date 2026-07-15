# list-operations delta spec

## ADDED Requirements

### Requirement: Frontend supports server pages
Frontend list data access MUST support both legacy array responses and paginated responses from the backend.

#### Scenario: legacy consumer receives array
- **WHEN** an existing hook receives `{ items: [...] }`
- **THEN** it returns the `items` array to existing consumers.

#### Scenario: paginated consumer receives metadata
- **WHEN** a paginated hook is used
- **THEN** it exposes `items` plus total/page metadata.
